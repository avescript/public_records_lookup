'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function V2HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the V2 dashboard
    router.push('/v2/dashboard' as any);
  }, [router]);

  return null;
}