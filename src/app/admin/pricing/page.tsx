// src/app/admin/pricing/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Database, Users, Server, FileImage } from "lucide-react";

const freeTierData = [
  {
    service: "Cloud Firestore",
    icon: Database,
    description: "قاعدة بيانات مرنة لتخزين بيانات التطبيق مثل معلومات المستخدمين والمنشورات.",
    limits: [
      "1 جيجابايت مساحة تخزين",
      "50,000 عملية قراءة في اليوم",
      "20,000 عملية كتابة في اليوم",
      "20,000 عملية حذف في اليوم",
    ],
  },
  {
    service: "Authentication",
    icon: Users,
    description: "نظام تسجيل الدخول وإنشاء الحسابات للمستخدمين.",
    limits: [
      "10,000 عملية تحقق شهريًا (بريد إلكتروني وكلمة مرور)",
      "عدد غير محدود من المستخدمين",
    ],
  },
  {
    service: "Cloud Storage",
    icon: FileImage,
    description: "لتخزين الملفات التي يرفعها المستخدمون مثل الصور الشخصية وصور المنشورات.",
    limits: [
      "5 جيجابايت مساحة تخزين",
      "1 جيجابايت عمليات تحميل في اليوم",
      "20,000 عملية رفع ملف في اليوم",
    ],
  },
  {
    service: "App Hosting",
    icon: Server,
    description: "استضافة ونشر تطبيق الويب الخاص بك ليكون متاحًا على الإنترنت.",
    limits: [
      "10 جيجابايت مساحة تخزين للاستضافة",
      "360 ميجابايت نقل بيانات في اليوم",
      "نطاق فرعي مجاني (your-app.web.app)",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary">خطة Firebase المجانية (Spark)</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          هذه هي الحدود المجانية للخدمات التي يستخدمها تطبيقك حاليًا.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {freeTierData.map((item) => (
          <Card key={item.service} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                <item.icon className="h-10 w-10 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{item.service}</CardTitle>
                  <CardDescription className="mt-1">{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {item.limits.map((limit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground">{limit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>هذه الأرقام كافية جدًا لبدء تشغيل التطبيق واختباره مع عدد كبير من المستخدمين.</p>
            <p>عندما ينمو تطبيقك بشكل كبير، يمكنك الترقية إلى خطة الدفع حسب الاستخدام (Blaze).</p>
        </div>
    </div>
  );
}
