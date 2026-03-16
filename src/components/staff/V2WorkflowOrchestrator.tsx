/**
 * V2 Workflow Orchestrator
 * Coordinates the entire V2 step-by-step workflow from request landing to delivery
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CompleteIcon,
  Edit as RedactIcon,
  Psychology as AIIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import { Paper, Step, StepLabel, Stepper } from '@/components/migration';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@/components/migration';
import { useAuth } from '@/contexts/AuthContext';
import { v2WorkflowOrchestrator } from '@/services/v2WorkflowOrchestrator';
import { PublicRecordRequest } from '@/types/request';
import { GeneratedResponse } from '@/types/response';

// Import V2 Step Components
import { AIResponseGenerator } from './AIResponseGenerator';
import { ReviewInterface } from './ReviewInterface';

interface V2WorkflowOrchestratorProps {
  requestId: string;
  initialStep?: number;
}

const WORKFLOW_STEPS = [
  {
    key: 'locate',
    label: 'Locate Records',
    description: 'AI-assisted record discovery and selection',
    icon: SearchIcon,
    component: 'LocateInterface', // Future implementation
  },
  {
    key: 'redact',
    label: 'Redact Sensitive Info',
    description: 'Enhanced AI redaction with manual refinement',
    icon: RedactIcon,
    component: 'RedactionInterface', // Future implementation
  },
  {
    key: 'respond',
    label: 'Generate Response',
    description: 'AI-powered response drafting and editing',
    icon: AIIcon,
    component: 'AIResponseGenerator',
  },
  {
    key: 'review',
    label: 'Review & Send',
    description: 'Final approval and automated delivery',
    icon: ReviewIcon,
    component: 'ReviewInterface',
  },
];

export function V2WorkflowOrchestrator({
  requestId,
  initialStep = 0,
}: V2WorkflowOrchestratorProps) {
  const { user } = useAuth();
  const router = useRouter();

  // State Management
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [request, setRequest] = useState<PublicRecordRequest | null>(null);
  const [generatedResponse, setGeneratedResponse] =
    useState<GeneratedResponse | null>(null);
  const [workflowData, setWorkflowData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>(
    {}
  );

  // Load workflow state
  const loadWorkflowState = useCallback(async () => {
    try {
      setLoading(true);
      const state = await v2WorkflowOrchestrator.getWorkflowState(requestId);

      setRequest(state.request);
      setGeneratedResponse(state.response);
      setWorkflowData(state.data);
      setCurrentStep(state.currentStep);
      setStepValidation(state.stepValidation);
    } catch (err) {
      console.error('Failed to load workflow state:', err);
      setError('Failed to load workflow state');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  // Save workflow state
  const saveWorkflowState = useCallback(
    async (stepData: any) => {
      try {
        await v2WorkflowOrchestrator.saveStepProgress(
          requestId,
          currentStep,
          stepData
        );
        setWorkflowData(prev => ({ ...prev, [currentStep]: stepData }));
      } catch (err) {
        console.error('Failed to save workflow state:', err);
      }
    },
    [requestId, currentStep]
  );

  // Step navigation
  const handleStepChange = useCallback(
    async (step: number) => {
      // Validate current step before proceeding
      if (step > currentStep && !stepValidation[currentStep]) {
        return;
      }

      setCurrentStep(step);
      await v2WorkflowOrchestrator.updateCurrentStep(requestId, step);
    },
    [requestId, currentStep, stepValidation]
  );

  const handleNext = useCallback(() => {
    if (currentStep < WORKFLOW_STEPS.length - 1) {
      handleStepChange(currentStep + 1);
    }
  }, [currentStep, handleStepChange]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  }, [currentStep, handleStepChange]);

  // Load initial data
  useEffect(() => {
    loadWorkflowState();
  }, [loadWorkflowState]);

  // Render step component
  const renderStepComponent = () => {
    const step = WORKFLOW_STEPS[currentStep];

    switch (step.component) {
      case 'AIResponseGenerator':
        return (
          <AIResponseGenerator
            request={request!}
            onSave={response => {
              setGeneratedResponse(response);
              saveWorkflowState({ response });
              setStepValidation(prev => ({ ...prev, [currentStep]: true }));
            }}
            onSend={response => {
              setGeneratedResponse(response);
              saveWorkflowState({ response, sent: true });
              setStepValidation(prev => ({ ...prev, [currentStep]: true }));
              handleNext();
            }}
          />
        );

      case 'ReviewInterface':
        return (
          <ReviewInterface
            requestId={requestId}
            responseData={generatedResponse}
            redactionData={workflowData?.redaction}
            onApprovalComplete={handleNext}
            onRejectRequest={() => {
              // Handle rejection workflow
              setError(
                'Request was rejected. Please review and make necessary changes.'
              );
            }}
            onRequestChanges={() => {
              // Return to response generation step
              handleStepChange(2);
            }}
            showApprovalControls={true}
          />
        );

      default:
        return (
          <Card>
            <CardContent>
              <Alert severity='info'>
                <Typography variant='h6'>{step.label}</Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {step.description}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 2 }}
                >
                  This step is not yet implemented. Click &quot;Next&quot; to
                  continue to the next step.
                </Typography>
                <Button
                  variant='outlined'
                  onClick={handleNext}
                  disabled={currentStep >= WORKFLOW_STEPS.length - 1}
                  sx={{ mt: 2 }}
                >
                  Skip to Next Step
                </Button>
              </Alert>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading workflow...</Typography>
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>
          {error || 'Request not found'}
          <Button onClick={loadWorkflowState} sx={{ ml: 2 }}>
            <RefreshIcon sx={{ mr: 1 }} />
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  const currentStepData = WORKFLOW_STEPS[currentStep];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' gutterBottom>
          V2 Workflow: {request.requestDetails.subject}
        </Typography>
        <Typography variant='body1' color='text.secondary' gutterBottom>
          Request #{request.requestNumber} • {request.requesterInfo.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Chip
            label={`Step ${currentStep + 1} of ${WORKFLOW_STEPS.length}`}
            color='primary'
            variant='outlined'
          />
          <Chip label={currentStepData.label} color='secondary' />
          {stepValidation[currentStep] && (
            <Chip
              icon={<CompleteIcon />}
              label='Completed'
              color='success'
              size='small'
            />
          )}
        </Box>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {WORKFLOW_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <Step key={step.key} completed={stepValidation[index]}>
                <StepLabel
                  icon={<StepIcon />}
                  onClick={() => handleStepChange(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box>
                    <Typography variant='subtitle2'>{step.label}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {step.description}
                    </Typography>
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Current Step Content */}
      <Box sx={{ mb: 3 }}>{renderStepComponent()}</Box>

      {/* Navigation Controls */}
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            startIcon={<BackIcon />}
            onClick={handleBack}
            disabled={currentStep === 0}
            variant='outlined'
          >
            Previous Step
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {currentStep + 1} of {WORKFLOW_STEPS.length}
            </Typography>
            <LinearProgress
              variant='determinate'
              value={((currentStep + 1) / WORKFLOW_STEPS.length) * 100}
              sx={{ width: 100, ml: 1 }}
            />
          </Box>

          <Button
            endIcon={<NextIcon />}
            onClick={handleNext}
            disabled={
              currentStep >= WORKFLOW_STEPS.length - 1 ||
              !stepValidation[currentStep]
            }
            variant='contained'
          >
            {currentStep === WORKFLOW_STEPS.length - 1
              ? 'Complete Workflow'
              : 'Next Step'}
          </Button>
        </Box>

        {!stepValidation[currentStep] && (
          <Alert severity='info' sx={{ mt: 2 }}>
            Complete the current step to proceed to the next step.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default V2WorkflowOrchestrator;
