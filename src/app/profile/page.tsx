// src/app/profile/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogOut, Settings, Grid3x3, Bookmark, BadgeCheck, ShieldAlert } from 'lucide-react';
import Loading from '../loading';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, getPostsByUsername, verifyAccount } = useAuth();
  const { toast } = useToast();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchUserPosts = useCallback(async () => {
    if (user) {
      const posts = await getPostsByUsername(user.profile.username);
      setUserPosts(posts);
    }
  }, [user, getPostsByUsername]);


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (user) {
      fetchUserPosts();
    }
  }, [user, loading, router, fetchUserPosts]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'تم تسجيل الخروج',
    });
    router.replace('/login');
  };

  const handleVerify = () => {
      setIsVerifying(true);
      const result = verifyAccount();
      if(result.success) {
          toast({
              title: "تم التوثيق بنجاح!",
              description: result.message,
          });
      } else {
          toast({
              variant: "destructive",
              title: "فشل التوثيق",
              description: result.message,
          });
      }
      setIsVerifying(false);
  }

  if (loading || !user) {
    return <Loading />;
  }
  
  const stats = {
    posts: userPosts.length,
    followers: user.profile.followers?.length ?? 0,
    following: user.profile.following?.length ?? 0,
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
            <h1 className="text-lg font-bold">@{user.profile.username}</h1>
            {user.isVerified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="تسجيل الخروج">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto max-w-lg p-4 md:p-6">
        {/* Profile Info */}
        <div className="flex items-center gap-8">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-md">
                <AvatarImage src={user.profile.avatarUrl} alt={user.profile.name} />
                <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
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
            {user.profile.name}
            {user.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
          </h2>
          <p className="text-sm text-muted-foreground">{user.profile.bio || "لا يوجد نبذة تعريفية."}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="secondary" onClick={() => router.push('/profile/edit')}>
                تعديل الملف الشخصي
            </Button>

            {!user.isVerified && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                            <BadgeCheck className="ml-2 h-4 w-4" />
                            توثيق الحساب
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>هل تريد توثيق حسابك؟</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <p>
                                سيؤدي توثيق حسابك إلى إضافة شارة التحقق الزرقاء إلى ملفك الشخصي لمدة شهر واحد.
                                </p>
                                <div className="flex items-center justify-center p-3 rounded-lg bg-muted border gap-2">
                                    <ShieldAlert className="h-5 w-5 text-destructive" />
                                    <strong>التكلفة:</strong> 1,000 بلوست
                                </div>
                            </div>
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleVerify} disabled={isVerifying || (user.blustBalance ?? 0) < 1000}>
                            {isVerifying ? 'جاري التوثيق...' : 'تأكيد ودفع'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        
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
                        <p className="mt-2 text-sm text-muted-foreground">ابدأ بمشاركة صورك ولحظاتك مع الآخرين.</p>
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
