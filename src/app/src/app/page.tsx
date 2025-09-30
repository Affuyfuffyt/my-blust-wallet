"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Loading from './loading';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/app');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return <Loading />;
}
