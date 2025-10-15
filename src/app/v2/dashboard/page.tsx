'use client';

import React from 'react';
import { V2Dashboard } from '@/components/v2/dashboard/V2Dashboard';
import { V2WorkflowLayout } from '@/components/v2/shared/V2WorkflowLayout';

export default function V2DashboardPage() {
  return (
    <V2WorkflowLayout>
      <V2Dashboard />
    </V2WorkflowLayout>
  );
}