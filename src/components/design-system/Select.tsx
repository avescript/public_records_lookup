import React from 'react';
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  SelectProps as MuiSelectProps,
} from '@mui/material';

import {
  borderRadius,
  colors,
  spacing,
  typography,
} from '../../theme/design-system/tokens';

// Types for select options
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps {
  /** Unique identifier for the select */
  id?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Label text displayed above the select */
  label?: string;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Error message to display */
  error?: string;
  /** Array of options to display */
  options: SelectOption[];
  /** Current value(s) - string/number for single select, array for multiple */
  value?: string | number | (string | number)[];
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Whether to allow multiple selections */
  multiple?: boolean;
  /** Size variant of the select */
  size?: 'small' | 'medium';
  /** Whether to take full width of container */
  fullWidth?: boolean;
  /** Whether to show search/filter functionality */
  searchable?: boolean;
  /** Maximum height for the dropdown menu */
  maxMenuHeight?: number;
  /** Custom render function for options */
  renderOption?: (option: SelectOption) => React.ReactNode;
  /** Custom render function for selected value(s) */
  renderValue?: (selected: unknown) => React.ReactNode;
  /** Callback when value changes */
  onChange?: (value: string | number | (string | number)[]) => void;
  /** Callback when select is opened */
  onOpen?: () => void;
  /** Callback when select is closed */
  onClose?: () => void;
  /** Additional props to pass to the underlying MUI Select */
  SelectProps?: Partial<MuiSelectProps>;
}

/**
 * Select component for choosing options from a dropdown list
 *
 * Features:
 * - Single and multiple selection modes
 * - Searchable options (when enabled)
 * - Custom option rendering
 * - Comprehensive accessibility support
 * - Consistent design system styling
 * - Error handling and validation states
 *
 * @example
 * ```tsx
 * // Basic single select
 * <Select
 *   label="Department"
 *   options={[
 *     { value: 'hr', label: 'Human Resources' },
 *     { value: 'it', label: 'Information Technology' },
 *   ]}
 *   value={selectedDepartment}
 *   onChange={setSelectedDepartment}
 * />
 *
 * // Multiple select with chips
 * <Select
 *   label="Skills"
 *   multiple
 *   options={skillOptions}
 *   value={selectedSkills}
 *   onChange={setSelectedSkills}
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  id,
  name,
  label,
  helperText,
  error,
  options = [],
  value,
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  multiple = false,
  size = 'medium',
  fullWidth = false,
  searchable = false,
  maxMenuHeight = 300,
  renderOption,
  renderValue,
  onChange,
  onOpen,
  onClose,
  SelectProps,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const reactId = React.useId();

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  // Handle value changes
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newValue = event.target.value;
    if (onChange) {
      onChange(newValue as string | number | (string | number)[]);
    }
  };

  // Handle select open
  const handleOpen = () => {
    setIsOpen(true);
    if (onOpen) onOpen();
  };

  // Handle select close
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    if (onClose) onClose();
  };

  // Default render function for multiple selection
  const defaultRenderValue = (selected: unknown) => {
    if (!multiple || !Array.isArray(selected) || selected.length === 0) {
      if (!selected) return placeholder;
      const option = options.find(opt => opt.value === selected);
      return option?.label || selected;
    }

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {(selected as (string | number)[]).map(value => {
          const option = options.find(opt => opt.value === value);
          return (
            <Chip
              key={value}
              label={option?.label || value}
              size='small'
              sx={{
                height: '24px',
                fontSize: typography.fontSize.sm,
                backgroundColor: colors.primary[100],
                color: colors.primary[800],
                '& .MuiChip-deleteIcon': {
                  color: colors.primary[600],
                  '&:hover': {
                    color: colors.primary[800],
                  },
                },
              }}
            />
          );
        })}
      </Box>
    );
  };

  // Generate unique ID if not provided
  const selectId = id || `select-${reactId.replace(/:/g, '')}`;
  const labelId = `${selectId}-label`;
  const helperTextId = `${selectId}-helper-text`;

  return (
    <FormControl
      fullWidth={fullWidth}
      error={!!error}
      disabled={disabled}
      size={size}
      required={required}
      {...props}
    >
      {label && (
        <InputLabel
          id={labelId}
          shrink
          sx={{
            fontFamily: typography.fontFamily.primary,
            fontSize:
              size === 'small'
                ? typography.fontSize.sm
                : typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
            color: error ? colors.error[600] : colors.neutral[700],
            '&.Mui-focused': {
              color: error ? colors.error[600] : colors.primary[600],
            },
          }}
        >
          {label}
          {required && (
            <span style={{ color: colors.error[500], marginLeft: '4px' }}>
              *
            </span>
          )}
        </InputLabel>
      )}

      <MuiSelect
        id={selectId}
        labelId={label ? labelId : undefined}
        label={label}
        name={name}
        value={value || (multiple ? [] : '')}
        onChange={handleChange}
        onOpen={handleOpen}
        onClose={handleClose}
        multiple={multiple}
        displayEmpty
        renderValue={
          renderValue ||
          (defaultRenderValue as (selected: unknown) => React.ReactNode)
        }
        disabled={disabled}
        open={isOpen}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: maxMenuHeight,
              borderRadius: borderRadius.md,
              marginTop: spacing[1],
              boxShadow: `0 4px 6px -1px ${colors.neutral[900]}1a, 0 2px 4px -1px ${colors.neutral[900]}0d`,
            },
          },
        }}
        sx={{
          fontFamily: typography.fontFamily.primary,
          fontSize:
            size === 'small'
              ? typography.fontSize.sm
              : typography.fontSize.base,
          borderRadius: borderRadius.md,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? colors.error[300] : colors.neutral[300],
            borderRadius: borderRadius.md,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? colors.error[400] : colors.neutral[400],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? colors.error[500] : colors.primary[500],
            borderWidth: '2px',
          },
          '&.Mui-disabled': {
            backgroundColor: colors.neutral[50],
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.neutral[200],
            },
          },
        }}
        {...SelectProps}
      >
        {/* Search input for searchable selects */}
        {searchable && isOpen && (
          <MenuItem
            disableRipple
            sx={{ borderBottom: `1px solid ${colors.neutral[200]}` }}
          >
            <input
              type='text'
              placeholder='Search options...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                padding: spacing[1],
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                fontSize: typography.fontSize.sm.size,
                fontFamily: typography.fontFamily.primary,
                outline: 'none',
              }}
            />
          </MenuItem>
        )}

        {/* Render filtered options */}
        {filteredOptions.length === 0 ? (
          <MenuItem disabled>
            <span style={{ fontStyle: 'italic', color: colors.neutral[500] }}>
              {searchable && searchTerm
                ? 'No matching options'
                : 'No options available'}
            </span>
          </MenuItem>
        ) : (
          filteredOptions.map(option => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              sx={{
                fontFamily: typography.fontFamily.primary,
                fontSize:
                  size === 'small'
                    ? typography.fontSize.sm
                    : typography.fontSize.base,
                minHeight: size === 'small' ? '36px' : '42px',
                '&:hover': {
                  backgroundColor: colors.neutral[50],
                },
                '&.Mui-selected': {
                  backgroundColor: colors.primary[50],
                  '&:hover': {
                    backgroundColor: colors.primary[100],
                  },
                },
              }}
            >
              {multiple && (
                <Checkbox
                  checked={Array.isArray(value) && value.includes(option.value)}
                  size='small'
                  sx={{
                    color: colors.primary[500],
                    '&.Mui-checked': {
                      color: colors.primary[600],
                    },
                  }}
                />
              )}

              {renderOption ? (
                renderOption(option)
              ) : (
                <ListItemText
                  primary={option.label}
                  secondary={option.description}
                  primaryTypographyProps={{
                    fontSize:
                      size === 'small'
                        ? typography.fontSize.sm
                        : typography.fontSize.base,
                    fontFamily: typography.fontFamily.primary,
                  }}
                  secondaryTypographyProps={{
                    fontSize: typography.fontSize.xs,
                    color: colors.neutral[600],
                  }}
                />
              )}
            </MenuItem>
          ))
        )}
      </MuiSelect>

      {/* Helper text or error message */}
      {(helperText || error) && (
        <FormHelperText
          id={helperTextId}
          sx={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.xs,
            color: error ? colors.error[600] : colors.neutral[600],
            marginTop: spacing[1],
          }}
        >
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default Select;
