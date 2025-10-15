import { Card, styled } from '@mui/material';

import { tokens } from '@/theme/tokens';

export const StyledRequestCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  borderRadius: tokens.radii.lg,
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

export const StyledMetricCard = styled(Card)(({ theme }) => ({
  padding: tokens.spacing.md,
  textAlign: 'center',
  borderRadius: tokens.radii.lg,
  border: `1px solid ${theme.palette.divider}`,
  
  '& .metric-value': {
    fontSize: tokens.typography.fontSizes['3xl'],
    fontWeight: tokens.typography.fontWeights.bold,
    lineHeight: tokens.typography.lineHeights.tight,
  },
  
  '& .metric-label': {
    fontSize: tokens.typography.fontSizes.sm,
    color: theme.palette.text.secondary,
    marginTop: tokens.spacing.xs,
  },
}));

export const StyledSearchContainer = styled('div')(({ theme }) => ({
  padding: tokens.spacing.lg,
  marginBottom: tokens.spacing.lg,
  borderRadius: tokens.radii.lg,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

export const StyledDashboardHeader = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: tokens.spacing.xl,
  
  '& .header-content': {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  
  '& .header-title': {
    fontSize: tokens.typography.fontSizes['2xl'],
    fontWeight: tokens.typography.fontWeights.bold,
    margin: 0,
  },
  
  '& .header-subtitle': {
    fontSize: tokens.typography.fontSizes.md,
    marginTop: tokens.spacing.xs,
    margin: 0,
  },
}));