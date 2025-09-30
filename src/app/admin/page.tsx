// src/app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User, Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MoreHorizontal, ShieldBan, Trash2, Edit, CheckCircle, Eye, EyeOff, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const editUserSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يكون الاسم حرفين على الأقل.' }),
  username: z.string().min(2, { message: 'يجب أن يكون اسم المستخدم حرفين على الأقل.' }),
  bio: z.string().max(160, { message: 'يجب ألا يزيد النبذة التعريفية عن 160 حرفًا.' }).optional(),
});

const banSchema = z.object({
  reason: z.string().min(5, { message: "يجب أن يكون سبب الحظر 5 أحرف على الأقل." }),
  days: z.coerce.number().min(1, { message: "يجب أن تكون مدة الحظر يومًا واحدًا على الأقل." }),
});

export default function AdminDashboardPage() {
  const { getAllUsers, deleteUserByAdmin, banUserByAdmin, unbanUserByAdmin, updateUserByAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(() => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  }, [getAllUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const editUserForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
  });

  const banForm = useForm<z.infer<typeof banSchema>>({
    resolver: zodResolver(banSchema),
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.profile.name,
      username: user.profile.username,
      bio: user.profile.bio || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  }

  const handleBan = (user: User) => {
    setSelectedUser(user);
    banForm.reset({ reason: '', days: 7 });
    setIsBanModalOpen(true);
  }

  const handleUnban = (user: User) => {
    unbanUserByAdmin(user.email);
    toast({ title: "تم رفع الحظر", description: `تم رفع الحظر عن المستخدم ${user.profile.name}.` });
    fetchUsers();
  }

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteUserByAdmin(selectedUser.email);
    toast({ title: "تم حذف المستخدم", description: `تم حذف المستخدم ${selectedUser.profile.name} بنجاح.`, variant: 'destructive' });
    setIsDeleteConfirmOpen(false);
    setSelectedUser(null);
    fetchUsers();
  }

  const onEditUserSubmit = (values: z.infer<typeof editUserSchema>) => {
    if (!selectedUser) return;
    
    const updates: Partial<User & { profile: Partial<Profile> }> = {
      profile: {
        name: values.name,
        username: values.username,
        bio: values.bio || '',
      }
    };

    updateUserByAdmin(selectedUser.email, updates);
    toast({ title: "تم تحديث الملف الشخصي", description: `تم تحديث ملف ${selectedUser.profile.name} بنجاح.` });
    setIsEditModalOpen(false);
    setSelectedUser(null);
    fetchUsers();
  }
  
  const onBanSubmit = (values: z.infer<typeof banSchema>) => {
    if (!selectedUser) return;
    banUserByAdmin(selectedUser.email, values.reason, values.days);
    toast({ title: "تم حظر المستخدم", description: `تم حظر ${selectedUser.profile.name} لمدة ${values.days} يوم.`, variant: 'destructive' });
    setIsBanModalOpen(false);
    setSelectedUser(null);
    fetchUsers();
  }

  const activeUsers = users.filter(u => !u.isBanned);
  const bannedUsers = users.filter(u => u.isBanned);

  const renderUserTable = (userList: User[]) => (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المستخدم</TableHead>
          <TableHead>البريد الإلكتروني</TableHead>
          {userList === bannedUsers && <TableHead>ينتهي الحظر</TableHead>}
          {userList === bannedUsers && <TableHead>سبب الحظر</TableHead>}
          <TableHead className="text-right">إجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.length > 0 ? (
          userList.map((user) => (
            <TableRow key={user.email}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.profile.name}</span>
                    <span className="text-xs text-muted-foreground">{user.profile.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              {userList === bannedUsers && (
                <>
                  <TableCell>
                    {user.banEndDate ? formatDistanceToNow(new Date(user.banEndDate), { addSuffix: true, locale: ar }) : 'غير محدد'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="truncate max-w-[150px]">{user.banReason}</p>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 p-2">
                             <p className="text-sm">{user.banReason}</p>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </TableCell>
                </>
              )}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">فتح القائمة</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.isBanned ? (
                      <DropdownMenuItem onClick={() => handleUnban(user)} className="text-green-600 focus:text-green-700">
                        <CheckCircle className="ml-2 h-4 w-4" />
                          رفع الحظر
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleBan(user)} className="text-amber-600 focus:text-amber-700">
                        <ShieldBan className="ml-2 h-4 w-4" />
                        حظر المستخدم
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive focus:text-destructive/90">
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف المستخدم
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              لا يوجد مستخدمون في هذه القائمة.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary">إدارة المستخدمين</h1>
        <Card className="animate-in fade-in-50 duration-500">
          <CardContent className="p-0">
            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  النشطون <Badge className="mr-2">{activeUsers.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="banned">
                  المحظورون <Badge variant="destructive" className="mr-2">{bannedUsers.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4">
                {renderUserTable(activeUsers)}
              </TabsContent>
              <TabsContent value="banned" className="mt-4">
                {renderUserTable(bannedUsers)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل ملف المستخدم</DialogTitle>
            <DialogDescription>تعديل معلومات {selectedUser?.profile.name}.</DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4 py-4">
              <FormField control={editUserForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={editUserForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={editUserForm.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>نبذة تعريفية</FormLabel>
                    <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Ban User Modal */}
      <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
            <DialogDescription>حظر {selectedUser?.profile.name} من استخدام التطبيق.</DialogDescription>
          </DialogHeader>
           <Form {...banForm}>
            <form onSubmit={banForm.handleSubmit(onBanSubmit)} className="space-y-4 py-4">
              <FormField control={banForm.control} name="days" render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدة الحظر (أيام)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={banForm.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>سبب الحظر</FormLabel>
                    <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBanModalOpen(false)}>إلغاء</Button>
                <Button type="submit" variant="destructive">تأكيد الحظر</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>هل أنت متأكد؟</DialogTitle>
            <DialogDescription>
              سيتم حذف المستخدم <span className="font-bold">{selectedUser?.profile.name}</span> بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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
