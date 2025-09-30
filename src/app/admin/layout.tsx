// src/app/admin/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Users, Newspaper, PanelLeft, AppWindow, Landmark, BadgeCheck, Info } from "lucide-react";
import Loading from "../loading";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NavContent = () => {
  const pathname = usePathname();
  const mainNavItems = [
    { href: '/admin', label: 'المستخدمون', icon: Users },
    { href: '/admin/posts', label: 'المنشورات', icon: Newspaper },
    { href: '/admin/apps', label: 'تطبيقاتي', icon: AppWindow },
    { href: '/admin/withdrawals', label: 'السحب', icon: Landmark },
    { href: '/admin/verified', label: 'الحسابات الموثقة', icon: BadgeCheck },
    { href: '/admin/pricing', label: 'الخطة المجانية', icon: Info },
  ];

  const renderNavItems = (items: typeof mainNavItems) => (
    <nav className="grid items-start px-4 text-sm font-medium">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href) && (href !== '/admin' || pathname === '/admin');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex-1 overflow-auto py-2">
      {renderNavItems(mainNavItems)}
    </div>
  );
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (loading || !user || !user.isAdmin) {
    return <Loading />;
  }
  
  return (
    <div className="flex min-h-screen w-full bg-muted/40" dir="rtl">
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
           <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            <span>لوحة التحكم</span>
          </Link>
        </div>
        <NavContent />
      </aside>
      <div className="flex flex-1 flex-col">
         <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6 sm:justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">فتح قائمة التنقل</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="pt-12 sm:hidden">
                 <SheetHeader>
                    <SheetTitle>قائمة التنقل</SheetTitle>
                  </SheetHeader>
                 <NavContent />
              </SheetContent>
            </Sheet>
            <Button variant="outline" onClick={handleLogout} size="sm" className="hidden sm:flex">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
