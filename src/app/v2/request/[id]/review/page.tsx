'use client';

import React from 'react';
import { V2WorkflowLayout } from '@/components/v2/shared/V2WorkflowLayout';
import { ReviewStep } from '@/components/v2/steps/ReviewStep';

interface ReviewPageProps {
  params: {
    id: string;
  };
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return (
    <V2WorkflowLayout>
      <ReviewStep requestId={params.id} />
    </V2WorkflowLayout>
  );
}