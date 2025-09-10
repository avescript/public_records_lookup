import { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

export interface ButtonProps extends Omit<MuiButtonProps, 'size' | 'variant'> {
  /**
   * The size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * The variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'text' | 'outline';
  
  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;
}
