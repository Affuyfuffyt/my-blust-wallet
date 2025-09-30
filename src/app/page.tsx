// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from './loading';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // For now, we will just redirect to the login page.
    // We will add the logic to check for a logged in user later.
    router.replace('/login');
  }, [router]);

  return <Loading />;
}
