// src/components/auth/signup-form.tsx
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
import { Eye, EyeOff, User, Mail, Lock, AtSign } from "lucide-react";
import Loading from "@/app/loading";

const formSchema = z.object({
  name: z.string().min(2, { message: "يجب أن يكون الاسم حرفين على الأقل." }),
  username: z.string()
    .min(3, { message: "يجب أن يكون اسم المستخدم 3 أحرف على الأقل."})
    .max(20, { message: "يجب ألا يزيد اسم المستخدم عن 20 حرفًا."})
    .regex(/^[a-zA-Z0-9_.]+$/, { message: "اسم المستخدم يمكن أن يحتوي فقط على حروف وأرقام ونقاط وشرطات سفلية."}),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(8, { message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
});

export default function SignupForm() {
  const router = useRouter();
  const { signup, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // This now only runs on the client, preventing hydration errors.
    if (typeof window !== 'undefined') {
        const randomUsername = `user${Math.random().toString(36).substring(2, 8)}`;
        if (!form.getValues('username')) {
          form.setValue('username', randomUsername);
        }
    }
  }, [form]);


  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/app');
    }
  }, [user, authLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    form.clearErrors(); // Clear previous errors
    try {
      const newUser = await signup(values.name, values.username, values.email, values.password);
      if (newUser) {
        toast({
          title: "تم إرسال بريد التحقق",
          description: `لقد أرسلنا رابط تحقق إلى ${values.email}. يرجى التحقق من بريدك لتفعيل حسابك.`,
          duration: 10000,
        });
        router.push("/login");
      }
    } catch (error: any) {
       if (error.message.includes("اسم المستخدم")) {
         form.setError("username", { type: "manual", message: error.message });
       } else {
        toast({
          variant: "destructive",
          title: "خطأ في إنشاء الحساب",
          description: error.message || "حدث خطأ غير متوقع.",
        });
       }
    } finally {
      setLoading(false);
    }
  }

   if (authLoading || user) {
    return (
     <div className="flex h-[580px] w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card className="w-full animate-in fade-in-50 duration-500 shadow-2xl shadow-primary/10">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">إنشاء حساب جديد</CardTitle>
        <CardDescription>
          انضم إلينا الآن وابدأ رحلتك في عالمنا الرقمي.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="اسمك الكامل" className="pr-10" {...field} />
                    </div>
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
                    <div className="relative">
                      <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="username" className="pr-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                     <div className="relative">
                       <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="name@example.com" className="pr-10" {...field} />
                    </div>
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
                       <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className="pr-10 pl-10"
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تأكيد كلمة المرور</FormLabel>
                   <FormControl>
                    <div className="relative">
                       <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        className="pr-10 pl-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full font-bold text-base py-6" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
