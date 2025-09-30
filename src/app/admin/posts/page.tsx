// src/app/admin/posts/page.tsx
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { ImageIcon, Send, X } from "lucide-react";

export default function AdminPostsPage() {
    const { addPostAsAdmin } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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
            await addPostAsAdmin(content, image);
            toast({
                title: 'تم النشر بنجاح!',
                description: 'ظهر المنشور الآن لجميع المستخدمين.'
            });
            // Reset form
            setContent('');
            removeImage();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'فشل النشر',
                description: 'حدث خطأ أثناء محاولة نشر المنشور. حاول مرة أخرى.',
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
         <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-primary">إنشاء منشور جديد</h1>
            <Card>
                <CardHeader>
                    <CardTitle>محتوى المنشور</CardTitle>
                    <CardDescription>
                        أنشئ منشورًا سيظهر لجميع المستخدمين في الصفحة الرئيسية باسم "محفظتي بلوست".
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <Textarea
                            placeholder="اكتب محتوى المنشور هنا..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[150px] resize-none"
                            disabled={isPosting}
                        />
                         <div className="space-y-2">
                             <Label htmlFor="picture">صورة المنشور (اختياري)</Label>
                             <div 
                                className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => imageInputRef.current?.click()}
                             >
                                 {imagePreview ? (
                                    <div className="relative group w-fit mx-auto">
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
                                 ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ImageIcon className="h-10 w-10" />
                                        <span>انقر لاختيار صورة</span>
                                    </div>
                                 )}
                             </div>
                            <input
                                id="picture"
                                type="file"
                                ref={imageInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                                disabled={isPosting}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isPosting} className="w-full gap-2">
                             {isPosting ? 'جاري النشر...' : 'نشر المنشور'}
                             {!isPosting && <Send className="h-4 w-4" />}
                         </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
