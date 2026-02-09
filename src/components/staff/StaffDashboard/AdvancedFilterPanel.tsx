'use client';

import React from 'react';
import {
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  Sort as SortIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

export interface FilterState {
  departments: string[];
  statuses: string[];
  agencies: string[];
  startDate: Date | null;
  endDate: Date | null;
  searchQuery: string;
  sortBy: 'date' | 'title' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  viewMode: 'list' | 'cards';
  onViewModeChange: (mode: 'list' | 'cards') => void;
  showAllAgencies: boolean;
  onShowAllAgenciesChange: (show: boolean) => void;
  departmentOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  agencyOptions: Array<{ value: string; label: string }>;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
  showAllAgencies,
  onShowAllAgenciesChange,
  departmentOptions,
  statusOptions,
  agencyOptions,
  expanded = false,
  onExpandedChange,
}) => {
  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.statuses.length > 0 ||
    filters.agencies.length > 0 ||
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.searchQuery.trim() !== '' ||
    showAllAgencies;

  const activeFilterCount = [
    filters.departments.length > 0,
    filters.statuses.length > 0,
    filters.agencies.length > 0,
    filters.startDate !== null,
    filters.endDate !== null,
    filters.searchQuery.trim() !== '',
    showAllAgencies,
  ].filter(Boolean).length;

  return (
    <Card variant='outlined' sx={{ mb: 3 }}>
      <CardContent sx={{ pb: 2 }}>
        {/* Header Row */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='h6' display='flex' alignItems='center' gap={1}>
              <FilterIcon color='primary' />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Chip
                  label={`${activeFilterCount} active`}
                  size='small'
                  color='primary'
                  variant='outlined'
                />
              )}
            </Typography>

            {hasActiveFilters && (
              <Button size='small' onClick={onClearFilters} color='secondary'>
                Clear All
              </Button>
            )}
          </Box>

          {/* View Mode Toggle */}
          <Box display='flex' alignItems='center' gap={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
              size='small'
            >
              <ToggleButton value='list' aria-label='List View'>
                <ListViewIcon fontSize='small' />
              </ToggleButton>
              <ToggleButton value='cards' aria-label='Card View'>
                <GridViewIcon fontSize='small' />
              </ToggleButton>
            </ToggleButtonGroup>

            {onExpandedChange && (
              <Button
                size='small'
                onClick={() => onExpandedChange(!expanded)}
                endIcon={<FilterIcon />}
              >
                {expanded ? 'Simple' : 'Advanced'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Quick Search */}
        <TextField
          fullWidth
          size='small'
          placeholder='Search by title, description, tracking ID, or contact email...'
          value={filters.searchQuery}
          onChange={e => onFiltersChange({ searchQuery: e.target.value })}
          sx={{ mb: 2 }}
        />

        {/* Collapsible Advanced Filters */}
        <Collapse in={expanded}>
          <Stack spacing={3}>
            {/* Filter Row 1 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Department Filter */}
              <FormControl size='small' sx={{ minWidth: 160 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  multiple
                  value={filters.departments}
                  onChange={e =>
                    onFiltersChange({
                      departments:
                        typeof e.target.value === 'string'
                          ? [e.target.value]
                          : e.target.value,
                    })
                  }
                  label='Department'
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => {
                        const option = departmentOptions.find(
                          opt => opt.value === value
                        );
                        return (
                          <Chip
                            key={value}
                            label={option?.label || value}
                            size='small'
                            variant='outlined'
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {departmentOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl size='small' sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.statuses}
                  onChange={e =>
                    onFiltersChange({
                      statuses:
                        typeof e.target.value === 'string'
                          ? [e.target.value]
                          : e.target.value,
                    })
                  }
                  label='Status'
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => {
                        const option = statusOptions.find(
                          opt => opt.value === value
                        );
                        return (
                          <Chip
                            key={value}
                            label={option?.label || value}
                            size='small'
                            variant='outlined'
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Agency Filter */}
              <FormControl size='small' sx={{ minWidth: 160 }}>
                <InputLabel>Agency</InputLabel>
                <Select
                  multiple
                  value={filters.agencies}
                  onChange={e =>
                    onFiltersChange({
                      agencies:
                        typeof e.target.value === 'string'
                          ? [e.target.value]
                          : e.target.value,
                    })
                  }
                  label='Agency'
                  disabled={!showAllAgencies}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => {
                        const option = agencyOptions.find(
                          opt => opt.value === value
                        );
                        return (
                          <Chip
                            key={value}
                            label={option?.label || value}
                            size='small'
                            variant='outlined'
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {agencyOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Filter Row 2 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Date Range */}
              <DatePicker
                label='Start Date'
                value={filters.startDate}
                onChange={date => onFiltersChange({ startDate: date })}
                slotProps={{ textField: { size: 'small' } }}
              />

              <DatePicker
                label='End Date'
                value={filters.endDate}
                onChange={date => onFiltersChange({ endDate: date })}
                slotProps={{ textField: { size: 'small' } }}
              />

              {/* Sort Options */}
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={e =>
                    onFiltersChange({ sortBy: e.target.value as any })
                  }
                  label='Sort By'
                >
                  <MenuItem value='date'>Date</MenuItem>
                  <MenuItem value='title'>Title</MenuItem>
                  <MenuItem value='priority'>Priority</MenuItem>
                  <MenuItem value='status'>Status</MenuItem>
                </Select>
              </FormControl>

              <ButtonGroup size='small'>
                <Button
                  variant={
                    filters.sortOrder === 'asc' ? 'contained' : 'outlined'
                  }
                  onClick={() => onFiltersChange({ sortOrder: 'asc' })}
                >
                  ASC
                </Button>
                <Button
                  variant={
                    filters.sortOrder === 'desc' ? 'contained' : 'outlined'
                  }
                  onClick={() => onFiltersChange({ sortOrder: 'desc' })}
                >
                  DESC
                </Button>
              </ButtonGroup>
            </Stack>

            {/* Agency Toggle */}
            <Box>
              <Button
                variant={showAllAgencies ? 'contained' : 'outlined'}
                onClick={() => onShowAllAgenciesChange(!showAllAgencies)}
                size='small'
              >
                {showAllAgencies
                  ? 'Show Current Agency Only'
                  : 'Show All Agencies'}
              </Button>
              {showAllAgencies && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ ml: 2 }}
                >
                  Viewing requests from all agencies
                </Typography>
              )}
            </Box>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};
