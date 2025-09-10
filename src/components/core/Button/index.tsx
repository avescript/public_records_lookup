import { CircularProgress } from '@mui/material';
import { type ButtonProps } from './types';
import { StyledButton } from './styles';

export const Button = ({
  children,
  size = 'md',
  variant = 'primary',
  loading = false,
  disabled,
  ...props
}: ButtonProps) => {
  const getMuiVariant = (variant: ButtonProps['variant']) => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getMuiColor = (variant: ButtonProps['variant']) => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  return (
    <StyledButton
      $size={size}
      variant={getMuiVariant(variant)}
      color={getMuiColor(variant)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <CircularProgress
          size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
          color="inherit"
        />
      ) : (
        children
      )}
    </StyledButton>
  );
};

export type { ButtonProps } from './types';
