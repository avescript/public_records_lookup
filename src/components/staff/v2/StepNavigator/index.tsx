'use client';

import React, { useState } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';

import {
  Box,
  Button,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@/components/migration';
import type { StoredRequest } from '@/services/requestService';

// Import step components
import { LocateStep } from '../LocateStep';
import { RedactStep } from '../RedactStep';
import { RespondStep } from '../RespondStep';
// import { ReviewStep } from './steps/ReviewStep';

interface StepNavigatorProps {
  requestId: string;
  currentStep: number;
  onStepChange: (step: number) => void;
  request: StoredRequest;
}

interface WorkflowStep {
  id: number;
  label: string;
  description: string;
  component?: React.ComponentType<any>;
  completed: boolean;
}

/**
 * Step Navigator Component
 * Manages the 4-step guided workflow navigation
 *
 * Steps:
 * 1. Locate - AI-powered record discovery and selection
 * 2. Redact - Enhanced AI redaction with manual refinement
 * 3. Respond - AI-powered response drafting and editing
 * 4. Review - Approval workflow and automated delivery
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-011 Request Navigation & Entry
 */
export function StepNavigator({
  requestId,
  currentStep,
  onStepChange,
  request,
}: StepNavigatorProps) {
  // Track step completion
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Track selected records from Locate step
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  const handleRecordsSelected = (recordIds: string[]) => {
    setSelectedRecords(recordIds);
    console.log('Selected records:', recordIds);
  };

  const handleRedactionComplete = (redactedRecords: any[]) => {
    console.log('Redaction completed:', redactedRecords);
    // Mark step 2 as complete
    setCompletedSteps(prev => new Set([...prev, 2]));
  };

  const handleResponseComplete = (responseSummary: any) => {
    console.log('Response completed:', responseSummary);
    // Mark step 3 as complete
    setCompletedSteps(prev => new Set([...prev, 3]));
  };

  const steps: WorkflowStep[] = [
    {
      id: 1,
      label: 'Locate',
      description: 'Find and select relevant records using AI-powered search',
      component: (props: any) => (
        <LocateStep
          {...props}
          requestTitle={request.title}
          requestDescription={request.description}
          onRecordsSelected={handleRecordsSelected}
          initialSelectedRecords={selectedRecords}
        />
      ),
      completed: completedSteps.has(1),
    },
    {
      id: 2,
      label: 'Redact',
      description: 'Apply AI redaction with manual review and refinement',
      component: (props: any) => (
        <RedactStep
          {...props}
          selectedRecords={selectedRecords}
          onRedactionComplete={handleRedactionComplete}
        />
      ),
      completed: completedSteps.has(2),
    },
    {
      id: 3,
      label: 'Respond',
      description: 'Generate and customize response with AI assistance',
      component: (props: any) => (
        <RespondStep
          {...props}
          request={request}
          onResponseComplete={handleResponseComplete}
        />
      ),
      completed: completedSteps.has(3),
    },
    {
      id: 4,
      label: 'Review',
      description: 'Final approval and automated delivery',
      // component: ReviewStep,
      completed: completedSteps.has(4),
    },
  ];

  const currentStepData = steps.find(s => s.id === currentStep);

  const handleNext = () => {
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Move to next step
    if (currentStep < steps.length) {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to any step
    onStepChange(stepId);
  };

  const StepContent = currentStepData?.component;

  return (
    <Box>
      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep - 1} alternativeLabel>
          {steps.map((step, index) => (
            <Step
              key={step.id}
              completed={step.completed}
              onClick={() => handleStepClick(step.id)}
              sx={{ cursor: 'pointer' }}
            >
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: step.completed
                        ? 'success.main'
                        : step.id === currentStep
                          ? 'primary.main'
                          : 'grey.300',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    {step.completed ? (
                      <CheckCircleIcon />
                    ) : (
                      <Typography variant='body1'>{step.id}</Typography>
                    )}
                  </Box>
                )}
              >
                <Typography variant='subtitle1'>{step.label}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant='h5' gutterBottom>
            Step {currentStep}: {currentStepData?.label}
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            {currentStepData?.description}
          </Typography>
        </Box>

        {/* Step Component (placeholder) */}
        {StepContent ? (
          <StepContent requestId={requestId} request={request} />
        ) : (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 1,
            }}
          >
            <Typography variant='h6' color='text.secondary' gutterBottom>
              {currentStepData?.label} Step
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              This step is under construction. Coming soon!
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ mt: 2, display: 'block' }}
            >
              For now, use the navigation buttons below to explore the workflow.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Navigation Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant='outlined'
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        <Button
          variant='contained'
          onClick={handleNext}
          disabled={currentStep === steps.length}
        >
          {currentStep === steps.length ? 'Complete' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}
