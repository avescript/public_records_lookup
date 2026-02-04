'use client';

import React, { useState } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Collapse,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';

import { WorkflowStep } from './index';

export interface StepValidation {
  step: WorkflowStep;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completionPercentage: number;
  estimatedTimeRemaining?: string;
}

export interface StepSummary {
  step: WorkflowStep;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'error';
  completedAt?: Date;
  assignedTo?: string;
  recordsFound?: number;
  redactionsApplied?: number;
  responseGenerated?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  timeSpent?: string;
}

export interface StepSummaryCardsProps {
  requestId: string;
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  stepValidations: StepValidation[];
  stepSummaries: StepSummary[];
  showDetailedView?: boolean;
  onStepValidationRequest?: (step: WorkflowStep) => Promise<void>;
}

// Mock data for demonstration
const mockValidations: StepValidation[] = [
  {
    step: 'locate',
    isValid: true,
    errors: [],
    warnings: ['Some records may require manual review'],
    completionPercentage: 100,
    estimatedTimeRemaining: '0 min',
  },
  {
    step: 'redact',
    isValid: false,
    errors: [
      'PII detection incomplete',
      'Manual review required for 3 documents',
    ],
    warnings: ['High confidence redactions need approval'],
    completionPercentage: 75,
    estimatedTimeRemaining: '15 min',
  },
  {
    step: 'respond',
    isValid: false,
    errors: ['Response template not selected'],
    warnings: [],
    completionPercentage: 25,
    estimatedTimeRemaining: '30 min',
  },
  {
    step: 'review',
    isValid: false,
    errors: ['Previous steps must be completed'],
    warnings: [],
    completionPercentage: 0,
    estimatedTimeRemaining: '45 min',
  },
];

const mockSummaries: StepSummary[] = [
  {
    step: 'locate',
    title: 'Records Located',
    description: 'AI-powered record discovery and selection',
    status: 'completed',
    completedAt: new Date(),
    assignedTo: 'System AI',
    recordsFound: 12,
    timeSpent: '2 min',
  },
  {
    step: 'redact',
    title: 'Redaction in Progress',
    description: 'PII detection and sensitive information redaction',
    status: 'in-progress',
    assignedTo: 'Legal Team',
    redactionsApplied: 23,
    timeSpent: '15 min',
  },
  {
    step: 'respond',
    title: 'Response Generation',
    description: 'AI-assisted response drafting and customization',
    status: 'blocked',
    responseGenerated: false,
  },
  {
    step: 'review',
    title: 'Final Review & Send',
    description: 'Approval workflow and automated delivery',
    status: 'not-started',
    approvalStatus: 'pending',
  },
];

function getStatusIcon(status: StepSummary['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon color='success' />;
    case 'in-progress':
      return <InfoIcon color='primary' />;
    case 'blocked':
      return <LockIcon color='warning' />;
    case 'error':
      return <ErrorIcon color='error' />;
    default:
      return null;
  }
}

function getStatusColor(
  status: StepSummary['status']
): 'success' | 'info' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'info';
    case 'blocked':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

export function StepSummaryCards({
  requestId,
  currentStep,
  completedSteps,
  stepValidations = mockValidations,
  stepSummaries = mockSummaries,
  showDetailedView = false,
  onStepValidationRequest,
}: StepSummaryCardsProps) {
  const [expandedCard, setExpandedCard] = useState<WorkflowStep | null>(null);

  const handleCardExpand = (step: WorkflowStep) => {
    setExpandedCard(expandedCard === step ? null : step);
  };

  const getValidation = (step: WorkflowStep) =>
    stepValidations.find(v => v.step === step);

  const getSummary = (step: WorkflowStep) =>
    stepSummaries.find(s => s.step === step);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Workflow Steps Overview
      </Typography>

      <Grid container spacing={2}>
        {stepSummaries.map(summary => {
          const validation = getValidation(summary.step);
          const isExpanded = expandedCard === summary.step;
          const isCurrentStep = currentStep === summary.step;
          const isCompleted = completedSteps.includes(summary.step);

          return (
            <Grid item xs={12} md={6} lg={3} key={summary.step}>
              <Card
                sx={{
                  height: 'fit-content',
                  cursor: 'pointer',
                  border: isCurrentStep ? 2 : 1,
                  borderColor: isCurrentStep ? 'primary.main' : 'divider',
                  bgcolor: isCurrentStep ? 'primary.50' : 'background.paper',
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleCardExpand(summary.step)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getStatusIcon(summary.status)}
                    <Typography variant='h6' sx={{ ml: 1, flexGrow: 1 }}>
                      {summary.title}
                    </Typography>
                    {isCurrentStep && (
                      <Typography
                        variant='caption'
                        color='primary'
                        sx={{ fontWeight: 'bold' }}
                      >
                        CURRENT
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {summary.description}
                  </Typography>

                  {/* Progress Bar */}
                  {validation && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant='caption'>Progress</Typography>
                        <Typography variant='caption'>
                          {validation.completionPercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={validation.completionPercentage}
                        color={
                          getStatusColor(summary.status) === 'default'
                            ? 'primary'
                            : (getStatusColor(summary.status) as any)
                        }
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      {validation.estimatedTimeRemaining && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          Est. {validation.estimatedTimeRemaining} remaining
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Quick Stats */}
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}
                  >
                    {summary.recordsFound && (
                      <Typography
                        variant='caption'
                        sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: 'success.100',
                          color: 'success.800',
                          borderRadius: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        {summary.recordsFound} records
                      </Typography>
                    )}
                    {summary.redactionsApplied && (
                      <Typography
                        variant='caption'
                        sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: 'warning.100',
                          color: 'warning.800',
                          borderRadius: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        {summary.redactionsApplied} redactions
                      </Typography>
                    )}
                    {summary.timeSpent && (
                      <Typography
                        variant='caption'
                        sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: 'info.100',
                          color: 'info.800',
                          borderRadius: 1,
                          fontSize: '0.7rem',
                        }}
                      >
                        {summary.timeSpent}
                      </Typography>
                    )}
                  </Box>

                  {/* Error/Warning Indicators */}
                  {validation && (
                    <Box>
                      {validation.errors.length > 0 && (
                        <Alert
                          severity='error'
                          variant='outlined'
                          sx={{ fontSize: '0.75rem', py: 0.5, mb: 0.5 }}
                        >
                          {validation.errors.length} error
                          {validation.errors.length !== 1 ? 's' : ''}
                        </Alert>
                      )}
                      {validation.warnings.length > 0 && (
                        <Alert
                          severity='warning'
                          variant='outlined'
                          sx={{ fontSize: '0.75rem', py: 0.5 }}
                        >
                          {validation.warnings.length} warning
                          {validation.warnings.length !== 1 ? 's' : ''}
                        </Alert>
                      )}
                    </Box>
                  )}

                  {/* Expanded Details */}
                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {summary.assignedTo && (
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          <strong>Assigned to:</strong> {summary.assignedTo}
                        </Typography>
                      )}
                      {summary.completedAt && (
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          <strong>Completed:</strong>{' '}
                          {summary.completedAt.toLocaleString()}
                        </Typography>
                      )}
                      {summary.approvalStatus && (
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          <strong>Approval:</strong> {summary.approvalStatus}
                        </Typography>
                      )}

                      {/* Detailed Errors/Warnings */}
                      {validation && validation.errors.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant='caption'
                            color='error'
                            sx={{ fontWeight: 'bold' }}
                          >
                            Errors:
                          </Typography>
                          {validation.errors.map((error, index) => (
                            <Typography
                              key={index}
                              variant='caption'
                              color='error'
                              sx={{ display: 'block', ml: 1 }}
                            >
                              • {error}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      {validation && validation.warnings.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant='caption'
                            color='warning.main'
                            sx={{ fontWeight: 'bold' }}
                          >
                            Warnings:
                          </Typography>
                          {validation.warnings.map((warning, index) => (
                            <Typography
                              key={index}
                              variant='caption'
                              color='warning.main'
                              sx={{ display: 'block', ml: 1 }}
                            >
                              • {warning}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
