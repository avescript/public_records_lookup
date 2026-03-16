/**
 * Design System Radio Component
 *
 * A comprehensive radio component built with Material-UI base
 * that provides consistent theming, validation, and accessibility.
 */

import React from 'react';
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio as MuiRadio,
  RadioGroup as MuiRadioGroup,
  type RadioGroupProps as MuiRadioGroupProps,
  type RadioProps as MuiRadioProps,
} from '@mui/material';

import {
  borderRadius,
  colors,
  spacing,
  typography,
} from '../../theme/design-system/tokens';

const { colors: colorTokens, typography: typographyTokens, spacing: spacingTokens, borderRadius: borderRadiusTokens } = {
  colors,
  typography,
  spacing,
  borderRadius,
};

// Single radio option
export interface RadioOption {
  /** Value of the radio option */
  value: string;
  /** Display label for the radio option */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Helper text for this specific option */
  helperText?: string;
}

// Design system radio props (single radio)
export interface RadioProps extends Omit<MuiRadioProps, 'color' | 'size'> {
  /** Text label for the radio */
  label?: string;
  /** Visual variant of the radio */
  variant?: 'primary' | 'secondary';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS class name */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
}

// Design system radio group props
export interface RadioGroupProps extends Omit<MuiRadioGroupProps, 'children'> {
  /** Array of radio options */
  options: RadioOption[];
  /** Group label */
  label?: string;
  /** Helper text displayed below the radio group */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether selection is required */
  required?: boolean;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Additional CSS class name */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Single Radio component for individual radio buttons
 */
export const Radio: React.FC<RadioProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className,
  'data-testid': testId,
  ...props
}) => {
  // Color mapping for variants
  const getRadioColor = (variant: 'primary' | 'secondary') => {
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
  const getRadioSize = (size: 'small' | 'medium' | 'large') => {
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

  const radioElement = (
    <MuiRadio
      {...props}
      color={getRadioColor(variant)}
      size={getRadioSize(size)}
      disabled={disabled}
      data-testid={testId}
      sx={{
        color: disabled ? colorTokens.neutral[400] : colorTokens.neutral[700],
        '&.Mui-checked': {
          color: variant === 'primary' ? colorTokens.primary[600] : colorTokens.secondary[600],
        },
        '&.Mui-disabled': {
          color: colorTokens.neutral[300],
        },
        padding: spacingTokens[1],
        borderRadius: borderRadiusTokens.sm,
        '&:hover': {
          backgroundColor: disabled 
            ? 'transparent'
            : `${colorTokens.primary[600]}08`,
        },
        ...props.sx,
      }}
    />
  );

  // If no label, return just the radio
  if (!label) {
    return radioElement;
  }

  // Return radio with label
  return (
    <FormControlLabel
      control={radioElement}
      label={
        <span
          style={{
            fontSize: typographyTokens.fontSize.base.size,
            fontFamily: typographyTokens.fontFamily.primary,
            color: disabled ? colorTokens.neutral[400] : colorTokens.neutral[900],
            fontWeight: typographyTokens.fontWeight.medium,
          }}
        >
          {label}
        </span>
      }
      disabled={disabled}
      className={className}
      sx={{
        margin: 0,
        alignItems: 'flex-start',
        '& .MuiFormControlLabel-label': {
          paddingTop: spacingTokens[0.5],
        },
      }}
    />
  );
};

/**
 * RadioGroup component for multiple radio options with consistent design system theming
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  label,
  helperText,
  error = false,
  errorMessage,
  variant = 'primary',
  size = 'medium',
  required = false,
  direction = 'column',
  className,
  'data-testid': testId,
  ...props
}) => {
  const displayHelperText = error && errorMessage ? errorMessage : helperText;

  return (
    <FormControl error={error} className={className} data-testid={testId}>
      {label && (
        <FormLabel
          sx={{
            fontSize: typographyTokens.fontSize.base.size,
            fontFamily: typographyTokens.fontFamily.primary,
            fontWeight: typographyTokens.fontWeight.semibold,
            color: error ? colorTokens.error[500] : colorTokens.neutral[900],
            marginBottom: spacingTokens[1],
            '&.Mui-focused': {
              color: error ? colorTokens.error[500] : colorTokens.primary[600],
            },
          }}
        >
          {label}
          {required && (
            <span style={{ color: colorTokens.error[500], marginLeft: spacingTokens[0.5] }}>
              *
            </span>
          )}
        </FormLabel>
      )}
      
      <MuiRadioGroup
        {...props}
        row={direction === 'row'}
        sx={{
          gap: direction === 'row' ? spacingTokens[3] : spacingTokens[1],
          ...props.sx,
        }}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            control={
              <Radio
                variant={variant}
                size={size}
                data-testid={`${testId ? `${testId}-` : ''}option-${option.value}`}
              />
            }
            label={
              <div>
                <span
                  style={{
                    fontSize: typographyTokens.fontSize.base.size,
                    fontFamily: typographyTokens.fontFamily.primary,
                    color: option.disabled ? colorTokens.neutral[400] : colorTokens.neutral[900],
                    fontWeight: typographyTokens.fontWeight.medium,
                  }}
                >
                  {option.label}
                </span>
                {option.helperText && (
                  <div
                    style={{
                      fontSize: typographyTokens.fontSize.sm.size,
                      color: colorTokens.neutral[600],
                      marginTop: spacingTokens[0.5],
                    }}
                  >
                    {option.helperText}
                  </div>
                )}
              </div>
            }
            sx={{
              margin: 0,
              alignItems: 'flex-start',
              '& .MuiFormControlLabel-label': {
                paddingTop: spacingTokens[0.5],
              },
            }}
          />
        ))}
      </MuiRadioGroup>
      
      {displayHelperText && (
        <FormHelperText
          sx={{
            marginTop: spacingTokens[1],
            fontSize: typographyTokens.fontSize.sm.size,
            color: error ? colorTokens.error[500] : colorTokens.neutral[600],
          }}
        >
          {displayHelperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default RadioGroup;