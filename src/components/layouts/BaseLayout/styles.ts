import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const LayoutRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

export const LayoutContent = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  width: '100%',
  padding: theme.spacing(3),
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(4),
  },
}));
