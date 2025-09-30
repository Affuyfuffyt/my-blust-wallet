// src/app/app/currencies/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, DollarSign, Coins, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Conversion rates
const BLUST_TO_USD = 1 / 6000;
const USD_TO_IQD = 1310;

// Coin component for the background animation
function FallingCoin({ delay }: { delay: number }) {
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  return (
    <motion.div
      className="absolute text-yellow-400 opacity-50 text-2xl"
      style={{
        left: `${Math.random() * 100}%`,
        transform: `scale(${Math.random() * 0.5 + 0.5})`,
      }}
      initial={{ top: -50, rotate: Math.random() * 360 }}
      animate={{ top: screenHeight + 50 }}
      transition={{
        duration: Math.random() * 5 + 5,
        repeat: Infinity,
        repeatType: 'loop',
        delay: delay,
        ease: 'linear',
      }}
    >
      <Coins className="h-6 w-6" />
    </motion.div>
  );
}

export default function CurrenciesPage() {
  const { user, claimBlust, loading } = useAuth();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const blustBalance = user?.blustBalance ?? 0;
  const usdBalance = blustBalance * BLUST_TO_USD;
  const iqdBalance = usdBalance * USD_TO_IQD;
  
  const calculateTimeLeft = useCallback(() => {
    if (user?.lastBlustClaim) {
      const lastClaimDate = new Date(user.lastBlustClaim);
      const nextClaimDate = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = nextClaimDate.getTime() - now.getTime();
      setTimeLeft(diff > 0 ? diff : 0);
    } else {
      setTimeLeft(0);
    }
  }, [user?.lastBlustClaim]);
  
  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);
  
  const handleClaim = async () => {
    if (!user || isClaiming || (timeLeft && timeLeft > 0)) return;
    setIsClaiming(true);
    
    const result = await claimBlust();
    
    if (result.success) {
      toast({
        title: "تمت المطالبة بنجاح!",
        description: `لقد حصلت على 100 بلوست. رصيدك الآن ${result.newBalance}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: "لا يمكنك المطالبة الآن",
        description: result.message || 'الرجاء الانتظار حتى انتهاء العداد.',
      });
    }
    // No need to manually calculate time left, the effect will do it.
    setIsClaiming(false);
  };
  
  const formatTime = (ms: number | null) => {
    if (ms === null || ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isClaimable = timeLeft !== null && timeLeft <= 0;

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-background overflow-hidden p-4 text-foreground">
      {/* Falling coins animation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <FallingCoin key={i} delay={i * 0.5} />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-md h-full">
        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full mb-8 animate-in fade-in-50 duration-500">
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">رصيد بلوست</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blustBalance.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">بالدولار</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${usdBalance.toFixed(4)}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">بالدينار</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{iqdBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mining Sphere */}
        <div className="flex-grow flex items-center justify-center">
            <motion.div
            className="relative w-56 h-56 sm:w-64 sm:w-64 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 shadow-2xl shadow-primary/20"
            animate={{
                scale: isClaimable ? [1, 1.05, 1] : 1,
                boxShadow: isClaimable ? [
                '0 0 20px hsl(var(--primary) / 0.3)',
                '0 0 40px hsl(var(--primary) / 0.5)',
                '0 0 20px hsl(var(--primary) / 0.3)',
                ] : '0 0 10px hsl(var(--primary) / 0.2)',
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            >
                 <motion.div className="absolute w-full h-full rounded-full border-2 border-primary/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                 />
                 <motion.div className="absolute w-full h-full rounded-full border-2 border-accent/50"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear', delay: 2 }}
                 />
                <Zap className="h-24 w-24 text-primary" />
            </motion.div>
        </div>

        {/* Claim Button & Timer */}
        <div className="w-full mt-8 animate-in fade-in-50 duration-700 delay-300">
          {isClaimable ? (
            <Button
              className="w-full h-14 text-xl font-bold animate-pulse"
              size="lg"
              onClick={handleClaim}
              disabled={isClaiming || loading}
            >
              {isClaiming ? 'جاري التعدين...' : 'ابدأ التعدين (احصل على 100 بلوست)'}
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">الوقت المتبقي للجولة التالية</p>
                <Card className="w-full p-4">
                    <p className="text-center text-3xl font-mono font-bold tracking-widest">
                        {formatTime(timeLeft)}
                    </p>
                </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
