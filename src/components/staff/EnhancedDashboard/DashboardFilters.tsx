'use client';

import React, { useState } from 'react';
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { RequestStatus } from '@/services/requestService';

export interface FilterOptions {
  status: RequestStatus[];
  priority: ('high' | 'medium' | 'low')[];
  department: string[];
  assignedTo: string[];
  dueDateRange: {
    start: string | null;
    end: string | null;
  };
  overdue: boolean;
  keywords: string;
}

export interface DashboardFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  open: boolean;
  onClose: () => void;
}

const statusOptions: RequestStatus[] = [
  'submitted',
  'processing',
  'under_review',
  'completed',
  'rejected',
];

const priorityOptions = ['high', 'medium', 'low'] as const;

const departmentOptions = [
  'Police',
  'Transportation',
  'Planning',
  'Public Works',
  'Fire Department',
  'Parks & Recreation',
  'Finance',
  'Human Resources',
];

const staffOptions = [
  'John Smith',
  'Sarah Johnson',
  'Mike Davis',
  'Emily Brown',
  'Current User',
];

export function DashboardFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  open,
  onClose,
}: DashboardFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      status: [],
      priority: [],
      department: [],
      assignedTo: [],
      dueDateRange: { start: null, end: null },
      overdue: false,
      keywords: '',
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    onClose();
  };

  const handleStatusChange = (status: RequestStatus) => {
    const newStatus = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status];
    setLocalFilters({ ...localFilters, status: newStatus });
  };

  const handlePriorityChange = (priority: 'high' | 'medium' | 'low') => {
    const newPriority = localFilters.priority.includes(priority)
      ? localFilters.priority.filter(p => p !== priority)
      : [...localFilters.priority, priority];
    setLocalFilters({ ...localFilters, priority: newPriority });
  };

  const activeFiltersCount =
    localFilters.status.length +
    localFilters.priority.length +
    localFilters.department.length +
    localFilters.assignedTo.length +
    (localFilters.dueDateRange.start || localFilters.dueDateRange.end ? 1 : 0) +
    (localFilters.overdue ? 1 : 0) +
    (localFilters.keywords ? 1 : 0);

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 400, padding: 2 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FilterIcon sx={{ mr: 1 }} />
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Filter Requests
        </Typography>
        <IconButton onClick={onClose}>
          <ClearIcon />
        </IconButton>
      </Box>

      {activeFiltersCount > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}{' '}
            active
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Status Filter */}
        <Box>
          <Typography
            variant='subtitle2'
            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
          >
            <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
            Status
          </Typography>
          <FormGroup row>
            {statusOptions.map(status => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={localFilters.status.includes(status)}
                    onChange={() => handleStatusChange(status)}
                  />
                }
                label={status.replace('_', ' ').toUpperCase()}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Priority Filter */}
        <Box>
          <Typography
            variant='subtitle2'
            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
          >
            <PriorityIcon sx={{ mr: 1, fontSize: 20 }} />
            Priority
          </Typography>
          <FormGroup row>
            {priorityOptions.map(priority => (
              <FormControlLabel
                key={priority}
                control={
                  <Checkbox
                    checked={localFilters.priority.includes(priority)}
                    onChange={() => handlePriorityChange(priority)}
                  />
                }
                label={priority.toUpperCase()}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Department Filter */}
        <Box>
          <FormControl fullWidth size='small'>
            <InputLabel>Department</InputLabel>
            <Select
              multiple
              value={localFilters.department}
              onChange={e =>
                setLocalFilters({
                  ...localFilters,
                  department: Array.isArray(e.target.value)
                    ? e.target.value
                    : [],
                })
              }
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(value => (
                    <Chip key={value} label={value} size='small' />
                  ))}
                </Box>
              )}
            >
              {departmentOptions.map(dept => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Assigned To Filter */}
        <Box>
          <Typography
            variant='subtitle2'
            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
          >
            <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
            Assigned To
          </Typography>
          <Autocomplete
            multiple
            options={staffOptions}
            value={localFilters.assignedTo}
            onChange={(_, newValue) =>
              setLocalFilters({
                ...localFilters,
                assignedTo: newValue,
              })
            }
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                placeholder='Select staff members...'
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant='outlined'
                  label={option}
                  size='small'
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />
        </Box>

        {/* Due Date Range */}
        <Box>
          <Typography
            variant='subtitle2'
            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
          >
            <CalendarIcon sx={{ mr: 1, fontSize: 20 }} />
            Due Date Range
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type='date'
              size='small'
              label='From'
              value={localFilters.dueDateRange.start || ''}
              onChange={e =>
                setLocalFilters({
                  ...localFilters,
                  dueDateRange: {
                    ...localFilters.dueDateRange,
                    start: e.target.value,
                  },
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type='date'
              size='small'
              label='To'
              value={localFilters.dueDateRange.end || ''}
              onChange={e =>
                setLocalFilters({
                  ...localFilters,
                  dueDateRange: {
                    ...localFilters.dueDateRange,
                    end: e.target.value,
                  },
                })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        {/* Overdue Filter */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.overdue}
                onChange={e =>
                  setLocalFilters({
                    ...localFilters,
                    overdue: e.target.checked,
                  })
                }
              />
            }
            label='Show only overdue requests'
          />
        </Box>

        {/* Keywords Filter */}
        <Box>
          <TextField
            fullWidth
            size='small'
            label='Keywords'
            placeholder='Search in title, description, or tracking ID...'
            value={localFilters.keywords}
            onChange={e =>
              setLocalFilters({
                ...localFilters,
                keywords: e.target.value,
              })
            }
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant='contained'
            onClick={handleApplyFilters}
            sx={{ flex: 1 }}
          >
            Apply Filters
          </Button>
          <Button
            variant='outlined'
            onClick={handleClearFilters}
            sx={{ flex: 1 }}
          >
            Clear All
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
