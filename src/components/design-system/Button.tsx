/**
 * Button Component - Design System Foundation
 * Accessible, themeable button component with consistent styling and variants
 */

'use client';

import React, { forwardRef } from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  borderRadius,
  colors,
  shadows,
  spacing,
  transitions,
  typography,
} from '@/theme/design-system/tokens';

// Extended Button Props
export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  /** Button visual variant */
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'ai';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
}

// Styled Button Component
const StyledButton = styled(MuiButton, {
  shouldForwardProp: prop =>
    !['variant', 'size', 'loading', 'leftIcon', 'rightIcon'].includes(
      prop as string
    ),
})<ButtonProps>(({
  theme,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      height: '2rem',
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm.size,
      iconSize: '1rem',
    },
    md: {
      height: '2.5rem',
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: typography.fontSize.base.size,
      iconSize: '1.25rem',
    },
    lg: {
      height: '3rem',
      padding: `${spacing[4]} ${spacing[6]}`,
      fontSize: typography.fontSize.lg.size,
      iconSize: '1.5rem',
    },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.neutral[0],
      border: `1px solid ${colors.primary[500]}`,
      '&:hover': {
        backgroundColor: colors.primary[600],
        borderColor: colors.primary[600],
        boxShadow: shadows.md,
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.primary[200]}`,
      },
      '&:active': {
        backgroundColor: colors.primary[700],
      },
    },
    secondary: {
      backgroundColor: colors.secondary[500],
      color: colors.neutral[0],
      border: `1px solid ${colors.secondary[500]}`,
      '&:hover': {
        backgroundColor: colors.secondary[600],
        borderColor: colors.secondary[600],
        boxShadow: shadows.md,
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.secondary[200]}`,
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary[600],
      border: `1px solid ${colors.primary[500]}`,
      '&:hover': {
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[600],
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.primary[200]}`,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.neutral[700],
      border: '1px solid transparent',
      '&:hover': {
        backgroundColor: colors.neutral[100],
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.neutral[300]}`,
      },
    },
    danger: {
      backgroundColor: colors.error[500],
      color: colors.neutral[0],
      border: `1px solid ${colors.error[500]}`,
      '&:hover': {
        backgroundColor: colors.error[600],
        borderColor: colors.error[600],
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.error[200]}`,
      },
    },
    success: {
      backgroundColor: colors.success[500],
      color: colors.neutral[0],
      border: `1px solid ${colors.success[500]}`,
      '&:hover': {
        backgroundColor: colors.success[600],
        borderColor: colors.success[600],
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.success[200]}`,
      },
    },
    ai: {
      backgroundColor: colors.ai[500],
      color: colors.neutral[0],
      border: `1px solid ${colors.ai[500]}`,
      '&:hover': {
        backgroundColor: colors.ai[600],
        borderColor: colors.ai[600],
        boxShadow: shadows.md,
      },
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.ai[200]}`,
      },
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return {
    // Base styles
    height: currentSize.height,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    textTransform: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    transition: `all ${transitions.duration.normal} ${transitions.easing.ease}`,
    boxShadow: shadows.sm,
    position: 'relative',

    // Variant styles
    ...currentVariant,

    // Disabled state
    '&:disabled, &.Mui-disabled': {
      backgroundColor: colors.neutral[200],
      color: colors.neutral[500],
      borderColor: colors.neutral[300],
      cursor: 'not-allowed',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: colors.neutral[200],
        borderColor: colors.neutral[300],
      },
    },

    // Loading state
    ...(loading && {
      cursor: 'not-allowed',
      '&:hover': currentVariant,
      '& .button-content': {
        opacity: 0.7,
      },
    }),

    // Focus visible for keyboard navigation
    '&:focus-visible': {
      outline: 'none',
      ...(currentVariant['&:focus'] || {}),
    },

    // Remove Material-UI default styles
    '&.MuiButton-root': {
      minWidth: 'auto',
      boxShadow: shadows.sm,
      '&:hover': {
        ...currentVariant['&:hover'],
      },
    },
  };
});

// Loading Spinner Component
const LoadingSpinner = styled('div')({
  width: '1rem',
  height: '1rem',
  border: '2px solid currentColor',
  borderTop: '2px solid transparent',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',

  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
});

// Icon wrapper for consistent sizing
const IconWrapper = styled('span')<{ size: 'sm' | 'md' | 'lg' }>(({ size }) => {
  const iconSizes = {
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
  };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: iconSizes[size],
    '& svg': {
      width: iconSizes[size],
      height: iconSizes[size],
    },
  };
});

/**
 * Button Component
 *
 * Accessible button component with multiple variants and states.
 * Built on Material-UI foundation with design system tokens.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * <Button variant="outline" leftIcon={<PlusIcon />} loading={isLoading}>
 *   Add Item
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <StyledButton
        ref={ref}
        variant={variant}
        size={size}
        loading={loading}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        {...props}
      >
        <span
          className='button-content'
          style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}
        >
          {loading && <LoadingSpinner />}
          {leftIcon && !loading && (
            <IconWrapper size={size}>{leftIcon}</IconWrapper>
          )}
          {children}
          {rightIcon && <IconWrapper size={size}>{rightIcon}</IconWrapper>}
        </span>
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
