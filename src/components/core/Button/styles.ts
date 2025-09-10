import { type Theme } from '@/theme/theme';
import { Button as MuiButton, styled } from '@mui/material';
import { tokens } from '@/theme/tokens';

export const StyledButton = styled(MuiButton)<{ $size?: 'sm' | 'md' | 'lg' }>(
  ({ theme, $size = 'md' }) => {
    const sizes = {
      sm: {
        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
        fontSize: tokens.typography.fontSizes.sm,
      },
      md: {
        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
        fontSize: tokens.typography.fontSizes.md,
      },
      lg: {
        padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
        fontSize: tokens.typography.fontSizes.lg,
      },
    };

    return {
      ...sizes[$size],
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-1px)',
      },
    };
  }
);
