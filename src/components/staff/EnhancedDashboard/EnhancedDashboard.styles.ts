import { Box, Card, styled } from '@mui/material';

export const StyledDashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '1400px',
  margin: '0 auto',
  
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));

export const StyledDashboardHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  
  '& .header-content': {
    marginBottom: theme.spacing(3),
  },
  
  '& .page-title': {
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
    
    [theme.breakpoints.down('md')]: {
      fontSize: '1.75rem',
    },
  },
  
  '& .page-subtitle': {
    color: theme.palette.text.secondary,
    fontSize: '1.1rem',
  },
}));

export const StyledControlsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  
  '& .search-section': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flex: 1,
    maxWidth: '400px',
  },
  
  '& .search-field': {
    flex: 1,
    
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.background.paper,
    },
    
    '& .search-icon': {
      color: theme.palette.text.secondary,
      marginRight: theme.spacing(1),
    },
  },
  
  '& .filter-button': {
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  
  '& .view-toggle': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
  },
  
  '& .toggle-button': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2),
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0 !important',
    border: 'none !important',
    
    '&:not(:last-child)': {
      borderRight: `1px solid ${theme.palette.divider} !important`,
    },
    
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
  },
}));

export const StyledMetricsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(4),
  
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(2),
  },
}));

export const StyledMetricCard = styled(Box)(({ theme }) => ({
  '& .metric-card': {
    textAlign: 'center',
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-2px)',
    },
  },
  
  '& .metric-value': {
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(0.5),
  },
  
  '& .metric-label': {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
}));

export const StyledRequestsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: theme.spacing(3),
  
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: theme.spacing(2),
  },
}));

export const StyledRequestCard = styled(Box)(({ theme }) => ({
  '& .request-card': {
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: `1px solid ${theme.palette.divider}`,
    
    '&:hover': {
      boxShadow: theme.shadows[6],
      transform: 'translateY(-4px)',
      borderColor: theme.palette.primary.main,
    },
  },
  
  '& .request-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
  },
  
  '& .request-id': {
    fontWeight: 600,
    color: theme.palette.text.primary,
    fontSize: '1.1rem',
  },
  
  '& .request-badges': {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  
  '& .status-chip': {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  
  '& .priority-chip': {
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  
  '& .request-description': {
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.4,
  },
  
  '& .request-meta': {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    paddingTop: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  
  '& .request-department': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  
  '& .request-date': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  
  '& .request-actions': {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 'auto',
  },
}));