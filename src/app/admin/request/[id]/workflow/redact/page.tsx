'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  RedactedRecordSummary,
  RedactStep,
} from '@/components/staff/v2/RedactStep';
import { WorkflowStep } from '@/components/staff/WorkflowNavigation';
import { WorkflowPage } from '@/components/staff/WorkflowPage';

export default function RedactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: requestId } = React.use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const completedSteps: WorkflowStep[] = ['locate'];

  // Selected record IDs may be passed via query string from the Locate step
  const selectedRecordsParam = searchParams.get('records');
  const selectedRecords = selectedRecordsParam
    ? selectedRecordsParam.split(',').filter(Boolean)
    : [];

  const handleRedactionComplete = (summaries: RedactedRecordSummary[]) => {
    const recordIds = summaries.map(s => s.recordId).join(',');
    router.push(
      `/admin/request/${requestId}/workflow/respond?records=${encodeURIComponent(recordIds)}`
    );
  };

  return (
    <WorkflowPage
      requestId={requestId}
      currentStep='redact'
      completedSteps={completedSteps}
      title='Redact Sensitive Information'
      subtitle='Review selected records and redact any sensitive or personally identifiable information before responding to the request.'
    >
      <RedactStep
        requestId={requestId}
        selectedRecords={selectedRecords}
        onRedactionComplete={handleRedactionComplete}
      />
    </WorkflowPage>
  );
}
