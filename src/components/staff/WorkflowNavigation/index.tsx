'use client';

import React from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Dashboard as DashboardIcon,
  NavigateNext as NavigateNextIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Chip,
  LinearProgress,
  Step,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  StepLabel,
  Stepper,
  styled,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/core/Button';

import { 
  StyledBreadcrumbContainer, 
  StyledNavigationPaper, 
  StyledProgressContainer, 
  StyledStepperContainer 
} from './WorkflowNavigation.styles';

export type WorkflowStep = 'locate' | 'redact' | 'respond' | 'review';

export interface WorkflowNavigationProps {
  requestId: string;
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  disabled?: boolean;
  showProgress?: boolean;
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
}

function StepIconComponent({ active, completed }: StepIconComponentProps) {
  if (completed) {
    return (
      <CheckCircleIcon
        sx={{ 
          color: 'success.main',
          fontSize: '1.8rem',
        }}
      />
    );
  }

  if (active) {
    return (
      <PlayArrowIcon
        sx={{ 
          color: 'primary.main',
          fontSize: '1.8rem',
        }}
      />
    );
  }

  return (
    <CircleIcon
      sx={{ 
        color: 'grey.400',
        fontSize: '1.8rem',
      }}
    />
  );
}

export function WorkflowNavigation({
  requestId,
  currentStep,
  completedSteps,
  disabled = false,
  showProgress = true,
}: WorkflowNavigationProps) {
  const router = useRouter();
  
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const isStepCompleted = (stepKey: WorkflowStep) => completedSteps.includes(stepKey);
  const isStepAccessible = (stepKey: WorkflowStep, index: number) => {
    // Current step is always accessible
    if (stepKey === currentStep) return true;
    
    // Completed steps are always accessible
    if (isStepCompleted(stepKey)) return true;
    
    // Next step is accessible if current step is completed
    if (index === currentStepIndex + 1 && isStepCompleted(currentStep)) return true;
    
    return false;
  };

  const handleStepClick = (stepKey: WorkflowStep, index: number) => {
    if (disabled || !isStepAccessible(stepKey, index)) return;
    
    router.push(`/admin/request/${requestId}/workflow/${stepKey}` as any);
  };

  const handleDashboardClick = () => {
    router.push('/admin/staff' as any);
  };

  return (
    <StyledNavigationPaper>
      {/* Breadcrumbs */}
      <StyledBreadcrumbContainer>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Button
            startIcon={<DashboardIcon />}
            onClick={handleDashboardClick}
            variant="text"
            size="sm"
            className="breadcrumb-button"
          >
            Dashboard
          </Button>
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            Request {requestId}
          </Typography>
          <Chip 
            label={steps.find(s => s.key === currentStep)?.label || 'Unknown'}
            color="primary"
            size="small"
          />
        </Breadcrumbs>
      </StyledBreadcrumbContainer>

      {/* Progress Bar */}
      {showProgress && (
        <StyledProgressContainer>
          <Box className="progress-header">
            <Typography className="progress-label">
              Workflow Progress
            </Typography>
            <Typography className="progress-label">
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            className="progress-bar"
          />
        </StyledProgressContainer>
      )}

      {/* Step Navigation */}
      <StyledStepperContainer>
        <Stepper
          activeStep={currentStepIndex}
          connector={<StyledStepConnector />}
          alternativeLabel
        >
          {steps.map((step, index) => {
            const isCompleted = isStepCompleted(step.key);
            const isActive = step.key === currentStep;
            const isAccessible = isStepAccessible(step.key, index);

            return (
              <Step key={step.key} completed={isCompleted} className={!isAccessible || disabled ? 'step-disabled' : ''}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <StepIconComponent
                      {...props}
                      completed={isCompleted}
                      active={isActive}
                    />
                  )}
                  onClick={() => handleStepClick(step.key, index)}
                >
                  <Typography 
                    variant="body1" 
                    component="div"
                    className={isActive ? 'step-active' : isCompleted ? 'step-completed' : ''}
                  >
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="step-description">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </StyledStepperContainer>
    </StyledNavigationPaper>
  );
}