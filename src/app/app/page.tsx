// src/app/app/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Gift, UserPlus, Image as ImageIcon, Send, X, Heart, Camera, RefreshCw, BadgeCheck, Coins } from "lucide-react";
import Image from 'next/image';
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Post, Comment, Profile, User } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";


function LikesDialog({ post, open, onOpenChange, onFollowToggle, allUsers }: { post: Post | null, open: boolean, onOpenChange: (open: boolean) => void, onFollowToggle: () => void, allUsers: User[] }) {
    const { user, toggleFollow } = useAuth();
    const [likers, setLikers] = useState<User[]>([]);

    useEffect(() => {
        if (post && open) {
            const usersWhoLiked = allUsers.filter(u => post.likedBy.includes(u.email));
            setLikers(usersWhoLiked);
        }
    }, [post, open, allUsers]);

    if (!user || !post) return null;

    const handleFollowToggle = (targetUserUID: string) => {
        toggleFollow(targetUserUID);
        onFollowToggle(); 
        const usersWhoLiked = allUsers.filter(u => post.likedBy.includes(u.email));
        setLikers(usersWhoLiked);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>الإعجابات</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-80">
                    <div className="space-y-4 p-1">
                        {likers.length > 0 ? likers.map(liker => {
                            const isCurrentUser = liker.email === user.email;
                            const isFollowing = user.profile.following?.includes(liker.uid);

                            return (
                                <div key={liker.email} className="flex items-center gap-3">
                                    <Link href={isCurrentUser ? '/profile' : `/profile/${liker.profile.username}`} className="flex items-center gap-3 flex-1" onClick={() => onOpenChange(false)}>
                                        <Avatar>
                                            <AvatarImage src={liker.profile.avatarUrl} alt={liker.profile.name} />
                                            <AvatarFallback>{liker.profile.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-semibold flex items-center gap-1">{liker.profile.name} {liker.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}</span>
                                            <span className="text-sm text-muted-foreground">@{liker.profile.username}</span>
                                        </div>
                                    </Link>
                                    {!isCurrentUser && (
                                        <Button
                                            variant={isFollowing ? 'secondary' : 'default'}
                                            size="sm"
                                            onClick={() => handleFollowToggle(liker.uid)}
                                        >
                                            {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                                        </Button>
                                    )}
                                </div>
                            )
                        }) : (
                            <p className="text-center text-muted-foreground py-4">لا توجد إعجابات بعد.</p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function GiftDialog({ 
    post, 
    open, 
    onOpenChange,
    onGiftSent,
}: { 
    post: Post | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    onGiftSent: () => void,
}) {
    const { user, sendGift } = useAuth();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [isGifting, setIsGifting] = useState(false);
    const { toast } = useToast();

    const giftOptions = [
        { amount: 100, icon: <Coins className="h-6 w-6 text-yellow-400"/>, color: "bg-yellow-400/10 hover:bg-yellow-400/20 border-yellow-400/20" },
        { amount: 500, icon: <Coins className="h-8 w-8 text-amber-500"/>, color: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20" },
        { amount: 2000, icon: <Coins className="h-10 w-10 text-orange-600"/>, color: "bg-orange-600/10 hover:bg-orange-600/20 border-orange-600/20" },
    ];
    
    const handleSendGift = async () => {
        if (!post || !selectedAmount || !user) return;

        if (user.blustBalance < selectedAmount) {
            toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: 'ليس لديك ما يكفي من عملات بلوست لإرسال هذه الهدية.' });
            return;
        }

        setIsGifting(true);
        try {
            await sendGift(post.id, selectedAmount);
            toast({ title: 'تم إرسال الهدية بنجاح!', description: `لقد أهديت ${selectedAmount} بلوست إلى ${post.author.name}.` });
            onGiftSent();
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل إرسال الهدية', description: error.message });
        } finally {
            setIsGifting(false);
            setSelectedAmount(null);
        }
    };
    
    if (!user || !post) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إهداء بلوست إلى {post.author.name}</DialogTitle>
                    <DialogDescription>
                        اختر قيمة الهدية التي تريد إرسالها. رصيدك الحالي: {user.blustBalance?.toLocaleString() ?? 0} بلوست.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 py-4">
                    {giftOptions.map(option => (
                        <button
                            key={option.amount}
                            onClick={() => setSelectedAmount(option.amount)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all",
                                option.color,
                                selectedAmount === option.amount ? "border-primary" : "border-transparent"
                            )}
                        >
                            {option.icon}
                            <span className="font-bold">{option.amount.toLocaleString()}</span>
                        </button>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button onClick={handleSendGift} disabled={!selectedAmount || isGifting}>
                        {isGifting ? 'جاري الإهداء...' : 'إهداء'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}



function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
    const { user, addPost } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    if (!user) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !image) {
            toast({
                variant: 'destructive',
                title: 'لا يمكن نشر منشور فارغ',
                description: 'الرجاء كتابة نص أو إضافة صورة.',
            });
            return;
        }

        setIsPosting(true);
        try {
            await addPost(content, image);
            toast({
                title: 'تم النشر بنجاح!',
            });
            setContent('');
            removeImage();
            onPostCreated();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'فشل النشر',
                description: 'حدث خطأ أثناء محاولة نشر منشورك. حاول مرة أخرى.',
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Card className="mb-6 animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle>إنشاء منشور جديد</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-start gap-4">
                        <Avatar>
                            <AvatarImage src={user.profile.avatarUrl} alt={user.profile.name} />
                            <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Textarea
                            placeholder={`بماذا تفكر يا ${user.profile.name}؟`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[80px] flex-1 resize-none"
                            disabled={isPosting}
                        />
                    </div>
                    {imagePreview && (
                        <div className="relative mt-4 group w-fit mx-auto">
                            <Image src={imagePreview} alt="معاينة الصورة" width={400} height={200} className="rounded-md max-h-60 w-auto object-contain" />
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); removeImage();}}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                     <div className="flex justify-between items-center pt-2">
                         <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={isPosting} className="gap-2">
                             <ImageIcon className="h-4 w-4" />
                             {image ? 'تغيير الصورة' : 'إضافة صورة'}
                         </Button>
                         <Button type="submit" disabled={isPosting} className="gap-2">
                             {isPosting ? 'جاري النشر...' : 'نشر'}
                             <Send className="h-4 w-4" />
                         </Button>
                    </div>
                    <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                    />
                </form>
            </CardContent>
        </Card>
    )
}

function CommentDialog({ 
    post, 
    open, 
    onOpenChange, 
    onCommentAdded,
    onCommentLiked,
    onReplyAdded,
    currentUserEmail,
    allUsers,
}: { 
    post: Post | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    onCommentAdded: (postId: string, comment: Comment) => void,
    onCommentLiked: (postId: string, commentId: number) => void,
    onReplyAdded: (postId: string, parentCommentId: number, reply: Comment) => void,
    currentUserEmail: string | undefined,
    allUsers: User[],
}) {
    const { user, addCommentToPost, addReplyToComment } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [newReply, setNewReply] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
    const { toast } = useToast();

    const [commentMedia, setCommentMedia] = useState<File | null>(null);
    const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);
    const [replyMedia, setReplyMedia] = useState<File | null>(null);
    const [replyMediaPreview, setReplyMediaPreview] = useState<string | null>(null);

    const commentInputRef = useRef<HTMLInputElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);
    const commentMediaInputRef = useRef<HTMLInputElement>(null);
    const replyMediaInputRef = useRef<HTMLInputElement>(null);


    const handleMediaChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'comment' | 'reply'
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
             if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    if (video.duration > 600) { // 10 minutes
                        toast({
                            variant: 'destructive',
                            title: 'الفيديو طويل جدًا',
                            description: 'الرجاء اختيار فيديو لا تزيد مدته عن 10 دقائق.',
                        });
                        return;
                    }
                    setMedia(file, type);
                }
                video.src = URL.createObjectURL(file);
            } else {
                 setMedia(file, type);
            }
        }
    };
    
    const setMedia = (file: File, type: 'comment' | 'reply') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'comment') {
                setCommentMedia(file);
                setCommentMediaPreview(reader.result as string);
            } else {
                setReplyMedia(file);
                setReplyMediaPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    }
    
    const removeMedia = (type: 'comment' | 'reply') => {
        if (type === 'comment') {
            setCommentMedia(null);
            setCommentMediaPreview(null);
            if (commentMediaInputRef.current) commentMediaInputRef.current.value = '';
        } else {
            setReplyMedia(null);
            setReplyMediaPreview(null);
            if (replyMediaInputRef.current) replyMediaInputRef.current.value = '';
        }
    }


    useEffect(() => {
        if (open) {
            setNewComment('');
            setReplyingTo(null);
            setNewReply('');
            setExpandedReplies({});
            removeMedia('comment');
            removeMedia('reply');
        }
    }, [open]);
    
    useEffect(() => {
        if (replyingTo !== null) {
            replyInputRef.current?.focus();
        }
    }, [replyingTo]);

    if (!post || !user) return null;
    
    const authorUser = allUsers.find(u => u.profile.username === post.authorUsername);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && !commentMedia) return;
        const addedComment = await addCommentToPost(post.id, newComment, commentMedia);
        if (addedComment) {
            onCommentAdded(post.id, addedComment);
        }
        setNewComment("");
        removeMedia('comment');
    }
    
    const handleReplySubmit = async (e: React.FormEvent, parentCommentId: number) => {
        e.preventDefault();
        if(!newReply.trim() && !replyMedia) return;
        const addedReply = await addReplyToComment(post.id, parentCommentId, newReply, replyMedia);
        if (addedReply) {
            onReplyAdded(post.id, parentCommentId, addedReply);
        }
        setNewReply('');
        setReplyingTo(null);
        removeMedia('reply');
    }
    
    const handleReplyClick = (commentId: number) => {
        if (replyingTo === commentId) {
            setReplyingTo(null);
            removeMedia('reply');
        } else {
            setReplyingTo(commentId);
            setNewReply('');
        }
    }

    const toggleReplies = (commentId: number) => {
        setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    }

    const renderCommentMedia = (comment: Comment) => {
        if (comment.imageUrl) {
            return <Image src={comment.imageUrl} alt="تعليق مرفق" width={200} height={150} className="mt-2 rounded-md object-cover max-h-40 w-auto" />;
        }
        if (comment.videoUrl) {
            return <video src={comment.videoUrl} controls className="mt-2 rounded-md max-h-40 w-full" />;
        }
        return null;
    }

    const renderComment = (comment: Comment, isReply = false) => {
        const hasLikedComment = currentUserEmail && comment.likedBy ? comment.likedBy.includes(currentUserEmail) : false;
        const isReplyingToThis = replyingTo === comment.id;
        const showReplies = expandedReplies[comment.id] && (comment.replies?.length ?? 0) > 0;
        const commentAuthor = allUsers.find(u => u.profile.username === comment.authorUsername);
        
        if (comment.isGift) {
            return (
                <div key={comment.id} className="flex items-center gap-3 my-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="flex-1 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700/50 p-2 rounded-lg text-sm">
                        أهدى <span className="font-bold">{comment.author.name}</span> مبلغ <span className="font-bold">{comment.giftAmount} بلوست!</span>
                        <Coins className="inline-block h-4 w-4 ml-1 text-yellow-500"/>
                    </div>
                </div>
            )
        }


        return (
            <div key={comment.id} className={cn("flex items-start gap-3", isReply && "ml-6 mt-3")}>
                <Avatar className={cn("h-8 w-8", isReply && "h-7 w-7")}>
                    <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className={cn("font-semibold text-sm flex items-center gap-1", isReply && "text-xs")}>
                                    {comment.author.name}
                                    {commentAuthor?.isVerified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
                                </p>
                                {comment.content && <p className={cn("text-sm mt-1 whitespace-pre-wrap", isReply && "text-xs")}>{comment.content}</p>}
                                {renderCommentMedia(comment)}
                            </div>
                             <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onCommentLiked(post.id, comment.id)}>
                                <Heart className={cn("h-4 w-4 text-muted-foreground", hasLikedComment && "fill-red-500 text-red-500")} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ar })}</span>
                            {comment.likes > 0 && <span>{comment.likes} إعجابًا</span>}
                            <button className="font-semibold" onClick={() => handleReplyClick(comment.id)}>
                                {isReplyingToThis ? 'إلغاء' : 'رد'}
                            </button>
                        </div>
                    </div>
                     {isReplyingToThis && (
                        <div className="mt-2 space-y-2">
                            {replyMediaPreview && (
                                <div className="relative group w-fit">
                                    {replyMedia?.type.startsWith('image/') ? 
                                        <Image src={replyMediaPreview} alt="معاينة" width={100} height={100} className="rounded-md object-cover max-h-24 w-auto"/>
                                      : <video src={replyMediaPreview} className="rounded-md max-h-24 w-auto"/>
                                    }
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeMedia('reply')}><X className="h-3 w-3"/></Button>
                                </div>
                            )}
                            <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="w-full flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                   <AvatarImage src={user.profile.avatarUrl} alt={user.profile.name} />
                                   <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <Input
                                   ref={replyInputRef}
                                   placeholder={`الرد على ${comment.author.name}...`}
                                   value={newReply}
                                   onChange={(e) => setNewReply(e.target.value)}
                                   className="h-9 text-xs"
                               />
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => replyMediaInputRef.current?.click()}><Camera className="h-4 w-4"/></Button>
                               <Button type="submit" size="icon" disabled={!newReply.trim() && !replyMedia} className="h-9 w-9">
                                   <Send className="h-4 w-4" />
                               </Button>
                           </form>
                           <input type="file" ref={replyMediaInputRef} onChange={(e) => handleMediaChange(e, 'reply')} className="hidden" accept="image/*,video/*" />
                        </div>
                    )}
                    {!isReply && (comment.replies?.length ?? 0) > 0 && (
                        <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-1" onClick={() => toggleReplies(comment.id)}>
                            {showReplies ? 'إخفاء الردود' : `عرض ${comment.replies?.length} رد`}
                        </Button>
                    )}
                    {showReplies && (
                        <div className="pt-2 border-t border-border mt-2 space-y-3">
                            {comment.replies?.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>تعليقات منشور {post.author.name}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {post.comments.length > 0 ? (
                            post.comments.map(comment => renderComment(comment))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>لا توجد تعليقات بعد.</p>
                                <p>كن أول من يعلق!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="p-4 border-t bg-background flex-col items-start gap-2">
                     {commentMediaPreview && (
                        <div className="relative group w-fit">
                            {commentMedia?.type.startsWith('image/') ? 
                                <Image src={commentMediaPreview} alt="معاينة" width={150} height={150} className="rounded-md object-cover max-h-28 w-auto"/>
                                : <video src={commentMediaPreview} className="rounded-md max-h-28 w-auto"/>
                            }
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeMedia('comment')}><X className="h-4 w-4"/></Button>
                        </div>
                     )}
                    <form onSubmit={handleCommentSubmit} className="w-full flex items-center gap-2">
                         <Avatar className="h-9 w-9">
                            <AvatarImage src={user.profile.avatarUrl} alt={user.profile.name} />
                            <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Input
                            ref={commentInputRef}
                            placeholder="أضف تعليقًا..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => commentMediaInputRef.current?.click()}><Camera className="h-5 w-5"/></Button>
                        <Button type="submit" size="icon" disabled={!newComment.trim() && !commentMedia}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                     <input type="file" ref={commentMediaInputRef} onChange={(e) => handleMediaChange(e, 'comment')} className="hidden" accept="image/*,video/*" />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PostsPage() {
    const { user, getAllPosts, getAllUsers, toggleLikePost, toggleFollow, toggleLikeComment, addReplyToComment, addCommentToPost } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [postForLikes, setPostForLikes] = useState<Post | null>(null);
    const [postForGift, setPostForGift] = useState<Post | null>(null);
    const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
    const [isLikesDialogOpen, setIsLikesDialogOpen] = useState(false);
    const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    
    // State for pull-to-refresh
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullPosition, setPullPosition] = useState(0);
    const touchStartY = useRef(0);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const PULL_THRESHOLD = 70;

    useEffect(() => {
        // This ensures the ref is only used on the client
        if (typeof window !== 'undefined') {
            touchStartY.current = 0;
        }
    }, []);

    const fetchPostsAndUsers = useCallback(async () => {
        const allUsersData = await getAllUsers(true);
        setAllUsers(allUsersData);
        
        const allPostsData = await getAllPosts();
        
        const enrichComments = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
                const commentAuthor = allUsersData.find(u => u.profile.username === comment.authorUsername);
                return {
                    ...comment,
                    author: commentAuthor ? commentAuthor.profile : { name: 'مجهول', username: comment.authorUsername, bio: '', followers: [], following: [] },
                    replies: comment.replies ? enrichComments(comment.replies) : []
                }
            });
        };
        
        const postsWithAuthors = allPostsData.map(post => {
            const author = allUsersData.find(u => u.profile.username === post.authorUsername);
            const commentsWithAuthors = enrichComments(post.comments || []);
            
            return {
                ...post,
                author: author ? author.profile : { name: 'محفظتي بلوست', username: post.authorUsername, bio: '', followers: [], following: [] },
                comments: commentsWithAuthors,
                authorIsVerified: author?.isVerified,
            }
        });
        setPosts(postsWithAuthors);
    }, [getAllPosts, getAllUsers]);

    useEffect(() => {
        if(user) fetchPostsAndUsers();
    }, [user, fetchPostsAndUsers]);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        await fetchPostsAndUsers();
        // A small delay to make the refresh indicator visible
        setTimeout(() => {
            setIsRefreshing(false);
            setPullPosition(0);
        }, 500);
    }, [isRefreshing, fetchPostsAndUsers]);


    // Pull-to-refresh logic
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touchY = e.touches[0].clientY;
        const pullDistance = touchY - touchStartY.current;
        const isAtTop = mainContainerRef.current?.scrollTop === 0;

        if (pullDistance > 0 && isAtTop && !isRefreshing) {
            // Prevent default scroll behavior to enable custom pull
            e.preventDefault();
            setPullPosition(pullDistance);
        }
    };

    const handleTouchEnd = () => {
        if (pullPosition > PULL_THRESHOLD && !isRefreshing) {
            handleRefresh();
        } else {
            setPullPosition(0);
        }
        touchStartY.current = 0;
    };
    
    const handleLikeToggle = (postId: string) => {
        toggleLikePost(postId);
        // Optimistically update the UI
        setPosts(currentPosts => 
            currentPosts.map(p => {
                if (p.id === postId && user) {
                    const hasLiked = p.likedBy.includes(user.email);
                    return {
                        ...p,
                        likes: hasLiked ? p.likes - 1 : p.likes + 1,
                        likedBy: hasLiked 
                            ? p.likedBy.filter(email => email !== user.email)
                            : [...p.likedBy, user.email]
                    };
                }
                return p;
            })
        );
    };

    const handleCommentClick = (post: Post) => {
        setSelectedPost(post);
        setIsCommentDialogOpen(true);
    };

    const handleLikesClick = (post: Post) => {
        setPostForLikes(post);
        setIsLikesDialogOpen(true);
    };
    
    const handleGiftClick = (post: Post) => {
        setPostForGift(post);
        setIsGiftDialogOpen(true);
    };


     const handleCommentAdded = (postId: string, newComment: Comment) => {
        const commentAuthor = allUsers.find(u => u.profile.username === newComment.authorUsername);
        const enrichedComment = {
            ...newComment,
            author: commentAuthor ? commentAuthor.profile : { name: 'مجهول', username: newComment.authorUsername, bio: '', followers: [], following: [] },
        };
        
        const updateState = (prev: Post[]) => prev.map(p => {
            if (p.id === postId) {
                const updatedComments = p.comments ? [...p.comments, enrichedComment] : [enrichedComment];
                return { ...p, comments: updatedComments };
            }
            return p;
        });

        setPosts(updateState);
        setSelectedPost(prev => prev && prev.id === postId ? { ...prev, comments: [...prev.comments, enrichedComment] } : prev);
    };
    
    const handleReplyAdded = (postId: string, parentCommentId: number, newReply: Comment) => {
        const replyAuthor = allUsers.find(u => u.profile.username === newReply.authorUsername);
        const enrichedReply = {
            ...newReply,
            author: replyAuthor ? replyAuthor.profile : { name: 'مجهول', username: newReply.authorUsername, bio: '', followers: [], following: [] },
        };

        const addReplyToComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === parentCommentId) {
                    const updatedReplies = c.replies ? [...c.replies, enrichedReply] : [enrichedReply];
                    return { ...c, replies: updatedReplies };
                }
                if (c.replies) {
                    return { ...c, replies: addReplyToComments(c.replies) };
                }
                return c;
            });
        };

        const updateState = (prev: Post[]) => prev.map(p => {
            if (p.id === postId) {
                return { ...p, comments: addReplyToComments(p.comments) };
            }
            return p;
        });

        setPosts(updateState);
        setSelectedPost(prev => prev && prev.id === postId ? { ...prev, comments: addReplyToComments(prev.comments) } : prev);
    };


    const handleCommentLikeToggle = (postId: string, commentId: number) => {
        toggleLikeComment(postId, commentId);

        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === commentId && user) {
                    const currentLikedBy = c.likedBy || [];
                    const hasLiked = currentLikedBy.includes(user.email);
                    const newLikedBy = hasLiked 
                        ? currentLikedBy.filter(e => e !== user.email) 
                        : [...currentLikedBy, user.email];
                    return {
                        ...c,
                        likes: newLikedBy.length,
                        likedBy: newLikedBy,
                        replies: c.replies ? updateComments(c.replies) : []
                    };
                }
                if (c.replies) {
                  return {
                      ...c,
                      replies: updateComments(c.replies)
                  };
                }
                return c;
            });
        };

        const optimisticallyUpdateState = (prevState: Post[]) => 
            prevState.map(p => {
                if (p.id === postId) {
                    return { ...p, comments: updateComments(p.comments) };
                }
                return p;
            });

        setPosts(optimisticallyUpdateState);
        setSelectedPost(prevPost => {
            if (prevPost && prevPost.id === postId) {
                return { ...prevPost, comments: updateComments(prevPost.comments) };
            }
            return prevPost;
        });
    };

    const handleFollowToggle = (targetUsername: string) => {
        const targetUser = allUsers.find(u => u.profile.username === targetUsername);
        if (targetUser) {
            toggleFollow(targetUser.uid);
            fetchPostsAndUsers();
        }
    }


    if (!user) return null;

  return (
    <>
    <div 
        ref={mainContainerRef}
        className="container mx-auto max-w-2xl p-4 sm:p-6 md:p-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{ height: pullPosition }}
      >
        <RefreshCw className={cn("h-6 w-6 text-muted-foreground", isRefreshing && "animate-spin")} />
      </div>

      <CreatePostForm onPostCreated={fetchPostsAndUsers} />

      <Separator className="my-8" />
      
      <div className="space-y-6">
        {posts.map((post: any) => {
            const hasLiked = user && post.likedBy.includes(user.email);
            const author = allUsers.find(u => u.profile.username === post.authorUsername);
            const isFollowingAuthor = author && user.profile.following?.includes(author.uid);

            return (
          <Card key={post.id} className="overflow-hidden animate-in fade-in-50 duration-500">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Link href={post.authorUsername === user.profile.username ? '/profile' : `/profile/${post.authorUsername}`}>
                <Avatar>
                  <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col flex-grow">
                <Link href={post.authorUsername === user.profile.username ? '/profile' : `/profile/${post.authorUsername}`}>
                    <div className="font-semibold flex items-center gap-1">
                      {post.author.name}
                      {author?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div className="text-sm text-muted-foreground">@{post.authorUsername}</div>
                </Link>
              </div>
               { post.authorUsername !== user.profile.username && (
                <Button 
                    variant={isFollowingAuthor ? 'secondary' : 'outline'} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleFollowToggle(post.authorUsername)}
                >
                  <UserPlus className="h-4 w-4" />
                  {isFollowingAuthor ? 'إلغاء المتابعة' : 'متابعة'}
                </Button>
               )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
              {post.imageUrl && (
                <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg border">
                  <Image src={post.imageUrl} alt="صورة المنشور" fill style={{ objectFit: 'cover' }} data-ai-hint={post.imageHint} />
                </div>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                {post.likes > 0 ? (
                    <button className="flex gap-1 text-sm hover:underline" onClick={() => handleLikesClick(post)}>
                        <span>{post.likes}</span>
                        <span>إعجاب</span>
                    </button>
                ) : (
                    <div />
                )}
                 <div className="flex gap-1 text-sm">
                    <span>{post.comments.length}</span>
                    <span>تعليق</span>
                </div>
              </div>
            </CardContent>
            <div className="flex border-t">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none gap-2"
                onClick={() => handleLikeToggle(post.id)}
              >
                <ThumbsUp className={cn("h-5 w-5", hasLiked && "fill-current text-primary")} />
                <span>إعجاب</span>
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none gap-2 border-x"
                onClick={() => handleCommentClick(post)}
              >
                <MessageSquare className="h-5 w-5" />
                <span>تعليق</span>
              </Button>
              <Button variant="ghost" className="flex-1 rounded-none gap-2" onClick={() => handleGiftClick(post)}>
                <Gift className="h-5 w-5" />
                <span>إهداء</span>
              </Button>
            </div>
          </Card>
        )})}
      </div>
    </div>
    <CommentDialog 
        post={selectedPost} 
        open={isCommentDialogOpen} 
        onOpenChange={setIsCommentDialogOpen}
        onCommentAdded={handleCommentAdded}
        onReplyAdded={handleReplyAdded}
        onCommentLiked={handleCommentLikeToggle}
        currentUserEmail={user?.email}
        allUsers={allUsers}
     />
     <LikesDialog 
        post={postForLikes}
        open={isLikesDialogOpen}
        onOpenChange={setIsLikesDialogOpen}
        onFollowToggle={fetchPostsAndUsers}
        allUsers={allUsers}
     />
     <GiftDialog
        post={postForGift}
        open={isGiftDialogOpen}
        onOpenChange={setIsGiftDialogOpen}
        onGiftSent={fetchPostsAndUsers}
     />
    </>
  );
}
