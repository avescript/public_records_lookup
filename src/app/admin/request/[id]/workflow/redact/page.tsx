'use client';

import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

import { WorkflowStep } from '@/components/staff/WorkflowNavigation';
import { WorkflowPage } from '@/components/staff/WorkflowPage';

export default function RedactPage({ params }: { params: { id: string } }) {
  const requestId = params.id;
  const completedSteps: WorkflowStep[] = ['locate']; // Locate step should be completed to get here

  return (
    <WorkflowPage
      requestId={requestId}
      currentStep='redact'
      completedSteps={completedSteps}
      title='Redact Sensitive Information'
      subtitle='Review selected records and redact any sensitive or personally identifiable information before responding to the request.'
    >
      <Box sx={{ p: 3 }}>
        <Alert severity='info' sx={{ mb: 3 }}>
          <Typography variant='h6' gutterBottom>
            Redaction Step Implementation
          </Typography>
          <Typography>
            This step is part of the guided workflow system. The redaction
            interface will be implemented as part of Epic 9 or future
            development tasks. For now, you can navigate back to other workflow
            steps using the navigation above.
          </Typography>
        </Alert>

        <Typography variant='body1' color='text.secondary'>
          This page will contain:
        </Typography>
        <Box component='ul' sx={{ mt: 2, pl: 3 }}>
          <Typography component='li' variant='body2'>
            Document viewer with selected records from the Locate step
          </Typography>
          <Typography component='li' variant='body2'>
            PII detection and highlighting system
          </Typography>
          <Typography component='li' variant='body2'>
            Redaction drawing tools and controls
          </Typography>
          <Typography component='li' variant='body2'>
            Review and approval workflow integration
          </Typography>
        </Box>
      </Box>
    </WorkflowPage>
  );
}
