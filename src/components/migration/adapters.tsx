/**
 * Migration Adapters for V2 Component Integration
 *
 * These components provide backward compatibility while transitioning
 * existing V2 components to use the new design system patterns.
 */

import React from 'react';

import type {
  ButtonProps as DesignButtonProps,
  CardProps as DesignCardProps,
  InputProps as DesignInputProps,
} from '@/components/design-system';
import {
  Button as DesignButton,
  Card as DesignCard,
  Input as DesignInput,
} from '@/components/design-system';

// Legacy Material-UI prop mappings
type LegacyButtonColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'info'
  | 'warning';
type LegacyButtonVariant = 'text' | 'outlined' | 'contained';
type LegacyTextFieldVariant = 'standard' | 'filled' | 'outlined';

// Legacy Button Props
interface LegacyButtonProps extends Omit<DesignButtonProps, 'variant'> {
  color?: LegacyButtonColor;
  variant?: LegacyButtonVariant;
}

// Legacy Input Props
interface LegacyTextFieldProps
  extends Omit<DesignInputProps, 'variant' | 'state'> {
  variant?: LegacyTextFieldVariant;
  error?: boolean;
}

// Legacy Card Props
interface LegacyPaperProps extends Omit<DesignCardProps, 'variant'> {
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  raised?: boolean;
}

/**
 * Legacy Button Adapter
 * Maps old Material-UI Button props to new design system Button
 */
export const Button: React.FC<LegacyButtonProps> = ({
  color = 'primary',
  variant = 'contained',
  ...props
}) => {
  // Map legacy props to design system variants
  const getDesignVariant = (
    color: LegacyButtonColor,
    variant: LegacyButtonVariant
  ): DesignButtonProps['variant'] => {
    if (variant === 'text') return 'ghost';
    if (variant === 'outlined') return 'outline';

    // Contained variants
    switch (color) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'info':
        return 'primary'; // Map info to primary
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const designVariant = getDesignVariant(color, variant);

  return <DesignButton variant={designVariant} {...props} />;
};

/**
 * Legacy TextField Adapter
 * Maps old Material-UI TextField props to new design system Input
 */
export const TextField: React.FC<LegacyTextFieldProps> = ({
  variant = 'outlined',
  error = false,
  ...props
}) => {
  // Map legacy props to design system props
  const designVariant: DesignInputProps['variant'] =
    variant === 'standard'
      ? 'standard'
      : variant === 'filled'
        ? 'filled'
        : 'outlined';

  const designState: DesignInputProps['state'] = error ? 'error' : 'default';

  return <DesignInput variant={designVariant} state={designState} {...props} />;
};

/**
 * Legacy Paper Adapter
 * Maps old Material-UI Paper props to new design system Card
 */
export const Paper: React.FC<LegacyPaperProps> = ({
  elevation = 1,
  variant = 'elevation',
  raised = false,
  ...props
}) => {
  // Map legacy props to design system variants
  const getDesignVariant = (
    elevation: number,
    variant: string,
    raised: boolean
  ): DesignCardProps['variant'] => {
    if (variant === 'outlined') return 'outlined';
    if (raised || elevation > 2) return 'elevated';
    return 'default';
  };

  const designVariant = getDesignVariant(elevation, variant, raised);

  return <DesignCard variant={designVariant} {...props} />;
};

/**
 * Legacy Card Adapter
 * Maps old Material-UI Card props to new design system Card
 */
export const Card: React.FC<LegacyPaperProps> = props => {
  return <Paper {...props} />;
};

/**
 * Utility function to get design system component mappings
 * Helps developers understand the migration path
 */
export const getMigrationMapping = () => {
  return {
    Button: {
      'color="primary" variant="contained"': 'variant="primary"',
      'color="secondary" variant="contained"': 'variant="secondary"',
      'color="error" variant="contained"': 'variant="danger"',
      'color="success" variant="contained"': 'variant="success"',
      'variant="outlined"': 'variant="outline"',
      'variant="text"': 'variant="ghost"',
    },
    TextField: {
      'variant="outlined"': 'variant="outlined"',
      'variant="filled"': 'variant="filled"',
      'variant="standard"': 'variant="standard"',
      'error={true}': 'state="error"',
      'helperText="Error message"': 'helperText="Error message" state="error"',
    },
    Paper: {
      'elevation={1}': 'variant="default"',
      'elevation={3}': 'variant="elevated"',
      'variant="outlined"': 'variant="outlined"',
      'raised={true}': 'variant="elevated"',
    },
  };
};

// Export type definitions for TypeScript support
export type { LegacyButtonProps, LegacyPaperProps, LegacyTextFieldProps };
