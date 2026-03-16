/**
 * Design System Checkbox Component
 *
 * A comprehensive checkbox component built with Material-UI base
 * that provides consistent theming, validation, and accessibility.
 */

import React from 'react';
import {
  Checkbox as MuiCheckbox,
  type CheckboxProps as MuiCheckboxProps,
  FormControl,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';

import {
  borderRadius,
  colors,
  spacing,
  typography,
} from '../../theme/design-system/tokens';

const {
  colors: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  borderRadius: borderRadiusTokens,
} = {
  colors,
  typography,
  spacing,
  borderRadius,
};

// Design system checkbox props
export interface CheckboxProps
  extends Omit<MuiCheckboxProps, 'color' | 'size'> {
  /** Text label for the checkbox */
  label?: string;
  /** Helper text displayed below the checkbox */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Visual variant of the checkbox */
  variant?: 'primary' | 'secondary';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether checkbox is required */
  required?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Checkbox component for binary selections with consistent design system theming
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  error = false,
  variant = 'primary',
  size = 'medium',
  required = false,
  className,
  disabled = false,
  'data-testid': testId,
  ...props
}) => {
  // Color mapping for variants
  const getCheckboxColor = (variant: 'primary' | 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  // Size mapping
  const getCheckboxSize = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
        return 'medium';
      case 'large':
        return 'medium'; // MUI doesn't have large, use medium
      default:
        return 'medium';
    }
  };

  const checkboxElement = (
    <MuiCheckbox
      {...props}
      color={getCheckboxColor(variant)}
      size={getCheckboxSize(size)}
      disabled={disabled}
      data-testid={testId}
      sx={{
        color: error
          ? colorTokens.error[500]
          : disabled
            ? colorTokens.neutral[400]
            : colorTokens.neutral[700],
        '&.Mui-checked': {
          color: error
            ? colorTokens.error[500]
            : variant === 'primary'
              ? colorTokens.primary[600]
              : colorTokens.secondary[600],
        },
        '&.Mui-disabled': {
          color: colorTokens.neutral[300],
        },
        padding: spacingTokens[1],
        borderRadius: borderRadiusTokens.sm,
        '&:hover': {
          backgroundColor: disabled
            ? 'transparent'
            : error
              ? `${colorTokens.error[500]}08`
              : `${colorTokens.primary[600]}08`,
        },
        ...props.sx,
      }}
    />
  );

  // If no label, return just the checkbox
  if (!label) {
    return (
      <>
        {checkboxElement}
        {helperText && (
          <FormHelperText
            error={error}
            sx={{
              marginLeft: spacingTokens[4],
              fontSize: typography.fontSize.sm.size,
              color: error ? colorTokens.error[500] : colorTokens.neutral[600],
            }}
          >
            {helperText}
          </FormHelperText>
        )}
      </>
    );
  }

  // Return checkbox with label
  return (
    <FormControl error={error} className={className}>
      <FormControlLabel
        control={checkboxElement}
        label={
          <span
            style={{
              fontSize: typographyTokens.fontSize.base.size,
              fontFamily: typographyTokens.fontFamily.primary,
              color: error
                ? colorTokens.error[500]
                : disabled
                  ? colorTokens.neutral[400]
                  : colorTokens.neutral[900],
              fontWeight: typographyTokens.fontWeight.medium,
            }}
          >
            {label}
            {required && (
              <span
                style={{
                  color: colorTokens.error[500],
                  marginLeft: spacingTokens[0.5],
                }}
              >
                *
              </span>
            )}
          </span>
        }
        disabled={disabled}
        sx={{
          margin: 0,
          alignItems: 'flex-start',
          '& .MuiFormControlLabel-label': {
            paddingTop: spacingTokens[0.5],
          },
        }}
      />
      {helperText && (
        <FormHelperText
          sx={{
            marginLeft: spacingTokens[4],
            marginTop: spacingTokens[0.5],
            fontSize: typographyTokens.fontSize.sm.size,
            color: error ? colorTokens.error[500] : colorTokens.neutral[600],
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default Checkbox;
