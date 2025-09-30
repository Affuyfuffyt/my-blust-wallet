// src/app/admin/withdrawals/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { WithdrawalRequest, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const USD_TO_IQD = 1310;
const BLUST_TO_USD = 1 / 6000;

export default function AdminWithdrawalsPage() {
  const { user, getAllWithdrawals, updateWithdrawalStatus } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const fetchWithdrawals = useCallback(async () => {
    if(user){
      const allWithdrawals = await getAllWithdrawals();
      setWithdrawals(allWithdrawals);
    }
  }, [getAllWithdrawals, user]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);
  
  const handleStatusChange = (withdrawalId: string, status: 'completed' | 'rejected') => {
    updateWithdrawalStatus(withdrawalId, status);
    fetchWithdrawals();
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">طلبات السحب</h1>
      <Card>
        <CardHeader>
          <CardTitle>سجل السحوبات</CardTitle>
          <CardDescription>
            هنا يمكنك عرض وإدارة جميع طلبات السحب من المستخدمين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>المبلغ (بلوست)</TableHead>
                <TableHead>المبلغ (دينار)</TableHead>
                <TableHead>الطريقة</TableHead>
                <TableHead>رقم المحفظة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length > 0 ? (
                withdrawals.map((req) => {
                   const amountInUsd = req.amount * BLUST_TO_USD;
                   const amountInIqd = amountInUsd * USD_TO_IQD;
                  return (
                  <TableRow key={req.id}>
                    <TableCell>
                      {req.user ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={req.user.profile.avatarUrl} alt={req.user.profile.name} />
                            <AvatarFallback>{req.user.profile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{req.user.profile.name}</div>
                            <div className="text-sm text-muted-foreground">{req.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">مستخدم محذوف</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{req.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{amountInIqd.toLocaleString('en-US', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 })}</TableCell>
                    <TableCell>
                      <Badge variant={req.method === 'zain_cash' ? 'default' : 'secondary'}>
                        {req.method === 'zain_cash' ? 'زين كاش' : 'ماستر كارد'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{req.walletNumber}</TableCell>
                    <TableCell>{format(new Date(req.createdAt), 'PPpp', { locale: ar })}</TableCell>
                    <TableCell>
                        <Badge variant={
                            req.status === 'pending' ? 'outline' 
                            : req.status === 'completed' ? 'default'
                            : 'destructive'
                        }>
                            {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'completed' ? 'مكتمل' : 'مرفوض'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       {req.status === 'pending' && (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="sm">تغيير الحالة</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                               <DropdownMenuLabel>تحديد حالة الطلب</DropdownMenuLabel>
                               <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'completed')}>
                                 مكتمل
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleStatusChange(req.id, 'rejected')} className="text-destructive">
                                 مرفوض
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                       )}
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    لا توجد طلبات سحب حتى الآن.
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
