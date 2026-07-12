'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TrackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to status page for backward compatibility
    const trackingId = searchParams.get('trackingId');
    if (trackingId) {
      window.location.href = `/status?trackingId=${encodeURIComponent(trackingId)}`;
      return;
    }

    window.location.href = '/status';
  }, [searchParams]);

  return null;
}
