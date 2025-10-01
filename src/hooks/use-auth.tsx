// src/hooks/use-auth.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Profile, Post, Comment, Notification, AppItem, WithdrawalRequest, ChatConversation, ChatMessage } from '@/lib/types';
import { auth, db, storage } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  sendEmailVerification,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, arrayUnion, arrayRemove, writeBatch, orderBy, Timestamp, serverTimestamp, increment, runTransaction, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const SYSTEM_USERNAME = "@blust";
const MIN_WITHDRAWAL_AMOUNT = 60000;
const VERIFICATION_COST = 1000;
const BLUST_CLAIM_AMOUNT = 100;
const BLUST_CLAIM_COOLDOWN_HOURS = 24;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password_provided: string) => Promise<{ user: User | null; banned: boolean; banReason?: string; banEndDate?: string }>;
    signup: (name: string, username: string, email: string, password_provided: string) => Promise<User | null>;
    logout: () => Promise<void>;
    updateUserProfile: (profileUpdates: Partial<Profile>, avatarFile?: File | null) => Promise<User | null>;
    getAllUsers: (includeAdmin?: boolean) => User[];
    updateUserByAdmin: (email: string, updates: Partial<User & { profile: Partial<Profile> }>) => Promise<User | null>;
    deleteUserByAdmin: (email: string) => Promise<void>;
    banUserByAdmin: (email: string, reason: string, days: number) => Promise<void>;
    unbanUserByAdmin: (email: string) => Promise<void>;
    getAllPosts: () => Promise<Post[]>;
    addPost: (content: string, image?: File | null) => Promise<void>;
    getPostsByUsername: (username: string) => Promise<Post[]>;
    addPostAsAdmin: (content: string, image?: File | null) => Promise<void>;
    toggleLikePost: (postId: string) => Promise<void>;
    addCommentToPost: (postId: string, content: string, mediaFile?: File | null) => Promise<Comment | null>;
    addReplyToComment: (postId: string, parentCommentId: number, content: string, mediaFile?: File | null) => Promise<Comment | null>;
    toggleLikeComment: (postId: string, commentId: number) => Promise<void>;
    markNotificationsAsRead: () => Promise<void>;
    toggleFollow: (targetUserUID: string) => Promise<void>;
    addApp: (name: string, description: string, icon: File, downloadUrl: string) => Promise<AppItem | null>;
    getApps: () => Promise<AppItem[]>;
    deleteApp: (appId: string) => Promise<void>;
    claimBlust: () => Promise<{ success: boolean; newBalance?: number; message?: string }>;
    submitWithdrawalRequest: (amount: number, method: 'zain_cash' | 'mastercard', walletNumber: string) => Promise<WithdrawalRequest | null>;
    getAllWithdrawals: () => Promise<WithdrawalRequest[]>;
    updateWithdrawalStatus: (withdrawalId: string, status: 'completed' | 'rejected') => Promise<void>;
    verifyAccount: () => { success: boolean; message: string };
    getVerifiedUsers: () => Promise<User[]>;
    sendGift: (postId: string, amount: number) => Promise<void>;
    getConversationsForUser: () => Promise<ChatConversation[]>;
    getConversation: (conversationId: string) => Promise<ChatConversation | undefined>;
    sendMessage: (conversationId: string, content: string, mediaFile?: File) => Promise<ChatMessage | null>;
    startOrGetConversation: (targetUserEmail: string) => Promise<ChatConversation | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsersCache, setAllUsersCache] = useState<User[]>([]);

  const fetchAllUsers = useCallback(async (forceRefresh = false) => {
    if (allUsersCache.length > 0 && !forceRefresh) {
        return allUsersCache;
    }
    try {
      if(!auth.currentUser) return []; // Don't fetch if not logged in
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ ...doc.data() as User, uid: doc.id }));
      setAllUsersCache(usersList);
      return usersList;
    } catch (error) {
      console.error("Failed to fetch all users:", error);
      return [];
    }
  }, [allUsersCache]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
           // Check for verification status expiry
           if (userData.isVerified && userData.verificationEndDate) {
              if (new Date(userData.verificationEndDate) < new Date()) {
                userData.isVerified = false;
                userData.verificationEndDate = undefined;
                await updateDoc(userDocRef, { isVerified: false, verificationEndDate: undefined });
              }
            }
          setUser({ ...userData, uid: firebaseUser.uid });
          fetchAllUsers();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAllUsers]);


  const login = useCallback(async (email: string, password_provided: string): Promise<{ user: User | null; banned: boolean; banReason?: string; banEndDate?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password_provided);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        throw new Error("الرجاء التحقق من بريدك الإلكتروني قبل تسجيل الدخول.");
      }
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;

        if (userData.isBanned && userData.banEndDate) {
          const banEndDate = new Date(userData.banEndDate);
          if (banEndDate > new Date()) {
            await signOut(auth);
            return { user: null, banned: true, banReason: userData.banReason, banEndDate: userData.banEndDate };
          } else {
             await updateDoc(doc(db, 'users', userCredential.user.uid), {
                isBanned: false,
                banReason: undefined,
                banEndDate: undefined,
             });
             userData.isBanned = false;
          }
        }
        
        const loggedInUser: User = { ...userData, uid: userCredential.user.uid };
        setUser(loggedInUser);
        return { user: loggedInUser, banned: false };
      }
      return { user: null, banned: false };
    } catch (error: any) {
        if (error.message.includes("الرجاء التحقق من بريدك الإلكتروني")) {
            throw error;
        }
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        }
        console.error("Login failed", error);
        throw new Error("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    }
  }, []);
  
  const signup = useCallback(async (name: string, username: string, email: string, password_provided: string): Promise<User | null> => {
      // Step 1: Create user in Firebase Auth
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password_provided);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          throw new Error("هذا البريد الإلكتروني مستخدم بالفعل.");
        }
        console.error("Auth creation failed:", error);
        throw new Error("فشل إنشاء حساب المصادقة.");
      }
      
      const firebaseUser = userCredential.user;

      try {
        // Step 2: Check if username is taken in Firestore. This requires auth.
        const usernameQuery = query(collection(db, 'users'), where('profile.username', '==', username));
        const usernameQuerySnapshot = await getDocs(usernameQuery);
        if (!usernameQuerySnapshot.empty) {
            throw new Error("اسم المستخدم هذا محجوز بالفعل.");
        }

        // Step 3: Create user document in Firestore
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          profile: {
            name: name,
            username: username,
            bio: '',
            avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            followers: [],
            following: [],
          },
          notifications: [],
          isAdmin: false,
          isBanned: false,
          blustBalance: 0,
          lastBlustClaim: null,
          withdrawalRequests: [],
          isVerified: false,
          conversations: [],
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

        // Step 4: Send verification email
        await sendEmailVerification(firebaseUser);
        
        // Step 5: Sign out to force user to verify email
        await signOut(auth);

        return newUser;
        
      } catch (error: any) {
          // If Firestore operations fail, delete the created Firebase Auth user to allow retry
          if (firebaseUser) {
              await deleteUser(firebaseUser).catch(e => console.error("Failed to cleanup auth user:", e));
          }
          console.error("Signup process failed during Firestore operations:", error);
          if (error.message.includes("اسم المستخدم")) {
              throw error; // Re-throw username specific error
          }
          throw new Error("فشل إنشاء ملف المستخدم. حاول مرة أخرى.");
      }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);
  
  const addNotification = useCallback(async (targetUserId: string, notification: Omit<Notification, 'id' | 'read' | 'createdAt' | 'actorProfile'>) => {
     if (!user || targetUserId === user.uid) return;

    const newNotification: Omit<Notification, 'actorProfile'> & { createdAt: any } = {
        ...notification,
        id: `${Date.now()}-${notification.actorUsername}`,
        read: false,
        createdAt: serverTimestamp(),
    };
    
    const targetUserDocRef = doc(db, 'users', targetUserId);
    await updateDoc(targetUserDocRef, {
        notifications: arrayUnion(newNotification)
    });
  }, [user]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!user || !user.uid || !user.notifications) return;
  
    const userDocRef = doc(db, 'users', user.uid);
    const notificationsToUpdate = user.notifications.filter(n => !n.read);

    if (notificationsToUpdate.length === 0) return;

    // Create a new array with updated 'read' status
    const updatedNotifications = user.notifications.map(n => 
        n.read ? n : { ...n, read: true }
    );

    // Update Firestore
    await updateDoc(userDocRef, {
        notifications: updatedNotifications
    });

    // Update local state
    setUser(prev => prev ? { ...prev, notifications: updatedNotifications } : null);
}, [user]);


   const updateUserByAdmin = useCallback(async (email: string, updates: Partial<User & { profile: Partial<Profile> }>): Promise<User | null> => {
    if (!user?.isAdmin) return null;
    
    try {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) {
            console.error("No user found with email:", email);
            return null;
        }
        const userDocRef = querySnapshot.docs[0].ref;
        const userToUpdate = querySnapshot.docs[0].data() as User;

        const updatedData: { [key: string]: any } = {};

        if (updates.profile) {
            if(updates.profile.name) updatedData['profile.name'] = updates.profile.name;
            if(updates.profile.username) updatedData['profile.username'] = updates.profile.username;
            if(updates.profile.bio) updatedData['profile.bio'] = updates.profile.bio;
        }
        if (updates.password) {
            console.warn("Password update from client-side admin is not recommended. This functionality should be a backend process.");
        }
        
        await updateDoc(userDocRef, updatedData);

        const updatedUser = { ...userToUpdate, ...updates };

        if (user.uid === userToUpdate.uid) {
            setUser(updatedUser);
        }
        await fetchAllUsers(true);
        return updatedUser;
    } catch (error) {
        console.error("Failed to update user by admin", error);
        return null;
    }
  }, [user, fetchAllUsers]);
  
  const deleteUserByAdmin = useCallback(async (email: string) => {
    if (!user?.isAdmin) return;
     try {
        console.warn("User deletion from Firebase Auth is a server-side task. Removing user from Firestore only.");
        const userQuery = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) {
          console.log("No user found to delete.");
          return;
        }
        const userDocRef = querySnapshot.docs[0].ref;
        await deleteDoc(userDocRef);
        console.log(`User doc deleted: ${userDocRef.path}`);
        await fetchAllUsers(true);
     } catch (error) {
        console.error("Failed to delete user", error);
     }
  }, [user, fetchAllUsers]);

  const banUserByAdmin = useCallback(async (email: string, reason: string, days: number) => {
    if (!user?.isAdmin) return;
    try {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) return;
        const userDocRef = querySnapshot.docs[0].ref;

        const banEndDate = new Date();
        banEndDate.setDate(banEndDate.getDate() + days);
        await updateDoc(userDocRef, {
            isBanned: true,
            banReason: reason,
            banEndDate: banEndDate.toISOString()
        });
        await fetchAllUsers(true);
    } catch (error) {
      console.error("Failed to ban user", error);
    }
  }, [user, fetchAllUsers]);

  const unbanUserByAdmin = useCallback(async (email: string) => {
    if (!user?.isAdmin) return;
    try {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) return;
        const userDocRef = querySnapshot.docs[0].ref;

        await updateDoc(userDocRef, {
            isBanned: false,
            banReason: null,
            banEndDate: null
        });
        await fetchAllUsers(true);
    } catch (error) {
      console.error("Failed to unban user", error);
    }
  }, [user, fetchAllUsers]);


  const updateUserProfile = useCallback(async (profileUpdates: Partial<Profile>, avatarFile?: File | null): Promise<User | null> => {
    if (!user || !user.uid || !auth.currentUser) return null;
    
    try {
        let avatarUrl = user.profile.avatarUrl;
        if (avatarFile) {
            const storageRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
            const snapshot = await uploadBytes(storageRef, avatarFile);
            avatarUrl = await getDownloadURL(snapshot.ref);
        }
        
        // Ensure username is not taken by another user
        if (profileUpdates.username && profileUpdates.username !== user.profile.username) {
            const usernameQuery = query(collection(db, 'users'), where('profile.username', '==', profileUpdates.username));
            const usernameSnapshot = await getDocs(usernameQuery);
            if (!usernameSnapshot.empty) {
                throw new Error("اسم المستخدم محجوز بالفعل.");
            }
        }


        const userDocRef = doc(db, 'users', user.uid);
        
        const updates: {[key: string]: any} = {};
        if (profileUpdates.name) updates['profile.name'] = profileUpdates.name;
        if (profileUpdates.username) updates['profile.username'] = profileUpdates.username;
        if (profileUpdates.bio !== undefined) updates['profile.bio'] = profileUpdates.bio;
        if (avatarUrl) updates['profile.avatarUrl'] = avatarUrl;


        await updateDoc(userDocRef, updates);
      
        const updatedUser: User = { ...user, profile: { ...user.profile, ...profileUpdates, avatarUrl }};
        setUser(updatedUser);
        await fetchAllUsers(true);
        return updatedUser;
    } catch (error) {
        console.error("Failed to update profile", error);
        throw error;
    }
  }, [user, fetchAllUsers]);

  const toggleFollow = useCallback(async (targetUserUID: string) => {
    if (!user || !user.uid || user.uid === targetUserUID) return;

    const currentUserDocRef = doc(db, 'users', user.uid);
    const targetUserDocRef = doc(db, 'users', targetUserUID);

    try {
        await runTransaction(db, async (transaction) => {
            const currentUserDoc = await transaction.get(currentUserDocRef);
            const targetUserDoc = await transaction.get(targetUserDocRef);

            if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
                throw "User does not exist!";
            }

            const currentUserData = currentUserDoc.data() as User;
            const isFollowing = currentUserData.profile.following?.includes(targetUserUID);
            
            if (isFollowing) {
                transaction.update(currentUserDocRef, { 'profile.following': arrayRemove(targetUserUID) });
                transaction.update(targetUserDocRef, { 'profile.followers': arrayRemove(user.uid) });
            } else {
                transaction.update(currentUserDocRef, { 'profile.following': arrayUnion(targetUserUID) });
                transaction.update(targetUserDocRef, { 'profile.followers': arrayUnion(user.uid) });
            }
        });

        const isFollowing = user.profile.following?.includes(targetUserUID);
        
        const updatedFollowing = isFollowing 
            ? user.profile.following.filter(uid => uid !== targetUserUID)
            : [...(user.profile.following || []), targetUserUID];

        const updatedUser = { ...user, profile: { ...user.profile, following: updatedFollowing }};
        setUser(updatedUser);

        if (!isFollowing) {
            const targetUserDoc = await getDoc(targetUserDocRef);
            if(targetUserDoc.exists()){
                const targetUserData = targetUserDoc.data() as User;
                addNotification(targetUserData.uid, {
                    type: 'follow',
                    actorUsername: user.profile.username,
                });
            }
        }
        await fetchAllUsers(true);

    } catch (error) {
        console.error("Toggle follow failed", error);
    }
  }, [user, addNotification, fetchAllUsers]);
  
  const getAllUsers = useCallback((includeAdmin = false): User[] => {
    if (!allUsersCache || allUsersCache.length === 0) {
      fetchAllUsers();
      return [];
    }
    if (includeAdmin) return allUsersCache;
    return allUsersCache.filter(u => !u.isAdmin);
  }, [allUsersCache, fetchAllUsers]);

    const getAllPosts = useCallback(async (): Promise<Post[]> => {
    if (!auth.currentUser) return [];
    const postsCol = collection(db, 'posts');
    const q = query(postsCol, orderBy('createdAt', 'desc'));
    const postSnapshot = await getDocs(q);
    const postList = postSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            ...data, 
            id: doc.id,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as Post;
    });
    return postList;
  }, []);


  const getPostsByUsername = useCallback(async (username: string): Promise<Post[]> => {
    if (!auth.currentUser) return [];
    try {
        const postsCol = collection(db, 'posts');
        const q = query(postsCol, where('authorUsername', '==', username), orderBy('createdAt', 'desc'));
        const postSnapshot = await getDocs(q);
        const postList = postSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                ...data, 
                id: doc.id,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            } as Post;
        });
        return postList;
    } catch(e) {
        console.error("Error getting posts by username:", e);
        return [];
    }
  }, []);

 const addPost = useCallback(async (content: string, image?: File | null) => {
    if (!user) return;

    let postData: any = {
        authorUsername: user.profile.username,
        content: content || "",
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: serverTimestamp(),
    };

    if (image) {
        const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        postData.imageUrl = await getDownloadURL(snapshot.ref);
    }

    await addDoc(collection(db, 'posts'), postData);
}, [user]);


  const addPostAsAdmin = useCallback(async (content: string, image?: File | null) => {
    if (!user || !user.isAdmin) return;
    const newPostData: any = {
      authorUsername: SYSTEM_USERNAME,
      content: content || "",
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp(),
    };

    if (image) {
      const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(storageRef, image);
      newPostData.imageUrl = await getDownloadURL(snapshot.ref);
    }

    await addDoc(collection(db, 'posts'), newPostData);

  }, [user]);


    const toggleLikePost = useCallback(async (postId: string) => {
    if (!user || !user.email) return;

    const postRef = doc(db, 'posts', postId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const postSnap = await transaction.get(postRef);
            if (!postSnap.exists()) {
                throw "Post does not exist!";
            }

            const postData = postSnap.data() as Post;
            const liked = postData.likedBy.includes(user.email!);
            
            transaction.update(postRef, {
                likedBy: liked ? arrayRemove(user.email) : arrayUnion(user.email),
                likes: increment(liked ? -1 : 1)
            });

            if (!liked && postData.authorUsername !== user.profile.username) {
                const authorQuery = query(collection(db, 'users'), where('profile.username', '==', postData.authorUsername));
                const authorSnap = await getDocs(authorQuery);
                if (!authorSnap.empty) {
                    const authorUid = authorSnap.docs[0].id;
                    addNotification(authorUid, {
                        type: 'like',
                        actorUsername: user.profile.username,
                        postId: postId,
                    });
                }
            }
        });
    } catch (e) {
        console.error("Toggle like failed: ", e);
    }

  }, [user, addNotification]);
  
 const addCommentToPost = useCallback(async (postId: string, content: string, mediaFile?: File | null): Promise<Comment | null> => {
    if (!user) return null;

    let newComment: any = {
        id: Date.now(),
        authorUsername: user.profile.username,
        content: content || "",
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        replies: [],
    };
    
    if (mediaFile) {
        const storageRef = ref(storage, `comments/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(storageRef, mediaFile);
        const mediaUrl = await getDownloadURL(snapshot.ref);
        if (mediaFile.type.startsWith('image/')) {
            newComment.imageUrl = mediaUrl;
        } else if (mediaFile.type.startsWith('video/')) {
            newComment.videoUrl = mediaUrl;
        }
    }
    
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
        comments: arrayUnion(newComment)
    });

    const postSnap = await getDoc(postRef);
    const postData = postSnap.data() as Post;
    if (postData.authorUsername !== user.profile.username) {
        const authorQuery = query(collection(db, 'users'), where('profile.username', '==', postData.authorUsername));
        const authorSnap = await getDocs(authorQuery);
        if (!authorSnap.empty) {
            const authorUid = authorSnap.docs[0].id;
            addNotification(authorUid, {
                type: 'comment',
                actorUsername: user.profile.username,
                postId: postId,
            });
        }
    }
    
    return {
        ...newComment,
        author: user.profile,
    };

}, [user, addNotification]);
 
  const addReplyToComment = useCallback(async (postId: string, parentCommentId: number, content: string, mediaFile?: File | null): Promise<Comment | null> => {
    if (!user) return null;
    try {
        const postRef = doc(db, 'posts', postId);

        let newReply: any = {
            id: Date.now(),
            authorUsername: user.profile.username,
            content: content || "",
            createdAt: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            replies: [],
        };
        
        if (mediaFile) {
            const storageRef = ref(storage, `replies/${Date.now()}_${mediaFile.name}`);
            const snapshot = await uploadBytes(storageRef, mediaFile);
            const mediaUrl = await getDownloadURL(snapshot.ref);
            if (mediaFile.type.startsWith('image/')) {
                newReply.imageUrl = mediaUrl;
            } else if (mediaFile.type.startsWith('video/')) {
                newReply.videoUrl = mediaUrl;
            }
        }

        await runTransaction(db, async (transaction) => {
            const postSnap = await transaction.get(postRef);
            if (!postSnap.exists()) throw "Post not found";
            
            const postData = postSnap.data() as Post;
            
            const findAndAddReply = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                    if (comment.id === parentCommentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), newReply]
                        };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: findAndAddReply(comment.replies)
                        };
                    }
                    return comment;
                });
            };

            const updatedComments = findAndAddReply(postData.comments || []);
            transaction.update(postRef, { comments: updatedComments });
        });

        return {
            ...newReply,
            author: user.profile
        };

    } catch (error) {
        console.error("Failed to add reply", error);
        return null;
    }
}, [user]);

    const toggleLikeComment = useCallback(async (postId: string, commentId: number) => {
    if (!user) return;
    try {
        const postRef = doc(db, 'posts', postId);
        
        await runTransaction(db, async (transaction) => {
            const postSnap = await transaction.get(postRef);
            if (!postSnap.exists()) throw "Post not found";

            const postData = postSnap.data() as Post;
            
            const findAndToggleLike = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                    if (comment.id === commentId) {
                        const liked = (comment.likedBy || []).includes(user.email!);
                        const newLikedBy = liked ? (comment.likedBy || []).filter(e => e !== user.email) : [...(comment.likedBy || []), user.email!];
                        return {
                            ...comment,
                            likedBy: newLikedBy,
                            likes: newLikedBy.length,
                        };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                      return { ...comment, replies: findAndToggleLike(comment.replies) };
                    }
                    return comment;
                });
            };
            
            const updatedComments = findAndToggleLike(postData.comments);
            transaction.update(postRef, { comments: updatedComments });
        });
    } catch (error) {
        console.error("Failed to like comment", error);
    }
  }, [user]);

  // App Management
  const addApp = useCallback(async (name: string, description: string, icon: File, downloadUrl: string): Promise<AppItem | null> => {
    if (!user || !user.isAdmin) {
      throw new Error("Only admins can add apps.");
    }
    
    const storageRef = ref(storage, `app_icons/${Date.now()}_${icon.name}`);
    const snapshot = await uploadBytes(storageRef, icon);
    const iconUrl = await getDownloadURL(snapshot.ref);

    const newApp = {
      name,
      description,
      iconUrl,
      downloadUrl,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'apps'), newApp);

    return { id: docRef.id, ...newApp, createdAt: new Date().toISOString() } as unknown as AppItem;
    
  }, [user]);

  const getApps = useCallback(async (): Promise<AppItem[]> => {
     if (!auth.currentUser) return [];
     const appsCol = collection(db, 'apps');
     const q = query(appsCol, orderBy('createdAt', 'desc'));
     const snapshot = await getDocs(q);
     return snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
     } as AppItem));
  }, []);

  const deleteApp = useCallback(async (appId: string) => {
    if (!user || !user.isAdmin) {
      throw new Error("Only admins can delete apps.");
    }
    await deleteDoc(doc(db, 'apps', appId));
  }, [user]);

  // Blust mining
  const claimBlust = useCallback(async (): Promise<{ success: boolean, newBalance?: number, message?: string }> => {
     if (!user || !user.uid) return { success: false, message: 'المستخدم غير مسجل.' };

     const userRef = doc(db, 'users', user.uid);

     try {
        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User not found");
            }
            const userData = userSnap.data() as User;
            
            let canClaim = false;
            if (!userData.lastBlustClaim) {
                canClaim = true;
            } else {
                const lastClaimDate = new Date(userData.lastBlustClaim);
                const nextClaimDate = new Date(lastClaimDate.getTime() + BLUST_CLAIM_COOLDOWN_HOURS * 60 * 60 * 1000);
                if (new Date() > nextClaimDate) {
                    canClaim = true;
                }
            }

            if (!canClaim) {
                throw new Error('لا يمكنك المطالبة الآن. الرجاء الانتظار.');
            }

            const newLastClaim = new Date().toISOString();
            transaction.update(userRef, {
                blustBalance: increment(BLUST_CLAIM_AMOUNT),
                lastBlustClaim: newLastClaim
            });

            setUser(prev => prev ? { ...prev, blustBalance: (prev.blustBalance ?? 0) + BLUST_CLAIM_AMOUNT, lastBlustClaim: newLastClaim } : null);
        });
        
        return { success: true, newBalance: (user.blustBalance ?? 0) + BLUST_CLAIM_AMOUNT };

     } catch(e: any) {
        console.error("Failed to claim blust", e);
        return { success: false, message: e.message || 'حدث خطأ.' };
     }
  }, [user]);

  // Withdrawals
  const getAllWithdrawals = useCallback(async (): Promise<WithdrawalRequest[]> => {
    if (!auth.currentUser) return [];
    const reqsCol = collection(db, 'withdrawals');
    const q = query(reqsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const allUsers = await fetchAllUsers(true);

    const withdrawals = snapshot.docs.map(doc => {
        const data = doc.data();
        const requestUser = allUsers.find(u => u.email === data.userEmail);
        return {
            id: doc.id,
            ...data,
            user: requestUser,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString()
        } as unknown as WithdrawalRequest;
    });
    return withdrawals;
  }, [fetchAllUsers]);

  const submitWithdrawalRequest = useCallback(async (amount: number, method: 'zain_cash' | 'mastercard', walletNumber: string): Promise<WithdrawalRequest | null> => {
     if (!user) throw new Error("المستخدم غير مسجل.");
     if ((user.blustBalance ?? 0) < amount) throw new Error("رصيد غير كافٍ.");
     if (amount < MIN_WITHDRAWAL_AMOUNT) throw new Error(`الحد الأدنى للسحب هو ${MIN_WITHDRAWAL_AMOUNT}.`);

     const userRef = doc(db, 'users', user.uid);
     const reqsCol = collection(db, 'withdrawals');

     await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists() || (userDoc.data().blustBalance ?? 0) < amount) {
            throw new Error("رصيد غير كافٍ.");
        }
        
        transaction.update(userRef, { blustBalance: increment(-amount) });

        const newRequest = {
            userEmail: user.email,
            amount,
            method,
            walletNumber,
            status: 'pending' as const,
            createdAt: serverTimestamp()
        };

        const newReqRef = doc(reqsCol);
        transaction.set(newReqRef, newRequest);
     });

    setUser(prev => prev ? { ...prev, blustBalance: (prev.blustBalance ?? 0) - amount } : null);
    
    return {} as WithdrawalRequest; // Placeholder for UI update
  }, [user]);
  
  const updateWithdrawalStatus = useCallback(async (withdrawalId: string, status: 'completed' | 'rejected') => {
    if (!user || !user.isAdmin) throw new Error("غير مصرح به.");

    const reqRef = doc(db, 'withdrawals', withdrawalId);

    await runTransaction(db, async (transaction) => {
        const reqDoc = await transaction.get(reqRef);
        if (!reqDoc.exists()) throw new Error("الطلب غير موجود.");

        const reqData = reqDoc.data();
        
        // If rejecting, refund the user's balance
        if (status === 'rejected' && reqData.status === 'pending') {
            const userQuery = query(collection(db, 'users'), where('email', '==', reqData.userEmail));
            const userSnap = await getDocs(userQuery);
            if (!userSnap.empty) {
                const userRef = userSnap.docs[0].ref;
                transaction.update(userRef, { blustBalance: increment(reqData.amount) });
            }
        }
        transaction.update(reqRef, { status: status });
    });
  }, [user]);

  // Verification
  const verifyAccount = useCallback((): { success: boolean; message: string } => {
    if (!user || !user.uid) return { success: false, message: "يجب تسجيل الدخول." };
    if (user.isVerified) return { success: false, message: "الحساب موثق بالفعل." };
    if ((user.blustBalance ?? 0) < VERIFICATION_COST) return { success: false, message: "رصيد بلوست غير كافٍ." };

    const userRef = doc(db, 'users', user.uid);
    const verificationEndDate = new Date();
    verificationEndDate.setMonth(verificationEndDate.getMonth() + 1);

    updateDoc(userRef, {
        blustBalance: increment(-VERIFICATION_COST),
        isVerified: true,
        verificationEndDate: verificationEndDate.toISOString()
    }).then(() => {
        setUser(prev => prev ? {
            ...prev,
            blustBalance: (prev.blustBalance ?? 0) - VERIFICATION_COST,
            isVerified: true,
            verificationEndDate: verificationEndDate.toISOString()
        } : null);
    }).catch(e => {
        console.error(e);
    });

    return { success: true, message: `تم توثيق حسابك بنجاح لمدة شهر واحد مقابل ${VERIFICATION_COST} بلوست.` };

  }, [user]);

  const getVerifiedUsers = useCallback(async (): Promise<User[]> => {
    if (!auth.currentUser) return [];
    const q = query(collection(db, 'users'), where('isVerified', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  }, []);

    const sendGift = useCallback(async (postId: string, amount: number): Promise<void> => {
    if (!user || !user.uid || (user.blustBalance ?? 0) < amount) {
      throw new Error('رصيد غير كافٍ');
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const gifterRef = doc(db, 'users', user.uid);

      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        const gifterSnap = await transaction.get(gifterRef);

        if (!postSnap.exists() || !gifterSnap.exists()) {
          throw 'Post or user does not exist.';
        }
        
        const postData = postSnap.data() as Post;
        const authorUsername = postData.authorUsername;
        
        const authorQuery = query(collection(db, 'users'), where('profile.username', '==', authorUsername));
        const authorSnap = await getDocs(authorQuery);
        if (authorSnap.empty) {
            throw 'Author not found';
        }
        const authorRef = authorSnap.docs[0].ref;

        // 1. Decrement gifter's balance
        transaction.update(gifterRef, { blustBalance: increment(-amount) });

        // 2. Increment author's balance
        transaction.update(authorRef, { blustBalance: increment(amount) });
        
        // 3. Add a "gift" comment to the post
        const giftComment: Omit<Comment, 'author' | 'replies' > & { createdAt: any, id: any } = {
            id: Date.now(),
            authorUsername: user.profile.username,
            content: `أهدى ${amount} بلوست!`,
            createdAt: serverTimestamp(),
            likes: 0,
            likedBy: [],
            isGift: true,
            giftAmount: amount,
        };
        transaction.update(postRef, { comments: arrayUnion(giftComment) });
      });

      // Update local user state
      setUser(prev => prev ? { ...prev, blustBalance: (prev.blustBalance ?? 0) - amount } : null);

    } catch (e) {
      console.error("Failed to send gift:", e);
      throw new Error('فشل إرسال الهدية.');
    }

  }, [user]);

  // Chat
  const getConversationsForUser = useCallback(async (): Promise<ChatConversation[]> => {
    if (!user) return [];
    const q = query(collection(db, 'conversations'), where('participantEmails', 'array-contains', user.email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatConversation));
  }, [user]);

  const getConversation = useCallback(async (conversationId: string): Promise<ChatConversation | undefined> => {
    if (!auth.currentUser) return undefined;
    const docRef = doc(db, 'conversations', conversationId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ChatConversation : undefined;
  }, []);

  const startOrGetConversation = useCallback(async (targetUserEmail: string): Promise<ChatConversation | null> => {
    if (!user) return null;
    const participantEmails = [user.email!, targetUserEmail].sort();
    const conversationId = participantEmails.join('-');

    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);

    if (convSnap.exists()) {
        return { id: convSnap.id, ...convSnap.data() } as ChatConversation;
    } else {
        const newConversation = {
            participantEmails,
            messages: [],
        };
        await setDoc(convRef, newConversation);
        return { id: conversationId, ...newConversation };
    }
  }, [user]);

  const sendMessage = useCallback(async (conversationId: string, content: string, mediaFile?: File): Promise<ChatMessage | null> => {
    if (!user) return null;
    
    const newMessage: any = {
        senderEmail: user.email!,
        content,
        createdAt: serverTimestamp(),
    };
    
    if (mediaFile) {
        const storageRef = ref(storage, `chat_media/${conversationId}/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(storageRef, mediaFile);
        const mediaUrl = await getDownloadURL(snapshot.ref);
        if (mediaFile.type.startsWith('image/')) newMessage.imageUrl = mediaUrl;
        if (mediaFile.type.startsWith('video/')) newMessage.videoUrl = mediaUrl;
    }

    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
        messages: arrayUnion(newMessage)
    });
    
    return { ...newMessage, id: Date.now(), createdAt: new Date().toISOString() };
}, [user]);


  const authContextValue: AuthContextType = { user, loading, login, signup, logout, updateUserProfile, getAllUsers, updateUserByAdmin, deleteUserByAdmin, banUserByAdmin, unbanUserByAdmin, getAllPosts, addPost, getPostsByUsername, addPostAsAdmin, toggleLikePost, addCommentToPost, addReplyToComment, toggleLikeComment, markNotificationsAsRead, toggleFollow, addApp, getApps, deleteApp, claimBlust, submitWithdrawalRequest, getAllWithdrawals, updateWithdrawalStatus, verifyAccount, getVerifiedUsers, sendGift, getConversationsForUser, getConversation, sendMessage, startOrGetConversation };
  
  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
