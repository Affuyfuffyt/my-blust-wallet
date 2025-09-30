// src/app/admin/verified/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BadgeCheck } from "lucide-react";

export default function AdminVerifiedPage() {
  const { user, getVerifiedUsers } = useAuth();
  const [verifiedUsers, setVerifiedUsers] = useState<User[]>([]);

  const fetchVerifiedUsers = useCallback(async () => {
    if(user){
      const allVerifiedUsers = await getVerifiedUsers();
      setVerifiedUsers(allVerifiedUsers);
    }
  }, [getVerifiedUsers, user]);

  useEffect(() => {
    fetchVerifiedUsers();
  }, [fetchVerifiedUsers]);
  
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">الحسابات الموثقة</h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموثقين</CardTitle>
          <CardDescription>
            هنا يمكنك عرض جميع الحسابات الموثقة حاليًا وتاريخ انتهاء توثيقهم.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>ينتهي التوثيق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifiedUsers.length > 0 ? (
                verifiedUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profile.avatarUrl} alt={user.profile.name} />
                          <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {user.profile.name}
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="text-sm text-muted-foreground">@{user.profile.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.verificationEndDate ? formatDistanceToNow(new Date(user.verificationEndDate), { addSuffix: true, locale: ar }) : 'غير محدد'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    لا توجد حسابات موثقة حاليًا.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
