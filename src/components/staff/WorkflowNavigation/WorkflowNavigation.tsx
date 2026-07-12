'use client';

import React from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Dashboard as DashboardIcon,
  NavigateNext as NavigateNextIcon,
  PlayArrow as PlayArrowIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  stepConnectorClasses,
  type StepIconProps,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import {
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  LinearProgress,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from '@/components/migration';

import { StepSummaryCards } from './StepSummaryCards';
import {
  StyledBreadcrumbContainer,
  StyledNavigationPaper,
  StyledProgressContainer,
  StyledStepperContainer,
} from './WorkflowNavigation.styles';

export type WorkflowStep = 'locate' | 'redact' | 'respond' | 'review';

export interface WorkflowNavigationProps {
  requestId: string;
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  disabled?: boolean;
  showProgress?: boolean;
  showSummaryCards?: boolean;
  stepValidations?: Array<{
    step: WorkflowStep;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    completionPercentage: number;
  }>;
  onStepValidationRequest?: (step: WorkflowStep) => Promise<void>;
}

const steps: Array<{
  key: WorkflowStep;
  label: string;
  description: string;
}> = [
  {
    key: 'locate',
    label: 'Locate',
    description: 'Find and select relevant records',
  },
  {
    key: 'redact',
    label: 'Redact',
    description: 'Review and redact sensitive information',
  },
  {
    key: 'respond',
    label: 'Respond',
    description: 'Draft response and prepare package',
  },
  {
    key: 'review',
    label: 'Review & Send',
    description: 'Final review and delivery',
  },
];

const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 1,
  },
}));

interface StepIconComponentProps extends StepIconProps {
  completed: boolean;
  active: boolean;
  hasErrors?: boolean;
  hasWarnings?: boolean;
}

function StepIconComponent({
  active,
  completed,
  hasErrors,
  hasWarnings,
}: StepIconComponentProps) {
  let icon;

  if (completed) {
    icon = (
      <CheckCircleIcon
        sx={{
          color: hasErrors ? 'error.main' : 'success.main',
          fontSize: '1.8rem',
        }}
      />
    );
  } else if (active) {
    icon = (
      <PlayArrowIcon
        sx={{
          color: hasErrors
            ? 'error.main'
            : hasWarnings
              ? 'warning.main'
              : 'primary.main',
          fontSize: '1.8rem',
        }}
      />
    );
  } else {
    icon = (
      <CircleIcon
        sx={{
          color: 'grey.400',
          fontSize: '1.8rem',
        }}
      />
    );
  }

  if (hasErrors || hasWarnings) {
    return (
      <Badge
        badgeContent={<WarningIcon sx={{ fontSize: '0.75rem' }} />}
        color={hasErrors ? 'error' : 'warning'}
      >
        {icon}
      </Badge>
    );
  }

  return icon;
}

export function WorkflowNavigation({
  requestId,
  currentStep,
  completedSteps,
  disabled = false,
  showProgress = true,
  showSummaryCards = false,
  stepValidations = [],
  onStepValidationRequest,
}: WorkflowNavigationProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const isStepCompleted = (stepKey: WorkflowStep) =>
    completedSteps.includes(stepKey);

  const getStepValidation = (stepKey: WorkflowStep) =>
    stepValidations.find(v => v.step === stepKey);

  const isStepAccessible = (stepKey: WorkflowStep, index: number) => {
    // Current step is always accessible
    if (stepKey === currentStep) return true;

    // Completed steps are always accessible
    if (isStepCompleted(stepKey)) return true;

    // Check validation gating
    const validation = getStepValidation(currentStep);
    const isCurrentStepValid = !validation || validation.isValid;

    // Next step is accessible if current step is completed OR current step is valid (for navigation)
    if (index === currentStepIndex + 1) {
      return isStepCompleted(currentStep) || isCurrentStepValid;
    }

    // Previous steps are accessible if they're completed
    if (index < currentStepIndex) {
      return isStepCompleted(stepKey);
    }

    return false;
  };

  const handleStepClick = (stepKey: WorkflowStep, index: number) => {
    if (disabled) return;

    const validation = getStepValidation(stepKey);
    const isAccessible = isStepAccessible(stepKey, index);

    // If step has validation errors, show tooltip or prevent navigation
    if (!isAccessible) {
      if (validation && validation.errors.length > 0) {
        console.warn(
          `Cannot navigate to ${stepKey}: ${validation.errors.join(', ')}`
        );
        return;
      }
    }

    router.push(`/admin/request/${requestId}/workflow/${stepKey}` as any);
  };

  const handleDashboardClick = () => {
    router.push('/admin/staff' as any);
  };

  // Calculate overall validation status
  const overallErrors = stepValidations.reduce(
    (acc, v) => acc + v.errors.length,
    0
  );
  const overallWarnings = stepValidations.reduce(
    (acc, v) => acc + v.warnings.length,
    0
  );

  return (
    <>
      <StyledNavigationPaper>
        {/* Breadcrumbs */}
        <StyledBreadcrumbContainer>
          <Breadcrumbs separator={<NavigateNextIcon fontSize='small' />}>
            <Button
              startIcon={<DashboardIcon />}
              onClick={handleDashboardClick}
              variant='text'
              size='sm'
              className='breadcrumb-button'
            >
              Dashboard
            </Button>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              Request {requestId}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={
                  steps.find(s => s.key === currentStep)?.label || 'Unknown'
                }
                color='primary'
                size='small'
              />
              {overallErrors > 0 && (
                <Tooltip
                  title={`${overallErrors} validation error${overallErrors !== 1 ? 's' : ''}`}
                >
                  <Chip
                    label={`${overallErrors} error${overallErrors !== 1 ? 's' : ''}`}
                    color='error'
                    size='small'
                    variant='outlined'
                  />
                </Tooltip>
              )}
              {overallWarnings > 0 && (
                <Tooltip
                  title={`${overallWarnings} validation warning${overallWarnings !== 1 ? 's' : ''}`}
                >
                  <Chip
                    label={`${overallWarnings} warning${overallWarnings !== 1 ? 's' : ''}`}
                    color='warning'
                    size='small'
                    variant='outlined'
                  />
                </Tooltip>
              )}
            </Box>
          </Breadcrumbs>
        </StyledBreadcrumbContainer>

        {/* Progress Bar */}
        {showProgress && (
          <StyledProgressContainer>
            <Box className='progress-header'>
              <Typography className='progress-label'>
                Workflow Progress
              </Typography>
              <Typography className='progress-label'>
                {Math.round(progress)}% Complete
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={progress}
              className='progress-bar'
              color={
                overallErrors > 0
                  ? 'error'
                  : overallWarnings > 0
                    ? 'warning'
                    : 'primary'
              }
            />

            {/* Validation Summary */}
            {(overallErrors > 0 || overallWarnings > 0) && (
              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                {overallErrors > 0 && (
                  <Typography
                    variant='caption'
                    color='error'
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <WarningIcon sx={{ fontSize: '1rem' }} />
                    {overallErrors} error{overallErrors !== 1 ? 's' : ''} need
                    attention
                  </Typography>
                )}
                {overallWarnings > 0 && (
                  <Typography
                    variant='caption'
                    color='warning.main'
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <WarningIcon sx={{ fontSize: '1rem' }} />
                    {overallWarnings} warning{overallWarnings !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            )}
          </StyledProgressContainer>
        )}

        {/* Step Navigation */}
        <StyledStepperContainer>
          <Stepper
            activeStep={currentStepIndex}
            connector={<StyledStepConnector />}
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {steps.map((step, index) => {
              const isCompleted = isStepCompleted(step.key);
              const isActive = step.key === currentStep;
              const isAccessible = isStepAccessible(step.key, index);
              const validation = getStepValidation(step.key);
              const hasErrors = validation
                ? validation.errors.length > 0
                : false;
              const hasWarnings = validation
                ? validation.warnings.length > 0
                : false;

              const stepTooltip = () => {
                if (!isAccessible && !disabled) {
                  return 'Complete previous steps to unlock';
                }
                if (hasErrors) {
                  return `Errors: ${validation!.errors.join(', ')}`;
                }
                if (hasWarnings) {
                  return `Warnings: ${validation!.warnings.join(', ')}`;
                }
                return step.description;
              };

              return (
                <Step
                  key={step.key}
                  completed={isCompleted}
                  className={!isAccessible || disabled ? 'step-disabled' : ''}
                >
                  <Tooltip title={stepTooltip()} placement='top'>
                    <StepLabel
                      StepIconComponent={props => (
                        <StepIconComponent
                          {...props}
                          completed={isCompleted}
                          active={isActive}
                          hasErrors={hasErrors}
                          hasWarnings={hasWarnings}
                        />
                      )}
                      onClick={() => handleStepClick(step.key, index)}
                      sx={{
                        cursor:
                          isAccessible && !disabled ? 'pointer' : 'default',
                      }}
                    >
                      <Typography
                        variant='body1'
                        component='div'
                        className={
                          isActive
                            ? 'step-active'
                            : isCompleted
                              ? 'step-completed'
                              : ''
                        }
                        sx={{
                          color: hasErrors
                            ? 'error.main'
                            : hasWarnings
                              ? 'warning.main'
                              : undefined,
                        }}
                      >
                        {step.label}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        className='step-description'
                      >
                        {step.description}
                      </Typography>

                      {/* Validation indicators */}
                      {validation && (
                        <Box
                          sx={{
                            mt: 0.5,
                            display: 'flex',
                            gap: 0.5,
                            justifyContent: 'center',
                          }}
                        >
                          {validation.errors.length > 0 && (
                            <Chip
                              label={`${validation.errors.length} error${validation.errors.length !== 1 ? 's' : ''}`}
                              color='error'
                              size='small'
                              variant='outlined'
                              sx={{ fontSize: '0.65rem', height: '18px' }}
                            />
                          )}
                          {validation.warnings.length > 0 && (
                            <Chip
                              label={`${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''}`}
                              color='warning'
                              size='small'
                              variant='outlined'
                              sx={{ fontSize: '0.65rem', height: '18px' }}
                            />
                          )}
                        </Box>
                      )}
                    </StepLabel>
                  </Tooltip>
                </Step>
              );
            })}
          </Stepper>
        </StyledStepperContainer>
      </StyledNavigationPaper>

      {/* Step Summary Cards */}
      {showSummaryCards && (
        <StepSummaryCards
          requestId={requestId}
          currentStep={currentStep}
          completedSteps={completedSteps}
          stepValidations={stepValidations}
          stepSummaries={[]}
          onStepValidationRequest={onStepValidationRequest}
        />
      )}
    </>
  );
}
