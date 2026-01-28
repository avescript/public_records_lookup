'use client';

import React, { useEffect, useState } from 'react';
import {
  Clear as ClearIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  addBusinessDays,
  differenceInBusinessDays,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  getAllRequests,
  RequestStatus,
  StoredRequest,
  routeRequestToAgency,
} from '../../../services/requestService';
import { useAgency } from '../../../contexts/AgencyContext';
import { SYNTHETIC_AGENCIES } from '../../../data/syntheticDataTemplates';

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
  const { currentAgency } = useAgency();

  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');  
  const [showAllAgencies, setShowAllAgencies] = useState(false);
  
  // Cross-agency routing state
  const [routingDialog, setRoutingDialog] = useState<{
    open: boolean;
    request: StoredRequest | null;
    targetAgency: string;
    reason: string;
  }>({ open: false, request: null, targetAgency: '', reason: '' });

  // Available filter options
  const departmentOptions = [
    { value: 'police', label: 'Police Department' },
    { value: 'fire', label: 'Fire Department' },
    { value: 'clerk', label: 'City Clerk' },
    { value: 'finance', label: 'Finance Department' },
    { value: 'public_works', label: 'Public Works' },
    { value: 'legal', label: 'Legal Department' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'processing', label: 'Processing' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ];
  
  const agencyOptions = SYNTHETIC_AGENCIES.map(agency => ({
    value: agency.id,
    label: agency.name,
  }));

  useEffect(() => {
    fetchRequests();
    loadFiltersFromURL();
  }, []);

  // Refetch requests when agency context or show all agencies setting changes
  useEffect(() => {
    fetchRequests();
  }, [currentAgency?.id, showAllAgencies]);

  // Load filter state from URL parameters on initial load
  const loadFiltersFromURL = () => {
    const departments = searchParams.get('departments');
    const statuses = searchParams.get('statuses');
    const agencies = searchParams.get('agencies');
    const showAll = searchParams.get('showAllAgencies');
    const search = searchParams.get('search');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    if (departments) {
      setSelectedDepartments(departments.split(',').filter(Boolean));
    }
    if (statuses) {
      setSelectedStatuses(statuses.split(',').filter(Boolean));
    }
    if (agencies) {
      setSelectedAgencies(agencies.split(',').filter(Boolean));
    }
    if (showAll === 'true') {
      setShowAllAgencies(true);
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
    if (selectedAgencies.length > 0) {
      params.set('agencies', selectedAgencies.join(','));
    }
    if (showAllAgencies) {
      params.set('showAllAgencies', 'true');
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
  }, [
    requests,
    selectedDepartments,
    selectedStatuses,
    selectedAgencies,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL();
    }, 300); // Debounce URL updates

    return () => clearTimeout(timeoutId);
  }, [selectedDepartments, selectedStatuses, selectedAgencies, startDate, endDate, searchQuery, showAllAgencies]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Determine agency filter based on context and settings
      let agencyFilter: string | undefined = undefined;
      if (!showAllAgencies && currentAgency) {
        agencyFilter = currentAgency.id;
      }
      
      console.log('📋 [StaffDashboard] Fetching requests:', { agencyFilter, showAllAgencies });
      const requestData = await getAllRequests(agencyFilter);
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

    // Filter by agencies (additional filtering beyond fetch-level agency filter)
    if (selectedAgencies.length > 0) {
      filtered = filtered.filter(request =>
        request.agency && selectedAgencies.includes(request.agency)
      );
    }

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
        const requestDate = request.submittedAt.toDate
          ? request.submittedAt.toDate()
          : new Date(request.submittedAt as any);
        return (
          isAfter(requestDate, startOfDay(startDate)) ||
          requestDate.toDateString() === startDate.toDateString()
        );
      });
    }

    if (endDate) {
      filtered = filtered.filter(request => {
        const requestDate = request.submittedAt.toDate
          ? request.submittedAt.toDate()
          : new Date(request.submittedAt as any);
        return (
          isBefore(requestDate, endOfDay(endDate)) ||
          requestDate.toDateString() === endDate.toDateString()
        );
      });
    }

    // Filter by search query (title, description, tracking ID, contact email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        request =>
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
    setSelectedDepartments(
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const handleStatusChange = (event: any) => {
    const value = event.target.value;
    setSelectedStatuses(typeof value === 'string' ? value.split(',') : value);
  };

  const clearAllFilters = () => {
    setSelectedDepartments([]);
    setSelectedStatuses([]);
    setSelectedAgencies([]);
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
    setShowAllAgencies(false); // Reset to current agency only
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleAgencyChange = (event: any) => {
    setSelectedAgencies(event.target.value);
  };

  const clearAgencyFilters = () => {
    setSelectedAgencies([]);
  };

  const toggleShowAllAgencies = () => {
    setShowAllAgencies(!showAllAgencies);
  };

  // Cross-agency routing handlers
  const handleRouteRequest = (request: StoredRequest) => {
    setRoutingDialog({
      open: true,
      request,
      targetAgency: '',
      reason: '',
    });
  };

  const handleRouteRequestConfirm = async () => {
    const { request, targetAgency, reason } = routingDialog;
    if (!request || !targetAgency || !reason.trim()) return;

    try {
      await routeRequestToAgency(
        request.id!,
        targetAgency,
        reason.trim(),
        'current-user' // TODO: Get from auth context
      );
      
      // Refresh requests after routing
      await fetchRequests();
      
      // Close dialog and reset state
      setRoutingDialog({ open: false, request: null, targetAgency: '', reason: '' });
    } catch (error) {
      console.error('Error routing request:', error);
      // TODO: Show error message to user
    }
  };

  const handleRouteRequestCancel = () => {
    setRoutingDialog({ open: false, request: null, targetAgency: '', reason: '' });
  };

  const hasActiveFilters =
    selectedDepartments.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedAgencies.length > 0 ||
    startDate !== null ||
    endDate !== null ||
    searchQuery.trim() !== '' ||
    showAllAgencies;

  const calculateDueDate = (submittedAt: any) => {
    const submitDate = submittedAt.toDate
      ? submittedAt.toDate()
      : new Date(submittedAt);
    return addBusinessDays(submitDate, SLA_DAYS);
  };

  const getDueDateStatus = (submittedAt: any) => {
    const dueDate = calculateDueDate(submittedAt);
    const today = new Date();
    const daysUntilDue = differenceInBusinessDays(dueDate, today);

    if (daysUntilDue < 0) {
      return {
        status: 'overdue',
        daysUntilDue: Math.abs(daysUntilDue),
        color: 'error' as const,
      };
    } else if (daysUntilDue <= DUE_SOON_THRESHOLD) {
      return { status: 'due-soon', daysUntilDue, color: 'warning' as const };
    } else {
      return { status: 'on-time', daysUntilDue, color: 'success' as const };
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'submitted':
        return 'info';
      case 'processing':
        return 'primary';
      case 'under_review':
        return 'warning';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDepartmentDisplayName = (department: string) => {
    const departments: Record<string, string> = {
      police: 'Police Department',
      fire: 'Fire Department',
      clerk: 'City Clerk',
      finance: 'Finance Department',
      public_works: 'Public Works',
      legal: 'Legal Department',
      other: 'Other',
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
      width: 150,
    },
    {
      field: 'title',
      headerName: 'Request Title',
      width: 300,
      flex: 1,
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 180,
      valueGetter: (params: any) => getDepartmentDisplayName(params.value),
    },
    {
      field: 'agency',
      headerName: 'Agency',
      width: 150,
      valueGetter: (params: any) => {
        const agency = SYNTHETIC_AGENCIES.find(a => a.id === params.value);
        return agency ? agency.name : params.value || 'Unknown';
      },
      renderCell: (params: GridRenderCellParams) => {
        const agency = SYNTHETIC_AGENCIES.find(a => a.id === params.value);
        const isCurrentAgency = params.value === currentAgency?.id;
        return (
          <Chip
            label={agency ? agency.name : params.value || 'Unknown'}
            color={isCurrentAgency ? 'primary' : 'default'}
            size="small"
            variant={isCurrentAgency ? 'filled' : 'outlined'}
          />
        );
      },
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
      ),
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 180,
      valueGetter: (params: any) => formatDate(params.value),
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 180,
      valueGetter: (params: any) => {
        if (!params || !params.row || !params.row.submittedAt) return '';
        const dueDate = calculateDueDate(params.row.submittedAt);
        return format(dueDate, 'MMM d, yyyy');
      },
    },
    {
      field: 'dueDateStatus',
      headerName: 'Priority',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        if (!params || !params.row || !params.row.submittedAt) return null;
        const dueDateStatus = getDueDateStatus(params.row.submittedAt);

        if (dueDateStatus.status === 'overdue') {
          return (
            <Tooltip
              title={`Overdue by ${dueDateStatus.daysUntilDue} business days`}
            >
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
            <Tooltip
              title={`Due in ${dueDateStatus.daysUntilDue} business days`}
            >
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
      },
    },
    {
      field: 'contactEmail',
      headerName: 'Contact',
      width: 200,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => onRequestSelect?.(params.row)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {showAllAgencies && (
            <Tooltip title="Route to Agency">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRouteRequest(params.row);
                }}
              >
                <SwapHorizIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const handleRowClick = (params: GridRowParams) => {
    onRequestSelect?.(params.row as StoredRequest);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
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
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Departments</InputLabel>
              <Select
                multiple
                value={selectedDepartments}
                onChange={handleDepartmentChange}
                input={<OutlinedInput label="Departments" />}
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
                          size="small"
                          color="primary"
                          variant="outlined"
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

            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={selectedStatuses}
                onChange={handleStatusChange}
                input={<OutlinedInput label="Status" />}
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
                          size="small"
                          color="secondary"
                          variant="outlined"
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

            {/* Agency Filter - only show when viewing all agencies */}
            {showAllAgencies && (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Agencies</InputLabel>
                <Select
                  multiple
                  value={selectedAgencies}
                  onChange={handleAgencyChange}
                  input={<OutlinedInput label="Agencies" />}
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
                            size="small"
                            color="info"
                            variant="outlined"
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
            )}

            {/* Toggle for showing all agencies */}
            <Button
              variant={showAllAgencies ? "contained" : "outlined"}
              size="small"
              onClick={toggleShowAllAgencies}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showAllAgencies ? 'Show Current Agency Only' : 'Show All Agencies'}
            </Button>

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={newValue => setStartDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 150 },
                },
              }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={newValue => setEndDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 150 },
                },
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

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 'auto' }}
            >
              Showing {filteredRequests.length} of {requests.length} requests
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={2}>
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            getRowId={row => row.id || row.trackingId}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
              sorting: {
                sortModel: [{ field: 'submittedAt', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            onRowClick={handleRowClick}
            sx={{
              minHeight: 600,
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
            }}
            disableRowSelectionOnClick
          />
        </Paper>

        {/* Cross-Agency Routing Dialog */}
        <Dialog
          open={routingDialog.open}
          onClose={handleRouteRequestCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Route Request to Another Agency
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {routingDialog.request && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Request: {routingDialog.request.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Agency: {SYNTHETIC_AGENCIES.find(a => a.id === routingDialog.request?.agency)?.name || routingDialog.request.agency || 'Unknown'}
                  </Typography>
                </Box>
              )}
              
              <FormControl fullWidth>
                <InputLabel>Target Agency</InputLabel>
                <Select
                  value={routingDialog.targetAgency}
                  onChange={(e) => setRoutingDialog(prev => ({ ...prev, targetAgency: e.target.value }))}
                  label="Target Agency"
                >
                  {agencyOptions
                    .filter(option => option.value !== routingDialog.request?.agency)
                    .map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <TextField
                label="Reason for Routing"
                multiline
                rows={3}
                value={routingDialog.reason}
                onChange={(e) => setRoutingDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why this request should be handled by the target agency..."
                helperText="This will be added to the request's internal notes."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRouteRequestCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleRouteRequestConfirm}
              variant="contained"
              disabled={!routingDialog.targetAgency || !routingDialog.reason.trim()}
            >
              Route Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
