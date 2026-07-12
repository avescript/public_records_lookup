'use client';

import React from 'react';

import { LocateStep } from '@/components/staff/LocateStep';
import { WorkflowStep } from '@/components/staff/WorkflowNavigation';

export default function LocatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: requestId } = React.use(params);
  const completedSteps: WorkflowStep[] = []; // This would come from request data

  return <LocateStep requestId={requestId} completedSteps={completedSteps} />;
}
