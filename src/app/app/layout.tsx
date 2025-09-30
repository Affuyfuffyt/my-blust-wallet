// src/app/app/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Home, AppWindow, CircleDollarSign, Bell, User, MessageCircle, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from "react";
import Loading from "../loading";
import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification, User as UserType } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const navItems = [
  { href: '/app', label: 'الرئيسية', icon: Home },
  { href: '/app/apps', label: 'تطبيقاتي', icon: AppWindow },
  { href: '/app/currencies', label: 'عملاتي', icon: CircleDollarSign },
  { href: '/app/messages', label: 'الرسائل', icon: MessageCircle },
];


function NotificationItem({ notification, allUsers }: { notification: Notification, allUsers: UserType[] }) {
    const actor = allUsers.find(u => u.profile.username === notification.actorUsername);
    let message = '';
    switch (notification.type) {
        case 'like':
            message = `أبدى ${notification.actorUsername} إعجابه بمنشورك.`;
            break;
        case 'comment':
            message = `علّق ${notification.actorUsername} على منشورك.`;
            break;
        case 'follow':
            message = `بدأ ${notification.actorUsername} بمتابعتك.`;
            break;
        default:
            return null;
    }

    return (
        <div className="flex items-start gap-3 p-3 hover:bg-muted/50">
            <Avatar className="h-9 w-9">
                <AvatarImage src={actor?.profile?.avatarUrl} />
                <AvatarFallback>{notification.actorUsername.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="text-sm">{message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                </p>
            </div>
            {!notification.read && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1"></div>}
        </div>
    );
}

function NotificationsPopover({ allUsers }: { allUsers: UserType[] }) {
    const { user, markNotificationsAsRead } = useAuth();
    const [open, setOpen] = useState(false);

    const notifications = user?.notifications || [];
    
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen && unreadCount > 0) {
            markNotificationsAsRead();
        }
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {unreadCount}
                        </div>
                    )}
                    <span className="sr-only">الإشعارات</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Card className="border-none shadow-none">
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg">الإشعارات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-96">
                            {notifications.length > 0 ? (
                                notifications.map(n => <NotificationItem key={n.id} notification={n} allUsers={allUsers} />)
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>لا توجد إشعارات بعد.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout, getAllUsers } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<UserType[]>([]);


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if(user) {
        const users = getAllUsers(true);
        setAllUsers(users);
    }
  }, [user, loading, router, getAllUsers]);
  
  const handleLogout = () => {
    logout();
    toast({
      title: 'تم تسجيل الخروج',
    })
    router.replace('/login');
  };

  if (loading || !user) {
    return <Loading />;
  }
  
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <Link href="/app/withdraw">
            <Button variant="outline" className="gap-2">
                <Wallet className="h-5 w-5" />
                <span>السحب</span>
            </Button>
        </Link>
        <div className="flex items-center gap-2">
            <NotificationsPopover allUsers={allUsers} />
          <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
             <Avatar className="h-8 w-8">
              <AvatarImage src={user.profile.avatarUrl} alt={user.profile.name} />
              <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">الملف الشخصي</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <footer className="sticky bottom-0 z-10 border-t bg-background/80 backdrop-blur-sm">
        <nav className="grid h-16 grid-cols-4 items-center justify-around gap-4 px-2 sm:px-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href) && (href !== '/app' || pathname === '/app');
            return (
              <Link
                href={href}
                key={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-center text-xs font-medium transition-colors sm:text-sm",
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
