'use client';

import React from 'react';

import { V2WorkflowLayout } from '@/components/v2/shared/V2WorkflowLayout';
import { RespondStep } from '@/components/v2/steps/RespondStep';

interface RespondPageProps {
  params: {
    id: string;
  };
}

export default function RespondPage({ params }: RespondPageProps) {
  return (
    <V2WorkflowLayout>
      <RespondStep requestId={params.id} />
    </V2WorkflowLayout>
  );
}