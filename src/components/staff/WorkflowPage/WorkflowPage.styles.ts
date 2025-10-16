import { Box, Paper, styled } from '@mui/material';

export const StyledPageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 3, 3, 3),
  maxWidth: '1400px',
  margin: '0 auto',
  
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0, 2, 2, 2),
  },
}));

export const StyledContentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  background: theme.palette.background.paper,
  
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3),
  },
  
  '& .step-content': {
    marginTop: theme.spacing(3),
  },
}));

export const StyledStepHeader = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(3),
  marginBottom: theme.spacing(3),
  
  '& .step-title': {
    color: theme.palette.text.primary,
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    
    [theme.breakpoints.down('md')]: {
      fontSize: '1.75rem',
    },
  },
  
  '& .step-subtitle': {
    color: theme.palette.text.secondary,
    fontSize: '1.1rem',
    lineHeight: 1.5,
    maxWidth: '600px',
  },
}));