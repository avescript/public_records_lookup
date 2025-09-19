'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Stack,
  TextField
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRowParams,
  GridRenderCellParams 
} from '@mui/x-data-grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format, differenceInBusinessDays, addBusinessDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { StoredRequest, getAllRequests, RequestStatus } from '../../../services/requestService';

// SLA Configuration (in business days)
const SLA_DAYS = 10;
const DUE_SOON_THRESHOLD = 3;

interface StaffDashboardProps {
  onRequestSelect?: (request: StoredRequest) => void;
}

export function StaffDashboard({ onRequestSelect }: StaffDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Available filter options
  const departmentOptions = [
    { value: 'police', label: 'Police Department' },
    { value: 'fire', label: 'Fire Department' },
    { value: 'clerk', label: 'City Clerk' },
    { value: 'finance', label: 'Finance Department' },
    { value: 'public_works', label: 'Public Works' },
    { value: 'legal', label: 'Legal Department' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'processing', label: 'Processing' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  useEffect(() => {
    fetchRequests();
    loadFiltersFromURL();
  }, []);

  // Load filter state from URL parameters on initial load
  const loadFiltersFromURL = () => {
    const departments = searchParams.get('departments');
    const statuses = searchParams.get('statuses');
    const search = searchParams.get('search');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    if (departments) {
      setSelectedDepartments(departments.split(',').filter(Boolean));
    }
    if (statuses) {
      setSelectedStatuses(statuses.split(',').filter(Boolean));
    }
    if (search) {
      setSearchQuery(search);
    }
    if (start) {
      try {
        setStartDate(new Date(start));
      } catch (e) {
        console.warn('Invalid start date in URL:', start);
      }
    }
    if (end) {
      try {
        setEndDate(new Date(end));
      } catch (e) {
        console.warn('Invalid end date in URL:', end);
      }
    }
  };

  // Update URL parameters when filters change
  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (selectedDepartments.length > 0) {
      params.set('departments', selectedDepartments.join(','));
    }
    if (selectedStatuses.length > 0) {
      params.set('statuses', selectedStatuses.join(','));
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (startDate) {
      params.set('startDate', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params.set('endDate', endDate.toISOString().split('T')[0]);
    }

    const paramString = params.toString();
    const newURL = paramString ? `${pathname}?${paramString}` : pathname;
    
    // Use replace to avoid creating history entries for every filter change
    router.replace(newURL as any);
  };

  // Apply filters when requests or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [requests, selectedDepartments, selectedStatuses, startDate, endDate, searchQuery]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedDepartments, selectedStatuses, startDate, endDate, searchQuery]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestData = await getAllRequests();
      setRequests(requestData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Filter by departments
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(request => 
        selectedDepartments.includes(request.department)
      );
    }

    // Filter by statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(request => 
        selectedStatuses.includes(request.status)
      );
    }

    // Filter by date range (submission date)
    if (startDate) {
      filtered = filtered.filter(request => {
        const requestDate = request.submittedAt.toDate ? request.submittedAt.toDate() : new Date(request.submittedAt as any);
        return isAfter(requestDate, startOfDay(startDate)) || requestDate.toDateString() === startDate.toDateString();
      });
    }

    if (endDate) {
      filtered = filtered.filter(request => {
        const requestDate = request.submittedAt.toDate ? request.submittedAt.toDate() : new Date(request.submittedAt as any);
        return isBefore(requestDate, endOfDay(endDate)) || requestDate.toDateString() === endDate.toDateString();
      });
    }

    // Filter by search query (title, description, tracking ID, contact email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        request.trackingId.toLowerCase().includes(query) ||
        request.contactEmail.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleDepartmentChange = (event: any) => {
    const value = event.target.value;
    setSelectedDepartments(typeof value === 'string' ? value.split(',') : value);
  };

  const handleStatusChange = (event: any) => {
    const value = event.target.value;
    setSelectedStatuses(typeof value === 'string' ? value.split(',') : value);
  };

  const clearAllFilters = () => {
    setSelectedDepartments([]);
    setSelectedStatuses([]);
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const hasActiveFilters = selectedDepartments.length > 0 || 
                          selectedStatuses.length > 0 || 
                          startDate !== null || 
                          endDate !== null || 
                          searchQuery.trim() !== '';

  const calculateDueDate = (submittedAt: any) => {
    const submitDate = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt);
    return addBusinessDays(submitDate, SLA_DAYS);
  };

  const getDueDateStatus = (submittedAt: any) => {
    const dueDate = calculateDueDate(submittedAt);
    const today = new Date();
    const daysUntilDue = differenceInBusinessDays(dueDate, today);

    if (daysUntilDue < 0) {
      return { status: 'overdue', daysUntilDue: Math.abs(daysUntilDue), color: 'error' as const };
    } else if (daysUntilDue <= DUE_SOON_THRESHOLD) {
      return { status: 'due-soon', daysUntilDue, color: 'warning' as const };
    } else {
      return { status: 'on-time', daysUntilDue, color: 'success' as const };
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'submitted': return 'info';
      case 'processing': return 'primary';
      case 'under_review': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getDepartmentDisplayName = (department: string) => {
    const departments: Record<string, string> = {
      'police': 'Police Department',
      'fire': 'Fire Department',
      'clerk': 'City Clerk',
      'finance': 'Finance Department',
      'public_works': 'Public Works',
      'legal': 'Legal Department',
      'other': 'Other'
    };
    return departments[department] || department;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const columns: GridColDef[] = [
    {
      field: 'trackingId',
      headerName: 'Tracking ID',
      width: 150
    },
    {
      field: 'title',
      headerName: 'Request Title',
      width: 300,
      flex: 1
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 180,
      valueGetter: (params: any) => 
        getDepartmentDisplayName(params.value)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 180,
      valueGetter: (params: any) => 
        formatDate(params.value)
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 180,
      valueGetter: (params: any) => {
        const dueDate = calculateDueDate(params.row.submittedAt);
        return format(dueDate, 'MMM d, yyyy');
      }
    },
    {
      field: 'dueDateStatus',
      headerName: 'Priority',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const dueDateStatus = getDueDateStatus(params.row.submittedAt);
        
        if (dueDateStatus.status === 'overdue') {
          return (
            <Tooltip title={`Overdue by ${dueDateStatus.daysUntilDue} business days`}>
              <Chip
                icon={<ErrorIcon />}
                label="OVERDUE"
                color="error"
                size="small"
                variant="filled"
              />
            </Tooltip>
          );
        } else if (dueDateStatus.status === 'due-soon') {
          return (
            <Tooltip title={`Due in ${dueDateStatus.daysUntilDue} business days`}>
              <Chip
                icon={<WarningIcon />}
                label="DUE SOON"
                color="warning"
                size="small"
                variant="filled"
              />
            </Tooltip>
          );
        } else {
          return (
            <Chip
              label="ON TIME"
              color="success"
              size="small"
              variant="outlined"
            />
          );
        }
      }
    },
    {
      field: 'contactEmail',
      headerName: 'Contact',
      width: 200
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => onRequestSelect?.(params.row)}
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const handleRowClick = (params: GridRowParams) => {
    onRequestSelect?.(params.row as StoredRequest);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Request Queue
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage and track public records requests
        </Typography>

        {/* Filter Controls */}
        <Paper elevation={1} sx={{ p: 2, mt: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters & Search
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search requests by title, description, tracking ID, or contact email..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                  >
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Departments</InputLabel>
              <Select
                multiple
                value={selectedDepartments}
                onChange={handleDepartmentChange}
                input={<OutlinedInput label="Departments" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const option = departmentOptions.find(opt => opt.value === value);
                      return (
                        <Chip 
                          key={value} 
                          label={option?.label || value} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {departmentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={selectedStatuses}
                onChange={handleStatusChange}
                input={<OutlinedInput label="Status" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const option = statusOptions.find(opt => opt.value === value);
                      return (
                        <Chip 
                          key={value} 
                          label={option?.label || value} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 150 }
                }
              }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 150 }
                }
              }}
            />

            {hasActiveFilters && (
              <Chip
                label="Clear All Filters"
                onClick={clearAllFilters}
                onDelete={clearAllFilters}
                color="default"
                variant="outlined"
                size="small"
              />
            )}

            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              Showing {filteredRequests.length} of {requests.length} requests
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={2}>
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            getRowId={(row) => row.id || row.trackingId}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 }
              },
              sorting: {
                sortModel: [{ field: 'submittedAt', sort: 'desc' }]
              }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            onRowClick={handleRowClick}
            sx={{
              minHeight: 600,
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }
            }}
            disableRowSelectionOnClick
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}