// src/app/app/apps/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AppItem } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Download, AppWindow } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function AppsPage() {
  const { user, getApps } = useAuth();
  const [apps, setApps] = useState<AppItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApps = async () => {
      if(user) {
        const allApps = await getApps();
        setApps(allApps);
      }
    };
    fetchApps();
  }, [getApps, user]);

  const handleDownload = (app: AppItem) => {
    try {
      window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: 'فتح رابط التحميل',
        description: `سيتم توجيهك لتحميل ${app.name}...`
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'فشل التحميل',
        description: 'لم نتمكن من فتح رابط تحميل التطبيق.'
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">تطبيقاتي</h1>
      {apps.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app) => (
            <Card key={app.id} className="flex flex-col overflow-hidden animate-in fade-in-50 duration-500 shadow-lg hover:shadow-primary/20 transition-shadow">
              <CardHeader className="flex-row items-center gap-4 p-4">
                 <Image src={app.iconUrl} alt={app.name} width={64} height={64} className="rounded-xl border" />
                 <div className="flex-1">
                    <CardTitle className="text-xl">{app.name}</CardTitle>
                    <CardDescription className="text-sm mt-1 h-10 overflow-hidden text-ellipsis">
                        {app.description}
                    </CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 pt-0">
                 <div className="aspect-video w-full relative rounded-lg overflow-hidden border">
                    <Image src={app.iconUrl} alt={app.name} fill className="object-contain p-8" />
                 </div>
              </CardContent>
              <CardFooter className="p-4">
                <Button className="w-full font-bold gap-2" onClick={() => handleDownload(app)}>
                  <Download className="h-5 w-5" />
                  تحميل
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <AppWindow className="mx-auto h-16 w-16 mb-4" />
          <h2 className="text-xl font-semibold">لا توجد تطبيقات متاحة بعد</h2>
          <p>سيتم إضافة التطبيقات هنا قريبًا.</p>
        </div>
      )}
    </div>
  );
}
