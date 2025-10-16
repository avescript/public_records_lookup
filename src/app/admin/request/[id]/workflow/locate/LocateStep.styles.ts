import { Alert, Box, Card, styled } from '@mui/material';

export const StyledActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  '& .action-buttons': {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
}));

export const StyledSearchSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  flex: 1,
  
  '& .search-input': {
    position: 'relative',
    flex: 1,
    maxWidth: '400px',
    
    '& input': {
      width: '100%',
      padding: theme.spacing(1.5, 1.5, 1.5, 5),
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      fontSize: '1rem',
      backgroundColor: theme.palette.background.paper,
      transition: 'border-color 0.2s ease-in-out',
      
      '&:focus': {
        outline: 'none',
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
      },
      
      '&::placeholder': {
        color: theme.palette.text.secondary,
      },
    },
  },
  
  '& .search-icon': {
    position: 'absolute',
    left: theme.spacing(1.5),
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.palette.text.secondary,
    fontSize: '1.25rem',
    pointerEvents: 'none',
  },
}));

export const StyledSelectionSummary = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  
  '& .selection-alert': {
    borderRadius: theme.shape.borderRadius,
    
    '& .MuiAlert-message': {
      width: '100%',
    },
  },
}));

export const StyledResultsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const StyledRecordCard = styled(Box)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  
  '& .record-card': {
    height: '100%',
    border: `2px solid transparent`,
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-2px)',
    },
  },
  
  '&.selected .record-card': {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}08`,
    boxShadow: theme.shadows[3],
  },
}));

export const StyledRecordHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
  
  '& .record-info': {
    display: 'flex',
    gap: theme.spacing(1.5),
    flex: 1,
  },
  
  '& .record-icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.secondary,
    flexShrink: 0,
    
    '& svg': {
      fontSize: '1.25rem',
    },
  },
  
  '& .record-meta': {
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  
  '& .record-title': {
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.2,
  },
  
  '& .record-details': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  
  '& .record-actions': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexShrink: 0,
  },
  
  '& .relevance-chip': {
    fontSize: '0.75rem',
    fontWeight: 600,
    minWidth: 'auto',
  },
  
  '& .selection-checkbox': {
    margin: 0,
    
    '& .MuiCheckbox-root': {
      padding: theme.spacing(0.5),
    },
  },
}));

export const StyledRecordContent = styled(Box)(({ theme }) => ({
  '& .record-description': {
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2),
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  
  '& .record-tags': {
    marginTop: 'auto',
  },
  
  '& .tag-chip': {
    fontSize: '0.75rem',
    height: 24,
    
    '& .MuiChip-label': {
      padding: theme.spacing(0, 0.75),
    },
  },
}));