import { Button as MuiButton, Paper, styled } from '@mui/material';

import { tokens } from '@/theme/tokens';

export const StyledNavigationPaper = styled(Paper)(({ theme }) => ({
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.lg,
  borderRadius: tokens.radii.lg,
  border: `1px solid ${theme.palette.divider}`,
}));

export const StyledProgressContainer = styled('div')(() => ({
  marginBottom: tokens.spacing.lg,
  
  '& .progress-header': {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  
  '& .progress-label': {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.grey[600],
  },
  
  '& .progress-bar': {
    height: 8,
    borderRadius: tokens.radii.md,
  },
}));

export const StyledBreadcrumbContainer = styled('div')(() => ({
  marginBottom: tokens.spacing.lg,
  
  '& .breadcrumb-button': {
    minWidth: 'auto',
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    fontSize: tokens.typography.fontSizes.sm,
  },
}));

export const StyledStepperContainer = styled('div')(() => ({
  '& .MuiStep-root': {
    cursor: 'pointer',
    
    '&.step-disabled': {
      cursor: 'default',
      opacity: 0.6,
    },
  },
  
  '& .MuiStepLabel-label': {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.medium,
    
    '&.step-active': {
      color: tokens.colors.primary.main,
      fontWeight: tokens.typography.fontWeights.bold,
    },
    
    '&.step-completed': {
      color: tokens.colors.success.main,
    },
  },
  
  '& .step-description': {
    fontSize: tokens.typography.fontSizes.xs,
    marginTop: tokens.spacing.xs,
  },
}));