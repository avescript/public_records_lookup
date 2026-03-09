'use client';

import React from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@/components/migration';
import type { StoredRequest } from '@/services/requestService';

interface RequestFiltersProps {
  filters: {
    statuses: string[];
    departments: string[];
    dateRange: { start: Date | null; end: Date | null };
    priority: string[];
    assignedTo: string[];
  };
  requests: StoredRequest[];
  onChange: (filters: RequestFiltersProps['filters']) => void;
}

/**
 * Request Filters Component
 * Advanced filtering options for request dashboard
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-010 Enhanced Request Dashboard - Advanced Filtering
 */
export function RequestFilters({
  filters,
  requests,
  onChange,
}: RequestFiltersProps) {
  // Extract unique values for filters
  const availableStatuses = Array.from(
    new Set(requests.map(r => r.status).filter(Boolean))
  );

  const availableDepartments = Array.from(
    new Set(requests.map(r => r.department).filter(Boolean))
  );

  const handleStatusChange = (statuses: string[]) => {
    onChange({ ...filters, statuses });
  };

  const handleDepartmentChange = (departments: string[]) => {
    onChange({ ...filters, departments });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: Date | null) => {
    onChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: date },
    });
  };

  const handleClearFilters = () => {
    onChange({
      statuses: [],
      departments: [],
      dateRange: { start: null, end: null },
      priority: [],
      assignedTo: [],
    });
  };

  const activeFilterCount =
    filters.statuses.length +
    filters.departments.length +
    (filters.dateRange.start ? 1 : 0) +
    (filters.dateRange.end ? 1 : 0);

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ mb: 2 }}
      >
        <Typography variant='subtitle2'>
          Filters {activeFilterCount > 0 && `(${activeFilterCount} active)`}
        </Typography>
        {activeFilterCount > 0 && (
          <Chip
            label='Clear All'
            size='small'
            onClick={handleClearFilters}
            onDelete={handleClearFilters}
          />
        )}
      </Stack>

      <Grid container spacing={2}>
        {/* Status Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.statuses}
              onChange={e => handleStatusChange(e.target.value as string[])}
              label='Status'
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(value => (
                    <Chip key={value} label={value} size='small' />
                  ))}
                </Box>
              )}
            >
              {availableStatuses.map(status => (
                <MenuItem key={status} value={status}>
                  <Checkbox checked={filters.statuses.includes(status)} />
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Department Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Department</InputLabel>
            <Select
              multiple
              value={filters.departments}
              onChange={e => handleDepartmentChange(e.target.value as string[])}
              label='Department'
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(value => (
                    <Chip key={value} label={value} size='small' />
                  ))}
                </Box>
              )}
            >
              {availableDepartments.map(dept => (
                <MenuItem key={dept} value={dept}>
                  <Checkbox checked={filters.departments.includes(dept)} />
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Start Date */}
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label='Start Date'
              value={filters.dateRange.start}
              onChange={date => handleDateRangeChange('start', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* End Date */}
        <Grid item xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label='End Date'
              value={filters.dateRange.end}
              onChange={date => handleDateRangeChange('end', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
    </Box>
  );
}
