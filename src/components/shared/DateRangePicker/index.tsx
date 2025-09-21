'use client';

import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

export interface DateRange {
  startDate: string;
  endDate: string;
  preset?: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (dateRange: DateRange) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}

const DATE_PRESETS = [
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'last-90-days', label: 'Last 90 days' },
  { value: 'last-year', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

const calculateDateRange = (preset: string): Partial<DateRange> => {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  switch (preset) {
    case 'last-7-days':
      return {
        startDate: formatDate(
          new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        ),
        endDate: formatDate(today),
      };
    case 'last-30-days':
      return {
        startDate: formatDate(
          new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        ),
        endDate: formatDate(today),
      };
    case 'last-90-days':
      return {
        startDate: formatDate(
          new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        ),
        endDate: formatDate(today),
      };
    case 'last-year':
      return {
        startDate: formatDate(
          new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
        ),
        endDate: formatDate(today),
      };
    default:
      return {};
  }
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = { startDate: '', endDate: '', preset: '' },
  onChange,
  error = '',
  disabled = false,
  label = 'Date Range',
}) => {
  const [preset, setPreset] = useState(value.preset || '');
  const [customStartDate, setCustomStartDate] = useState(value.startDate || '');
  const [customEndDate, setCustomEndDate] = useState(value.endDate || '');

  const handlePresetChange = (event: SelectChangeEvent) => {
    const newPreset = event.target.value;
    setPreset(newPreset);

    if (newPreset === 'custom') {
      // Keep current custom dates or clear them
      onChange({
        startDate: customStartDate,
        endDate: customEndDate,
        preset: newPreset,
      });
    } else {
      // Calculate preset dates
      const calculatedRange = calculateDateRange(newPreset);
      const newDateRange = {
        startDate: calculatedRange.startDate || '',
        endDate: calculatedRange.endDate || '',
        preset: newPreset,
      };

      setCustomStartDate(newDateRange.startDate);
      setCustomEndDate(newDateRange.endDate);
      onChange(newDateRange);
    }
  };

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newStartDate = event.target.value;
    setCustomStartDate(newStartDate);
    onChange({
      startDate: newStartDate,
      endDate: customEndDate,
      preset: preset,
    });
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = event.target.value;
    setCustomEndDate(newEndDate);
    onChange({
      startDate: customStartDate,
      endDate: newEndDate,
      preset: preset,
    });
  };

  const showCustomFields = preset === 'custom';

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>

      <FormControl fullWidth error={!!error} sx={{ mb: 2 }}>
        <InputLabel>Time Period</InputLabel>
        <Select
          value={preset}
          label="Time Period"
          onChange={handlePresetChange}
          disabled={disabled}
          data-testid="date-range-preset"
        >
          {DATE_PRESETS.map(presetOption => (
            <MenuItem key={presetOption.value} value={presetOption.value}>
              {presetOption.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>

      {showCustomFields && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Start Date"
              type="date"
              value={customStartDate}
              onChange={handleStartDateChange}
              fullWidth
              disabled={disabled}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: customEndDate || undefined,
              }}
              data-testid="start-date-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="End Date"
              type="date"
              value={customEndDate}
              onChange={handleEndDateChange}
              fullWidth
              disabled={disabled}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: customStartDate || undefined,
                max: new Date().toISOString().split('T')[0], // Can't select future dates
              }}
              data-testid="end-date-input"
            />
          </Grid>
        </Grid>
      )}

      {!showCustomFields && (customStartDate || customEndDate) && (
        <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Selected range: {customStartDate} to {customEndDate}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DateRangePicker;
