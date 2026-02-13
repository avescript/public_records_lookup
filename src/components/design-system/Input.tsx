/**
 * Input Component - Design System Foundation
 * Accessible, themeable input component with validation states and variants
 */

'use client';

import React, { forwardRef, useState } from 'react';
import { InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  borderRadius,
  colors,
  spacing,
  transitions,
  typography,
} from '@/theme/design-system/tokens';

// Extended Input Props
export interface InputProps extends Omit<TextFieldProps, 'variant' | 'size'> {
  /** Input visual variant */
  variant?: 'outlined' | 'filled' | 'standard';
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Input state */
  state?: 'default' | 'error' | 'warning' | 'success';
  /** Icon to display at the start */
  startIcon?: React.ReactNode;
  /** Icon to display at the end */
  endIcon?: React.ReactNode;
  /** Helper text below input */
  helperText?: string;
  /** Show character count */
  showCharCount?: boolean;
  /** Maximum character count */
  maxLength?: number;
}

// Styled Input Component
const StyledTextField = styled(TextField, {
  shouldForwardProp: prop =>
    !['state', 'startIcon', 'endIcon'].includes(prop as string),
})<InputProps>(({ theme, size = 'md', state = 'default', disabled }) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      height: '2rem',
      fontSize: typography.fontSize.sm.size,
      padding: `${spacing[2]} ${spacing[3]}`,
    },
    md: {
      height: '2.5rem',
      fontSize: typography.fontSize.base.size,
      padding: `${spacing[3]} ${spacing[4]}`,
    },
    lg: {
      height: '3rem',
      fontSize: typography.fontSize.lg.size,
      padding: `${spacing[4]} ${spacing[5]}`,
    },
  };

  // State configurations
  const stateConfig = {
    default: {
      borderColor: colors.neutral[300],
      '&:hover': {
        borderColor: colors.neutral[400],
      },
      '&:focus-within': {
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px ${colors.primary[200]}`,
      },
    },
    error: {
      borderColor: colors.error[500],
      '&:hover': {
        borderColor: colors.error[600],
      },
      '&:focus-within': {
        borderColor: colors.error[500],
        boxShadow: `0 0 0 3px ${colors.error[200]}`,
      },
    },
    warning: {
      borderColor: colors.warning[500],
      '&:hover': {
        borderColor: colors.warning[600],
      },
      '&:focus-within': {
        borderColor: colors.warning[500],
        boxShadow: `0 0 0 3px ${colors.warning[200]}`,
      },
    },
    success: {
      borderColor: colors.success[500],
      '&:hover': {
        borderColor: colors.success[600],
      },
      '&:focus-within': {
        borderColor: colors.success[500],
        boxShadow: `0 0 0 3px ${colors.success[200]}`,
      },
    },
  };

  const currentSize = sizeConfig[size];
  const currentState = stateConfig[state];

  return {
    '& .MuiOutlinedInput-root': {
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      fontFamily: typography.fontFamily.primary,
      borderRadius: borderRadius.md,
      backgroundColor: colors.neutral[0],
      transition: `all ${transitions.duration.normal} ${transitions.easing.ease}`,

      // Field set (border)
      '& fieldset': {
        borderColor: currentState.borderColor,
        borderWidth: '1px',
        transition: `all ${transitions.duration.normal} ${transitions.easing.ease}`,
      },

      // Hover state
      '&:hover': {
        '& fieldset': {
          borderColor:
            currentState['&:hover']?.borderColor || currentState.borderColor,
        },
      },

      // Focus state
      '&.Mui-focused': {
        '& fieldset': {
          borderColor:
            currentState['&:focus-within']?.borderColor || colors.primary[500],
          borderWidth: '2px',
        },
        boxShadow:
          currentState['&:focus-within']?.boxShadow ||
          `0 0 0 3px ${colors.primary[200]}`,
      },

      // Error state
      '&.Mui-error': {
        '& fieldset': {
          borderColor: colors.error[500],
        },
        '&:focus-within': {
          boxShadow: `0 0 0 3px ${colors.error[200]}`,
        },
      },

      // Disabled state
      '&.Mui-disabled': {
        backgroundColor: colors.neutral[100],
        cursor: 'not-allowed',
        '& fieldset': {
          borderColor: colors.neutral[300],
        },
        '& input': {
          cursor: 'not-allowed',
          color: colors.neutral[500],
        },
      },

      // Input element
      '& input': {
        padding: currentSize.padding,
        color: colors.neutral[800],
        '&::placeholder': {
          color: colors.neutral[500],
          opacity: 1,
        },
      },

      // Multiline textarea
      '& textarea': {
        padding: currentSize.padding,
        color: colors.neutral[800],
        '&::placeholder': {
          color: colors.neutral[500],
          opacity: 1,
        },
      },
    },

    // Label styles
    '& .MuiInputLabel-root': {
      color: colors.neutral[600],
      fontSize: currentSize.fontSize,
      fontFamily: typography.fontFamily.primary,
      fontWeight: typography.fontWeight.medium,

      // Focused label
      '&.Mui-focused': {
        color:
          currentState['&:focus-within']?.borderColor || colors.primary[500],
      },

      // Error label
      '&.Mui-error': {
        color: colors.error[500],
      },

      // Shrunk label (when input has value)
      '&.MuiInputLabel-shrink': {
        fontSize: typography.fontSize.sm.size,
        fontWeight: typography.fontWeight.medium,
      },
    },

    // Helper text styles
    '& .MuiFormHelperText-root': {
      fontSize: typography.fontSize.sm.size,
      fontFamily: typography.fontFamily.primary,
      marginTop: spacing[1],
      marginLeft: 0,

      '&.Mui-error': {
        color: colors.error[500],
      },
    },
  };
});

// Character count component
const CharCount = styled('span')<{ isOver?: boolean }>(({ isOver }) => ({
  fontSize: typography.fontSize.sm.size,
  color: isOver ? colors.error[500] : colors.neutral[500],
  fontFamily: typography.fontFamily.primary,
  alignSelf: 'flex-end',
}));

// Icon wrapper for consistent sizing
const IconWrapper = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  color: colors.neutral[500],
  '& svg': {
    width: '1.25rem',
    height: '1.25rem',
  },
});

/**
 * Input Component
 *
 * Accessible input component with multiple variants, states, and validation.
 * Built on Material-UI TextField with design system tokens.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 *
 * <Input
 *   label="Search"
 *   startIcon={<SearchIcon />}
 *   state="success"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      state = 'default',
      startIcon,
      endIcon,
      helperText,
      showCharCount = false,
      maxLength,
      multiline = false,
      value,
      defaultValue,
      onChange,
      error,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const currentValue = value !== undefined ? value : internalValue;
    const charCount = String(currentValue).length;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    // Determine actual state based on error prop and state
    const actualState = error ? 'error' : state;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      // Prevent exceeding maxLength if specified
      if (maxLength && newValue.length > maxLength) {
        return;
      }

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onChange?.(event);
    };

    // Build helper text with character count
    let finalHelperText = helperText;
    if (showCharCount && maxLength) {
      const countText = `${charCount}/${maxLength}`;
      finalHelperText = helperText ? `${helperText} (${countText})` : countText;
    } else if (showCharCount) {
      const countText = `${charCount} characters`;
      finalHelperText = helperText ? `${helperText} (${countText})` : countText;
    }

    return (
      <StyledTextField
        size={size}
        state={actualState}
        {...(value !== undefined
          ? { value: currentValue }
          : { defaultValue: defaultValue })}
        onChange={handleChange}
        error={actualState === 'error'}
        helperText={finalHelperText}
        multiline={multiline}
        inputProps={{
          maxLength: maxLength,
          'aria-invalid': actualState === 'error',
          'aria-describedby': helperText
            ? `${props.id || 'input'}-helper`
            : undefined,
        }}
        InputProps={{
          startAdornment: startIcon && (
            <InputAdornment position='start'>
              <IconWrapper>{startIcon}</IconWrapper>
            </InputAdornment>
          ),
          endAdornment: endIcon && (
            <InputAdornment position='end'>
              <IconWrapper>{endIcon}</IconWrapper>
            </InputAdornment>
          ),
        }}
        inputRef={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
