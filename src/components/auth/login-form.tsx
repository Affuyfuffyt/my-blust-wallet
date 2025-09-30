"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Loading from "@/app/loading";


const formSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(1, { message: "الرجاء إدخال كلمة المرور." }),
});

export default function LoginForm() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [banInfo, setBanInfo] = useState<{ reason: string; endDate: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
       if (user.isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/app');
      }
    }
  }, [user, authLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.user) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "أهلاً بك مرة أخرى!",
        });
        if (result.user.isAdmin) {
          router.push("/admin");
        } else {
          router.push("/app");
        }
      } else if (result.banned && result.banReason && result.banEndDate) {
        setBanInfo({ reason: result.banReason, endDate: result.banEndDate });
      }
    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: error.message || "حدث خطأ غير متوقع.",
        });
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || user) {
    return <Loading />;
  }

  return (
    <>
      <Card className="w-full animate-in fade-in-50 duration-500">
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى محفظتك.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ليس لديك حساب؟{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  انشاء حساب
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <AlertDialog open={!!banInfo} onOpenChange={() => setBanInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">لقد تم حظرك</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 py-4 text-right">
                <p>
                  <span className="font-bold">سبب الحظر:</span> {banInfo?.reason}
                </p>
                <p>
                  <span className="font-bold">ينتهي الحظر:</span> {banInfo && formatDistanceToNow(new Date(banInfo.endDate), { addSuffix: true, locale: ar })}
                </p>
                 <p className="text-xs text-muted-foreground">
                    إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بالدعم.
                 </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBanInfo(null)}>موافق</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
