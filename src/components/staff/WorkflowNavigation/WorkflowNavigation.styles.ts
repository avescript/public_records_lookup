import { Box, Paper, styled } from '@mui/material';

export const StyledNavigationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

export const StyledBreadcrumbContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  
  '& .breadcrumb-button': {
    minHeight: 'unset',
    padding: theme.spacing(0.5, 1),
    fontSize: '0.875rem',
    fontWeight: 500,
    
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  
  '& .MuiBreadcrumbs-separator': {
    margin: theme.spacing(0, 0.5),
    color: theme.palette.text.secondary,
  },
  
  '& .MuiChip-root': {
    fontWeight: 500,
    fontSize: '0.75rem',
  },
}));

export const StyledProgressContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  
  '& .progress-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  
  '& .progress-label': {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  
  '& .progress-bar': {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.grey[200],
    
    '& .MuiLinearProgress-bar': {
      borderRadius: 4,
      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    },
  },
}));

export const StyledStepperContainer = styled(Box)(({ theme }) => ({
  '& .MuiStepper-root': {
    padding: theme.spacing(2, 0),
  },
  
  '& .MuiStepLabel-root': {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  
  '& .step-disabled .MuiStepLabel-root': {
    cursor: 'not-allowed',
    opacity: 0.5,
    
    '&:hover': {
      transform: 'none',
    },
  },
  
  '& .MuiStepLabel-labelContainer': {
    textAlign: 'center',
    marginTop: theme.spacing(1),
  },
  
  '& .step-active': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  
  '& .step-completed': {
    color: theme.palette.success.main,
    fontWeight: 500,
  },
  
  '& .step-description': {
    display: 'block',
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5),
    maxWidth: 120,
    lineHeight: 1.2,
  },
  
  '& .MuiStepIcon-root': {
    fontSize: '1.8rem',
    
    '&.Mui-active': {
      color: theme.palette.primary.main,
    },
    
    '&.Mui-completed': {
      color: theme.palette.success.main,
    },
  },
}));