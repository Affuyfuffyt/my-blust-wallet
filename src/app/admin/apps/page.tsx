// src/app/admin/apps/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { AppWindow, Package, Link, Trash2, X } from "lucide-react";
import type { AppItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminAppsPage() {
    const { user, addApp, getApps, deleteApp } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [icon, setIcon] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apps, setApps] = useState<AppItem[]>([]);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [appToDelete, setAppToDelete] = useState<AppItem | null>(null);

    const iconInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    
    const fetchApps = useCallback(async () => {
      if(user) {
        const allApps = await getApps();
        setApps(allApps);
      }
    }, [getApps, user]);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);


    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIcon(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeIcon = () => {
        setIcon(null);
        setIconPreview(null);
        if (iconInputRef.current) {
            iconInputRef.current.value = '';
        }
    }

    const resetForm = () => {
        setName('');
        setDescription('');
        setDownloadUrl('');
        removeIcon();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !icon || !downloadUrl || !description) {
            toast({
                variant: 'destructive',
                title: 'بيانات ناقصة',
                description: 'الرجاء ملء جميع الحقول: اسم التطبيق، الوصف، الأيقونة، ورابط التحميل.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await addApp(name, description, icon, downloadUrl);
            toast({
                title: 'تمت إضافة التطبيق بنجاح!',
                description: `تمت إضافة تطبيق ${name} إلى قائمة تطبيقاتك.`
            });
            resetForm();
            fetchApps();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'فشل إضافة التطبيق',
                description: 'حدث خطأ أثناء محاولة إضافة التطبيق. حاول مرة أخرى.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (app: AppItem) => {
        setAppToDelete(app);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!appToDelete) return;
        await deleteApp(appToDelete.id);
        toast({ title: "تم حذف التطبيق", description: `تم حذف ${appToDelete.name} بنجاح.`, variant: 'destructive' });
        setIsDeleteConfirmOpen(false);
        setAppToDelete(null);
        fetchApps();
    };

    return (
         <>
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-primary">إدارة تطبيقاتي</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add App Form */}
                    <div className="lg:col-span-1">
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AppWindow className="h-6 w-6" />
                                    إضافة تطبيق جديد
                                </CardTitle>
                             </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="appName">اسم التطبيق</Label>
                                        <Input 
                                            id="appName"
                                            placeholder="مثال: My Awesome App"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="appDescription">وصف التطبيق</Label>
                                        <Textarea 
                                            id="appDescription"
                                            placeholder="صف تطبيقك هنا..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            disabled={isSubmitting}
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>أيقونة التطبيق</Label>
                                        <div 
                                            className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => iconInputRef.current?.click()}
                                        >
                                            {iconPreview ? (
                                                <div className="relative group w-fit mx-auto">
                                                    <Image src={iconPreview} alt="معاينة الأيقونة" width={80} height={80} className="rounded-lg mx-auto" />
                                                    <Button 
                                                        type="button" 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); removeIcon();}}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Package className="h-10 w-10" />
                                                    <span>انقر لاختيار أيقونة</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            id="icon"
                                            type="file"
                                            ref={iconInputRef}
                                            onChange={handleIconChange}
                                            className="hidden"
                                            accept="image/*"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="appDownloadUrl">رابط التحميل</Label>
                                        <div className="relative">
                                           <Link className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input 
                                                id="appDownloadUrl"
                                                type="url"
                                                placeholder="https://example.com/download"
                                                value={downloadUrl}
                                                onChange={(e) => setDownloadUrl(e.target.value)}
                                                disabled={isSubmitting}
                                                className="pr-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'جاري الإضافة...' : 'إضافة التطبيق'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>

                    {/* App List */}
                    <div className="lg:col-span-2">
                        <Card>
                             <CardHeader>
                                <CardTitle>قائمة التطبيقات</CardTitle>
                                <CardDescription>
                                    هذه هي التطبيقات التي ستظهر للمستخدمين في قسم "تطبيقاتي".
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {apps.length > 0 ? (
                                    <div className="space-y-4">
                                        {apps.map(app => (
                                            <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg border bg-background hover:bg-muted/50">
                                                <Image src={app.iconUrl} alt={app.name} width={64} height={64} className="rounded-lg border" />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{app.name}</h3>
                                                    <p className="text-sm text-muted-foreground truncate">{app.description}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDeleteClick(app)}>
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>لم تتم إضافة أي تطبيقات بعد.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
             {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>هل أنت متأكد؟</DialogTitle>
                    <DialogDescription>
                    سيتم حذف التطبيق <span className="font-bold">{appToDelete?.name}</span> بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
                    <Button variant="destructive" onClick={confirmDelete}>تأكيد الحذف</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
