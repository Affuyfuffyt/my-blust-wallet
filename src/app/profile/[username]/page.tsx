// src/app/profile/[username]/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Post, User as UserType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Grid3x3, Bookmark, UserPlus, UserCheck, BadgeCheck } from 'lucide-react';
import Loading from '../../loading';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, loading, getAllUsers, getPostsByUsername, toggleFollow } = useAuth();
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  const usernameParam = Array.isArray(params.username) ? params.username[0] : params.username;
  const username = decodeURIComponent(usernameParam.replace('@', ''));

  const fetchProfileData = useCallback(async () => {
    if (!loading && currentUser) {
      if (currentUser.profile.username === username) {
        router.replace('/profile');
        return;
      }
      
      const allUsers = getAllUsers(true);
      const foundUser = allUsers.find(u => u.profile.username === username);
      
      if (foundUser) {
        setProfileUser(foundUser);
        const posts = await getPostsByUsername(foundUser.profile.username);
        setUserPosts(posts);
      } else {
        router.replace('/app');
      }
    }
  }, [username, loading, currentUser, getAllUsers, getPostsByUsername, router]);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
      return;
    }
    fetchProfileData();
  }, [username, loading, currentUser, fetchProfileData]);
  
  const handleFollowToggle = () => {
    if (profileUser) {
      toggleFollow(profileUser.uid);
      // Optimistic update
      setProfileUser(prev => {
        if (!prev || !currentUser) return prev;
        const isFollowing = currentUser.profile.following?.includes(prev.uid);
        return {
            ...prev,
            profile: {
                ...prev.profile,
                followers: isFollowing 
                    ? prev.profile.followers?.filter(uid => uid !== currentUser.uid)
                    : [...(prev.profile.followers || []), currentUser.uid]
            }
        }
      });
      // Force a re-fetch of current user's following list for accurate state
       const updatedCurrentUser = { ...currentUser, profile: { ...currentUser.profile, following: isFollowing ? currentUser.profile.following.filter(id => id !== profileUser.uid) : [...(currentUser.profile.following || []), profileUser.uid] }};
    }
  };

  if (loading || !currentUser || !profileUser) {
    return <Loading />;
  }

  const isFollowing = currentUser.profile.following?.includes(profileUser.uid);
  
  const stats = {
    posts: userPosts.length,
    followers: profileUser.profile.followers?.length ?? 0,
    following: profileUser.profile.following?.length ?? 0,
  };


  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in-50 duration-500">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="العودة">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1">
            <h1 className="text-lg font-bold">{profileUser.profile.username}</h1>
            {profileUser.isVerified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
          </div>
          <div className="w-9"></div> {/* Placeholder for spacing */}
        </div>
      </header>
      
      <main className="container mx-auto max-w-lg p-4 md:p-6">
        {/* Profile Info */}
        <div className="flex items-center gap-8">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-md">
                <AvatarImage src={profileUser.profile.avatarUrl} alt={profileUser.profile.name} />
                <AvatarFallback>{profileUser.profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xl font-bold">{stats.posts}</p>
                    <p className="text-sm text-muted-foreground">منشورات</p>
                </div>
                <div>
                    <p className="text-xl font-bold">{stats.followers}</p>
                    <p className="text-sm text-muted-foreground">متابعون</p>
                </div>
                <div>
                    <p className="text-xl font-bold">{stats.following}</p>
                    <p className="text-sm text-muted-foreground">أتابع</p>
                </div>
            </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <h2 className="font-semibold flex items-center gap-1">
            {profileUser.profile.name}
            {profileUser.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
          </h2>
          <p className="text-sm text-muted-foreground">{profileUser.profile.bio || "لا يوجد نبذة تعريفية."}</p>
        </div>

        {/* Follow/Unfollow Button */}
        <Button 
            variant={isFollowing ? 'secondary' : 'default'} 
            className="mt-4 w-full gap-2"
            onClick={handleFollowToggle}
        >
            {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
        </Button>
        
        {/* Posts Tabs */}
        <Tabs defaultValue="posts" className="w-full mt-8">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    المنشورات
                </TabsTrigger>
                <TabsTrigger value="saved" disabled className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    المحفوظة
                </TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-4">
               {userPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                    {userPosts.map(post => (
                        <div key={post.id} className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                           {post.imageUrl ? (
                               <Image 
                                 src={post.imageUrl} 
                                 alt={`منشور بواسطة ${post.authorUsername}`} 
                                 fill 
                                 style={{ objectFit: 'cover' }}
                                 className="transition-transform hover:scale-105"
                               />
                           ) : (
                            <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                                {post.content.substring(0, 50)}...
                            </div>
                           )}
                        </div>
                    ))}
                </div>
               ) : (
                <Card className="mt-8">
                  <CardContent className="pt-6">
                    <div className="text-center">
                        <Grid3x3 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">لا توجد منشورات بعد</h3>
                        <p className="mt-2 text-sm text-muted-foreground">لم يقم هذا المستخدم بنشر أي شيء حتى الآن.</p>
                    </div>
                  </CardContent>
                </Card>
               )}
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
