'use client';

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

import { StepNavigation, WorkflowStep } from '../shared/StepNavigation';

interface RedactStepProps {
  requestId: string;
}

export function RedactStep({ requestId }: RedactStepProps) {
  const completedSteps: WorkflowStep[] = ['locate'];
  const currentStep: WorkflowStep = 'redact';

  return (
    <Box>
      <StepNavigation
        requestId={requestId}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Step 2: Redact
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered redaction system with manual refinement capabilities.
          This step will be implemented in Epic V2-3.
        </Typography>
      </Paper>
    </Box>
  );
}