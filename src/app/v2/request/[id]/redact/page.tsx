'use client';

import React from 'react';
import { V2WorkflowLayout } from '@/components/v2/shared/V2WorkflowLayout';
import { RedactStep } from '@/components/v2/steps/RedactStep';

interface RedactPageProps {
  params: {
    id: string;
  };
}

export default function RedactPage({ params }: RedactPageProps) {
  return (
    <V2WorkflowLayout>
      <RedactStep requestId={params.id} />
    </V2WorkflowLayout>
  );
}