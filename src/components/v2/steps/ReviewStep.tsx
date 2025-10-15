'use client';

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

import { StepNavigation, WorkflowStep } from '../shared/StepNavigation';

interface ReviewStepProps {
  requestId: string;
}

export function ReviewStep({ requestId }: ReviewStepProps) {
  const completedSteps: WorkflowStep[] = ['locate', 'redact', 'respond'];
  const currentStep: WorkflowStep = 'review';

  return (
    <Box>
      <StepNavigation
        requestId={requestId}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Step 4: Review & Send
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Final review and approval workflow with automated delivery.
          This step will be implemented in Epic V2-5.
        </Typography>
      </Paper>
    </Box>
  );
}