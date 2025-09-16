'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRowParams,
  GridRenderCellParams 
} from '@mui/x-data-grid';
import { 
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Error as ErrorIcon 
} from '@mui/icons-material';
import { format, differenceInBusinessDays, addBusinessDays } from 'date-fns';
import { StoredRequest, getAllRequests, RequestStatus } from '../../../services/requestService';

// SLA Configuration (in business days)
const SLA_DAYS = 10;
const DUE_SOON_THRESHOLD = 3;

interface StaffDashboardProps {
  onRequestSelect?: (request: StoredRequest) => void;
}

export function StaffDashboard({ onRequestSelect }: StaffDashboardProps) {
  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Request Queue
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage and track public records requests
      </Typography>

      <Paper elevation={2} sx={{ mt: 3 }}>
        <DataGrid
          rows={requests}
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
  );
}