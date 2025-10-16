'use client';

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

import { WorkflowNavigation, WorkflowStep } from '@/components/staff/WorkflowNavigation';

import { 
  StyledPageContainer,
  StyledContentPaper,
  StyledStepHeader,
} from './WorkflowPage.styles';

export interface WorkflowPageProps {
  requestId: string;
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function WorkflowPage({
  requestId,
  currentStep,
  completedSteps,
  title,
  subtitle,
  children,
  disabled = false,
}: WorkflowPageProps) {
  return (
    <StyledPageContainer>
      <WorkflowNavigation
        requestId={requestId}
        currentStep={currentStep}
        completedSteps={completedSteps}
        disabled={disabled}
        showProgress
      />
      
      <StyledContentPaper>
        <StyledStepHeader>
          <Typography variant="h4" component="h1" className="step-title">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" className="step-subtitle">
              {subtitle}
            </Typography>
          )}
        </StyledStepHeader>
        
        <Box className="step-content">
          {children}
        </Box>
      </StyledContentPaper>
    </StyledPageContainer>
  );
}