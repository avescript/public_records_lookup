'use client';

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

import { StepNavigation, WorkflowStep } from '../shared/StepNavigation';

interface RespondStepProps {
  requestId: string;
}

export function RespondStep({ requestId }: RespondStepProps) {
  const completedSteps: WorkflowStep[] = ['locate', 'redact'];
  const currentStep: WorkflowStep = 'respond';

  return (
    <Box>
      <StepNavigation
        requestId={requestId}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Step 3: Respond
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered response generation with customizable templates.
          This step will be implemented in Epic V2-4.
        </Typography>
      </Paper>
    </Box>
  );
}