// src/app/profile/edit/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Profile } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import Loading from '../../loading';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يكون الاسم حرفين على الأقل.' }),
  username: z.string()
    .min(3, { message: "يجب أن يكون اسم المستخدم 3 أحرف على الأقل."})
    .max(20, { message: "يجب ألا يزيد اسم المستخدم عن 20 حرفًا."})
    .regex(/^[a-zA-Z0-9_.]+$/, { message: "اسم المستخدم يمكن أن يحتوي فقط على حروف وأرقام ونقاط وشرطات سفلية."}),
  bio: z.string().max(160, { message: 'يجب ألا يزيد النبذة التعريفية عن 160 حرفًا.' }).optional(),
});

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (user) {
      form.reset({
        name: user.profile.name || '',
        username: user.profile.username || '',
        bio: user.profile.bio || '',
      });
      setAvatarPreview(user.profile.avatarUrl || null);
    }
  }, [user, loading, router, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    form.clearErrors();
    try {
        const profileUpdates: Partial<Profile> = {
            name: values.name,
            username: values.username,
            bio: values.bio || '',
        };
        
        await updateUserProfile(profileUpdates, avatarFile);
        
        toast({
          title: 'تم تحديث الملف الشخصي',
          description: 'تم حفظ تغييراتك بنجاح.',
        });
        router.push('/profile');
    } catch (error: any) {
        if (error.message.includes("اسم المستخدم")) {
            form.setError("username", { type: "manual", message: error.message });
        } else {
            toast({
                variant: 'destructive',
                title: 'فشل تحديث الملف الشخصي',
                description: error.message || "حدث خطأ ما."
            })
        }
    }
  }

  if (loading || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in-50 duration-500">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-lg">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">تعديل الملف الشخصي</h1>
            <div className="w-9"></div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8 max-w-lg">
        <Card>
          <CardHeader>
             <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || user.profile.avatarUrl} alt={user.profile.name} />
                  <AvatarFallback>{user.profile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="link" onClick={() => fileInputRef.current?.click()}>
                    تغيير صورة الملف الشخصي
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: عبد الله محمد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نبذة تعريفية</FormLabel>
                      <FormControl>
                        <Textarea placeholder="أخبرنا عن نفسك..." className="resize-none" {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
