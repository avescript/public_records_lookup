'use client';

import React from 'react';
import { V2WorkflowLayout } from '@/components/v2/shared/V2WorkflowLayout';
import { LocateStep } from '@/components/v2/steps/LocateStep';

interface LocatePageProps {
  params: {
    id: string;
  };
}

export default function LocatePage({ params }: LocatePageProps) {
  return (
    <V2WorkflowLayout>
      <LocateStep requestId={params.id} />
    </V2WorkflowLayout>
  );
}