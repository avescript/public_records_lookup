'use client';

import { useEffect } from 'react';

export default function AdminPage() {
  useEffect(() => {
    // Redirect to staff dashboard as the main admin entry point
    window.location.href = '/admin/staff';
  }, []);

  return null;
}