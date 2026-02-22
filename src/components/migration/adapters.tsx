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
  CheckboxProps as DesignCheckboxProps,
  InputProps as DesignInputProps,
  RadioGroupProps as DesignRadioGroupProps,
  RadioProps as DesignRadioProps,
  SelectOption,
  SelectProps as DesignSelectProps,
} from '@/components/design-system';
import {
  Button as DesignButton,
  Card as DesignCard,
  Checkbox as DesignCheckbox,
  Input as DesignInput,
  Radio as DesignRadio,
  RadioGroup as DesignRadioGroup,
  Select as DesignSelect,
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

// Legacy Select Props - Material-UI Select compatibility
interface LegacySelectProps
  extends Omit<DesignSelectProps, 'options' | 'onChange'> {
  children?: React.ReactNode; // For MenuItem children
  variant?: 'standard' | 'filled' | 'outlined';
  displayEmpty?: boolean;
  renderValue?: (selected: unknown) => React.ReactNode;
  MenuProps?: any;
  SelectProps?: any;
  sx?: any; // Material-UI sx prop
  size?: 'small' | 'medium';
  // Support both new options format and legacy children
  options?: SelectOption[];
  // Material-UI style onChange with event.target.value
  onChange?: (event: { target: { value: unknown } }) => void;
}

// Legacy Button Props - Material-UI Button compatibility
interface LegacyButtonProps
  extends Omit<DesignButtonProps, 'variant' | 'size'> {
  color?: LegacyButtonColor;
  variant?: LegacyButtonVariant;
  size?: 'small' | 'medium' | 'large'; // Material-UI size format
  sx?: any; // Material-UI sx prop
  startIcon?: React.ReactNode; // Material-UI startIcon
  endIcon?: React.ReactNode; // Material-UI endIcon
  component?: any; // Material-UI component prop (for links, etc.)
  href?: string; // For link buttons
  target?: string; // For link buttons
  rel?: string; // For link buttons
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

// Legacy Checkbox Props - Material-UI Checkbox compatibility
interface LegacyCheckboxProps extends Omit<DesignCheckboxProps, 'variant'> {
  color?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium' | 'large';
  indeterminate?: boolean;
  checkedIcon?: React.ReactNode;
  icon?: React.ReactNode;
  inputProps?: Record<string, unknown>;
}

// Legacy Radio Props - Material-UI Radio/RadioGroup compatibility
interface LegacyRadioProps extends Omit<DesignRadioProps, 'variant'> {
  color?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium';
  checkedIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

interface LegacyRadioGroupProps extends Omit<DesignRadioGroupProps, 'options'> {
  children?: React.ReactNode; // For FormControlLabel children
  row?: boolean;
}

// Legacy FormControl Props - Material-UI FormControl compatibility
interface LegacyFormControlProps {
  children?: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  fullWidth?: boolean;
  margin?: 'none' | 'normal' | 'dense';
  size?: 'small' | 'medium';
  className?: string;
  sx?: any; // Material-UI sx prop
  style?: React.CSSProperties;
  id?: string;
  'data-testid'?: string;
}

/**
 * Legacy Button Adapter
 * Maps old Material-UI Button props to new design system Button
 */
export const Button: React.FC<LegacyButtonProps> = ({
  color = 'primary',
  variant = 'contained',
  size = 'medium',
  sx,
  startIcon,
  endIcon,
  component,
  href,
  target,
  rel,
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

  // Map Material-UI size format to design system format
  const getDesignSize = (
    size: 'small' | 'medium' | 'large'
  ): 'sm' | 'md' | 'lg' => {
    switch (size) {
      case 'small':
        return 'sm';
      case 'medium':
        return 'md';
      case 'large':
        return 'lg';
      default:
        return 'md';
    }
  };

  const designVariant = getDesignVariant(color, variant);
  const designSize = getDesignSize(size);

  // For backward compatibility, fall back to Material-UI Button for complex props
  if (sx || component || href || target || rel) {
    const MuiButton = require('@mui/material/Button').Button;
    return (
      <MuiButton
        color={color}
        variant={variant}
        size={size}
        sx={sx}
        startIcon={startIcon}
        endIcon={endIcon}
        component={component}
        href={href}
        target={target}
        rel={rel}
        {...props}
      />
    );
  }

  // Use design system button for simple cases
  return (
    <DesignButton
      variant={designVariant}
      size={designSize}
      leftIcon={startIcon}
      rightIcon={endIcon}
      {...props}
    />
  );
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
 * Legacy Select Adapter
 * Maps old Material-UI Select props to new design system Select
 */
export const Select: React.FC<LegacySelectProps> = ({
  children,
  variant = 'outlined',
  displayEmpty = false,
  options,
  placeholder,
  onChange,
  sx,
  size,
  MenuProps,
  SelectProps,
  ...props
}) => {
  // Extract options from children if not provided via options prop
  const extractedOptions: SelectOption[] = React.useMemo(() => {
    if (options && options.length > 0) {
      return options;
    }

    if (!children) return [];

    const childrenArray = React.Children.toArray(children);
    return childrenArray
      .filter(
        (child): child is React.ReactElement =>
          (React.isValidElement(child) &&
            (child.type as any)?.displayName === 'MenuItem') ||
          (child.type as any)?.name === 'MenuItem' ||
          typeof child.type === 'string' // Handle native options
      )
      .map((child, index) => {
        const element = child as React.ReactElement<any>;
        return {
          value: element.props?.value ?? `option-${index}`,
          label:
            typeof element.props?.children === 'string'
              ? element.props.children
              : (element.props?.value ?? `Option ${index + 1}`),
          disabled: element.props?.disabled || false,
        };
      });
  }, [children, options]);

  // Set placeholder if displayEmpty is true and no placeholder provided
  const effectivePlaceholder =
    displayEmpty && !placeholder ? 'Select an option...' : placeholder;

  // Convert design system onChange to Material-UI style onChange
  const handleChange = (value: string | number) => {
    if (onChange) {
      onChange({ target: { value } });
    }
  };

  // For backward compatibility with complex Material-UI props, use Material-UI Select
  if (sx || MenuProps || SelectProps || variant !== 'outlined') {
    const MuiSelect = require('@mui/material/Select').Select;
    const MuiFormControl = require('@mui/material/FormControl').FormControl;
    const MuiInputLabel = require('@mui/material/InputLabel').InputLabel;

    return (
      <MuiFormControl variant={variant} size={size} sx={sx}>
        {placeholder && <MuiInputLabel>{placeholder}</MuiInputLabel>}
        <MuiSelect
          displayEmpty={displayEmpty}
          MenuProps={MenuProps}
          {...SelectProps}
          onChange={onChange}
          {...props}
        >
          {children}
        </MuiSelect>
      </MuiFormControl>
    );
  }

  // Use design system Select for simple cases
  return (
    <DesignSelect
      options={extractedOptions}
      placeholder={effectivePlaceholder}
      onChange={handleChange}
      {...props}
    />
  );
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
 * Legacy Checkbox Adapter
 * Maps old Material-UI Checkbox props to new design system Checkbox
 */
export const Checkbox: React.FC<LegacyCheckboxProps> = ({
  color = 'primary',
  size = 'medium',
  indeterminate,
  checkedIcon,
  icon,
  inputProps,
  ...props
}) => {
  // Map legacy color to design variant
  const designVariant: DesignCheckboxProps['variant'] =
    color === 'secondary' ? 'secondary' : 'primary';

  // Note: indeterminate, checkedIcon, icon, and inputProps are Material-UI specific
  // and not directly supported in our design system, but we pass them through
  const additionalProps: Record<string, unknown> = {};
  if (indeterminate !== undefined)
    additionalProps.indeterminate = indeterminate;
  if (checkedIcon) additionalProps.checkedIcon = checkedIcon;
  if (icon) additionalProps.icon = icon;
  if (inputProps) additionalProps.inputProps = inputProps;

  return (
    <DesignCheckbox
      variant={designVariant}
      size={size}
      {...additionalProps}
      {...props}
    />
  );
};

/**
 * Legacy Radio Adapter
 * Maps old Material-UI Radio props to new design system Radio
 */
export const Radio: React.FC<LegacyRadioProps> = ({
  color = 'primary',
  size = 'medium',
  checkedIcon,
  icon,
  ...props
}) => {
  // Map legacy color to design variant
  const designVariant: DesignRadioProps['variant'] =
    color === 'secondary' ? 'secondary' : 'primary';

  // Note: checkedIcon and icon are Material-UI specific
  const additionalProps: Record<string, unknown> = {};
  if (checkedIcon) additionalProps.checkedIcon = checkedIcon;
  if (icon) additionalProps.icon = icon;

  return (
    <DesignRadio
      variant={designVariant}
      size={size}
      {...additionalProps}
      {...props}
    />
  );
};

/**
 * Legacy RadioGroup Adapter
 * Maps old Material-UI RadioGroup props to new design system RadioGroup
 */
export const RadioGroup: React.FC<LegacyRadioGroupProps> = ({
  children,
  row = false,
  ...props
}) => {
  // Convert children FormControlLabel elements to options array if needed
  if (children && !props.options) {
    // For backward compatibility, we'll pass children through to Material-UI
    // In a full migration, children would be converted to options array
    const additionalProps = { children, row };

    // Use Material-UI RadioGroup directly for complex children scenarios
    return (
      <div style={{ display: 'flex', flexDirection: row ? 'row' : 'column' }}>
        {children}
      </div>
    );
  }

  // Use design system RadioGroup when options are provided
  return <DesignRadioGroup direction={row ? 'row' : 'column'} {...props} />;
};

/**
 * Legacy FormControl Adapter
 * Material-UI FormControl compatibility wrapper
 */
export const FormControl: React.FC<LegacyFormControlProps> = ({
  children,
  error = false,
  disabled = false,
  required = false,
  variant = 'outlined',
  fullWidth = false,
  margin = 'none',
  size = 'medium',
  className,
  sx,
  style,
  id,
  'data-testid': testId,
  ...props
}) => {
  // Import Material-UI FormControl directly for maximum compatibility
  const MuiFormControl = require('@mui/material/FormControl').FormControl;

  return (
    <MuiFormControl
      error={error}
      disabled={disabled}
      required={required}
      variant={variant}
      fullWidth={fullWidth}
      margin={margin}
      size={size}
      className={className}
      sx={sx}
      style={style}
      id={id}
      data-testid={testId}
      {...props}
    >
      {children}
    </MuiFormControl>
  );
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
    Select: {
      'variant="outlined"': 'variant="outlined" (default)',
      'displayEmpty={true}': 'placeholder="Select an option..."',
      'MenuProps={{...}}': 'maxMenuHeight={number}',
      'renderValue={func}': 'renderValue={func}',
      '<MenuItem value="x">Label</MenuItem>':
        'options={[{value: "x", label: "Label"}]}',
    },
    Paper: {
      'elevation={1}': 'variant="default"',
      'elevation={3}': 'variant="elevated"',
      'variant="outlined"': 'variant="outlined"',
      'raised={true}': 'variant="elevated"',
    },
    Checkbox: {
      'color="primary"': 'variant="primary" (default)',
      'color="secondary"': 'variant="secondary"',
      'size="small"': 'size="small"',
      'size="medium"': 'size="medium" (default)',
      'indeterminate={true}': 'Note: passed through to Material-UI base',
    },
    Radio: {
      'color="primary"': 'variant="primary" (default)',
      'color="secondary"': 'variant="secondary"',
      'size="small"': 'size="small"',
      'size="medium"': 'size="medium" (default)',
    },
    RadioGroup: {
      'row={true}': 'direction="row"',
      'row={false}': 'direction="column" (default)',
      '<FormControlLabel />': 'options=[{value, label}] array',
    },
    FormControl: {
      Note: 'Passes through to Material-UI for backward compatibility',
      'variant="outlined"': 'Maintained for compatibility',
      'fullWidth={true}': 'Maintained for compatibility',
    },
  };
};

// Export type definitions for TypeScript support
export type {
  LegacyButtonProps,
  LegacyCheckboxProps,
  LegacyFormControlProps,
  LegacyPaperProps,
  LegacyRadioGroupProps,
  LegacyRadioProps,
  LegacySelectProps,
  LegacyTextFieldProps,
};
