'use client';

import { useEffect } from 'react';

export default function TrackPage() {
  useEffect(() => {
    // Redirect to status page for backward compatibility
    window.location.href = '/status';
  }, []);

  return null;
}
