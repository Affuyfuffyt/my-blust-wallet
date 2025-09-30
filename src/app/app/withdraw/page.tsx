// src/app/app/withdraw/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Landmark, Wallet, AlertCircle, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";

const MIN_WITHDRAWAL_AMOUNT = 60000;
const BLUST_TO_USD = 1 / 6000;
const USD_TO_IQD = 1310;

export default function WithdrawPage() {
  const { user, submitWithdrawalRequest } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'amount' | 'method' | 'details'>('amount');
  const [method, setMethod] = useState<'zain_cash' | 'mastercard' | null>(null);
  const [walletNumber, setWalletNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { toast } = useToast();

  const blustBalance = user?.blustBalance ?? 0;
  const amountInUsd = Number(amount) * BLUST_TO_USD;
  const amountInIqd = amountInUsd * USD_TO_IQD;

  const handleAmountSubmit = () => {
    setError(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("الرجاء إدخال مبلغ صحيح.");
      return;
    }
    if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`أقل مبلغ للسحب هو ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} بلوست.`);
      return;
    }
    if (numericAmount > blustBalance) {
      setError("رصيدك غير كافٍ لإتمام عملية السحب.");
      return;
    }
    setStep('method');
  };

  const handleMethodSelect = () => {
    if (!method) {
      setError("الرجاء اختيار طريقة السحب.");
      return;
    }
    setStep('details');
  };

  const handleWithdrawalSubmit = async () => {
    if (!walletNumber.trim()) {
      setError("الرجاء إدخال رقم المحفظة.");
      return;
    }
    if (!method) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await submitWithdrawalRequest(Number(amount), method, walletNumber);
      setShowSuccessDialog(true);
      // Reset state
      setAmount('');
      setMethod(null);
      setWalletNumber('');
      setStep('amount');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'فشل طلب السحب',
        description: e.message || "حدث خطأ غير متوقع.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'amount':
        return (
          <>
            <CardHeader>
              <CardTitle>طلب سحب</CardTitle>
              <CardDescription>أدخل مبلغ البلوست الذي ترغب في سحبه.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted border text-center">
                <Label>رصيدك الحالي</Label>
                <div className="text-2xl font-bold text-primary">{blustBalance.toLocaleString()} بلوست</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`الحد الأدنى ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}`}
                  className="text-center text-lg"
                />
                {Number(amount) > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                        يعادل تقريبًا ${amountInUsd.toFixed(2)} / {amountInIqd.toLocaleString('en-US', {maximumFractionDigits: 0})} دينار عراقي
                    </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleAmountSubmit}>التالي</Button>
            </CardFooter>
          </>
        );
      case 'method':
        return (
          <>
            <CardHeader>
              <CardTitle>اختر طريقة السحب</CardTitle>
              <CardDescription>كيف ترغب في استلام أموالك؟</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={method || ''} onValueChange={(value) => setMethod(value as any)}>
                <Label
                  htmlFor="zain_cash"
                  className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-primary" />
                    <span>زين كاش</span>
                  </div>
                  <RadioGroupItem value="zain_cash" id="zain_cash" />
                </Label>
                <Label
                  htmlFor="mastercard"
                  className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <Landmark className="h-6 w-6 text-primary" />
                    <span>ماستر كارد</span>
                  </div>
                  <RadioGroupItem value="mastercard" id="mastercard" />
                </Label>
              </RadioGroup>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setStep('amount')}>رجوع</Button>
              <Button onClick={handleMethodSelect}>التالي</Button>
            </CardFooter>
          </>
        );
      case 'details':
        return (
          <>
            <CardHeader>
              <CardTitle>تفاصيل السحب</CardTitle>
              <CardDescription>
                أدخل رقم محفظة {method === 'zain_cash' ? 'زين كاش' : 'الماستر كارد'} الخاصة بك.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted border text-center space-y-1">
                    <p>المبلغ: <span className="font-bold text-primary">{Number(amount).toLocaleString()} بلوست</span></p>
                    <p className="text-sm">الطريقة: <span className="font-semibold">{method === 'zain_cash' ? 'زين كاش' : 'ماستر كارد'}</span></p>
                </div>
              <div className="space-y-2">
                <Label htmlFor="walletNumber">رقم المحفظة</Label>
                <Input
                  id="walletNumber"
                  type="text"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="07..."
                  className="text-left"
                  dir="ltr"
                />
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setStep('method')}>رجوع</Button>
              <Button onClick={handleWithdrawalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإرسال...' : 'تأكيد السحب'}
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-lg">
        <header className="relative flex items-center justify-center mb-6">
            <Button variant="ghost" size="icon" className="absolute left-0" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-primary">السحب</h1>
        </header>

        <Card className="animate-in fade-in-50 duration-500">
          {renderStep()}
        </Card>
        {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive font-medium">
                <AlertCircle className="h-5 w-5"/>
                <p>{error}</p>
            </div>
        )}
      </div>
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تم استلام طلب السحب بنجاح!</AlertDialogTitle>
            <AlertDialogDescription>
              لقد استلمنا طلب السحب الخاص بك وسنقوم بمراجعته في أقرب وقت ممكن. عادةً ما تستغرق العملية من 24 إلى 48 ساعة. ستتلقى إشعارًا عند اكتمال عملية التحويل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>موافق</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
