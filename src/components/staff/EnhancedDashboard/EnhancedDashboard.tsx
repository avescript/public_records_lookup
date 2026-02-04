'use client';

import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Fab,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/core/Button';
import { StaffDashboard } from '@/components/staff/StaffDashboard';
import {
  getAllRequests,
  RequestStatus,
  StoredRequest,
} from '@/services/requestService';

import { BulkOperations, SortOption } from './BulkOperations';
import { DashboardFilters, FilterOptions } from './DashboardFilters';
import {
  StyledControlsContainer,
  StyledDashboardContainer,
  StyledDashboardHeader,
  StyledMetricCard,
  StyledMetricsContainer,
  StyledRequestCard,
  StyledRequestsGrid,
} from './EnhancedDashboard.styles';
import { MetricsPanel } from './MetricsPanel';

export interface EnhancedDashboardProps {
  onRequestSelect: (request: StoredRequest) => void;
}

// Extended StoredRequest interface for display purposes
interface ExtendedStoredRequest extends StoredRequest {
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
}

export function EnhancedDashboard({ onRequestSelect }: EnhancedDashboardProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<ExtendedStoredRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    ExtendedStoredRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    priority: [],
    department: [],
    assignedTo: [],
    dueDateRange: { start: null, end: null },
    overdue: false,
    keywords: '',
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'submittedAt',
    direction: 'desc',
    label: 'Date Submitted (Newest)',
  });

  const router = useRouter();

  // Load requests on component mount
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const requestsData = await getAllRequests();

        // Enhance requests with additional display data
        const enhancedRequests: ExtendedStoredRequest[] = requestsData.map(
          request => ({
            ...request,
            dueDate: calculateDueDate(request.submittedAt.toDate()),
            priority: calculatePriority(request),
            assignedTo: request.agency ? `${request.agency} Staff` : undefined,
          })
        );

        setRequests(enhancedRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
        // Use empty array on error
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let filtered = [...requests];

    // Apply search term
    const searchQuery =
      searchTerm.toLowerCase() || filters.keywords.toLowerCase();
    if (searchQuery) {
      filtered = filtered.filter(
        request =>
          request.description.toLowerCase().includes(searchQuery) ||
          request.trackingId.toLowerCase().includes(searchQuery) ||
          request.department.toLowerCase().includes(searchQuery) ||
          request.title.toLowerCase().includes(searchQuery)
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(request =>
        filters.status.includes(request.status)
      );
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(request =>
        filters.priority.includes(request.priority)
      );
    }

    // Apply department filter
    if (filters.department.length > 0) {
      filtered = filtered.filter(request =>
        filters.department.includes(request.department)
      );
    }

    // Apply assigned to filter
    if (filters.assignedTo.length > 0) {
      filtered = filtered.filter(
        request =>
          request.assignedTo && filters.assignedTo.includes(request.assignedTo)
      );
    }

    // Apply due date range filter
    if (filters.dueDateRange.start || filters.dueDateRange.end) {
      filtered = filtered.filter(request => {
        const dueDate = new Date(request.dueDate);
        const start = filters.dueDateRange.start
          ? new Date(filters.dueDateRange.start)
          : null;
        const end = filters.dueDateRange.end
          ? new Date(filters.dueDateRange.end)
          : null;

        if (start && dueDate < start) return false;
        if (end && dueDate > end) return false;
        return true;
      });
    }

    // Apply overdue filter
    if (filters.overdue) {
      const now = new Date();
      filtered = filtered.filter(request => {
        const dueDate = new Date(request.dueDate);
        return (
          dueDate < now &&
          request.status !== 'completed' &&
          request.status !== 'rejected'
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortOption;
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'submittedAt':
        case 'updatedAt':
          aValue = a[field].toDate();
          bValue = b[field].toDate();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        default:
          aValue = a[field];
          bValue = b[field];
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredRequests(filtered);
  }, [requests, searchTerm, filters, sortOption]);

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'cards' | 'table' | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleRequestClick = (request: StoredRequest) => {
    if (viewMode === 'cards') {
      // Navigate to workflow for card view
      router.push(`/admin/request/${request.id}/workflow/locate`);
    } else {
      // Use existing selection behavior for table view
      onRequestSelect(request);
    }
  };

  const handleRequestSelection = (requestId: string, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, requestId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleBulkStatusUpdate = async (
    requestIds: string[],
    status: RequestStatus
  ) => {
    console.log('Bulk status update:', requestIds, status);
    // TODO: Implement bulk status update in requestService
    // For now, just update local state
    setRequests(prev =>
      prev.map(req => (requestIds.includes(req.id!) ? { ...req, status } : req))
    );
  };

  const handleBulkAssignment = async (
    requestIds: string[],
    assignee: string
  ) => {
    console.log('Bulk assignment:', requestIds, assignee);
    // TODO: Implement bulk assignment in requestService
    // For now, just update local state
    setRequests(prev =>
      prev.map(req =>
        requestIds.includes(req.id!) ? { ...req, assignedTo: assignee } : req
      )
    );
  };

  const handleBulkExport = async (
    requestIds: string[],
    format: 'csv' | 'pdf'
  ) => {
    console.log('Bulk export:', requestIds, format);
    // TODO: Implement export functionality
    alert(`Exporting ${requestIds.length} requests as ${format.toUpperCase()}`);
  };

  const activeFiltersCount =
    filters.status.length +
    filters.priority.length +
    filters.department.length +
    filters.assignedTo.length +
    (filters.dueDateRange.start || filters.dueDateRange.end ? 1 : 0) +
    (filters.overdue ? 1 : 0) +
    (filters.keywords ? 1 : 0);

  // Helper functions
  function calculateDueDate(submittedDate: Date): string {
    const dueDate = new Date(submittedDate);
    dueDate.setDate(dueDate.getDate() + 5); // 5-day SLA
    return dueDate.toISOString().split('T')[0];
  }

  function calculatePriority(
    request: StoredRequest
  ): 'high' | 'medium' | 'low' {
    // Simple priority calculation based on keywords and urgency
    const description = request.description.toLowerCase();
    if (description.includes('urgent') || description.includes('emergency'))
      return 'high';
    if (description.includes('safety') || description.includes('incident'))
      return 'high';
    if (description.includes('important') || description.includes('asap'))
      return 'medium';
    return 'low';
  }

  if (viewMode === 'table') {
    return <StaffDashboard onRequestSelect={onRequestSelect} />;
  }

  return (
    <StyledDashboardContainer>
      <StyledDashboardHeader>
        <Box className='header-content'>
          <Typography variant='h4' component='h1' className='page-title'>
            Staff Dashboard
          </Typography>
          <Typography variant='body1' className='page-subtitle'>
            Manage public records requests with guided workflows
          </Typography>
        </Box>

        <StyledControlsContainer>
          <Box className='search-section'>
            <TextField
              placeholder='Search requests...'
              variant='outlined'
              size='small'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon className='search-icon' />,
              }}
              className='search-field'
            />
            <IconButton
              className='filter-button'
              onClick={() => setFiltersOpen(true)}
            >
              <Badge badgeContent={activeFiltersCount} color='primary'>
                <FilterIcon />
              </Badge>
            </IconButton>
          </Box>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size='small'
            className='view-toggle'
          >
            <ToggleButton value='cards' className='toggle-button'>
              <CardViewIcon />
              Cards
            </ToggleButton>
            <ToggleButton value='table' className='toggle-button'>
              <TableViewIcon />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </StyledControlsContainer>
      </StyledDashboardHeader>

      {/* Enhanced Metrics Panel */}
      <MetricsPanel
        requests={filteredRequests}
        currentUserId='current-user'
        refreshInterval={30000}
      />

      {/* Bulk Operations */}
      <BulkOperations
        requests={filteredRequests}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkAssignment={handleBulkAssignment}
        onBulkExport={handleBulkExport}
      />

      {/* Requests Grid */}
      <StyledRequestsGrid>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }, (_, i) => (
            <StyledRequestCard key={i}>
              <Card className='request-card'>
                <CardContent>
                  <Box sx={{ animation: 'pulse 2s infinite' }}>
                    <Box
                      sx={{
                        height: 20,
                        bgcolor: 'grey.300',
                        mb: 1,
                        borderRadius: 1,
                      }}
                    />
                    <Box
                      sx={{
                        height: 40,
                        bgcolor: 'grey.200',
                        mb: 2,
                        borderRadius: 1,
                      }}
                    />
                    <Box
                      sx={{ height: 16, bgcolor: 'grey.300', borderRadius: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </StyledRequestCard>
          ))
        ) : filteredRequests.length === 0 ? (
          <Box
            sx={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <Typography variant='h6' gutterBottom>
              No requests found
            </Typography>
            <Typography variant='body2'>
              {requests.length === 0
                ? 'No requests have been submitted yet.'
                : 'Try adjusting your search or filter criteria.'}
            </Typography>
          </Box>
        ) : (
          filteredRequests.map(request => (
            <StyledRequestCard key={request.id}>
              <Card
                className='request-card'
                onClick={() => handleRequestClick(request)}
                sx={{ position: 'relative' }}
              >
                {/* Selection Checkbox */}
                <Checkbox
                  checked={selectedIds.includes(request.id!)}
                  onChange={e =>
                    handleRequestSelection(request.id!, e.target.checked)
                  }
                  onClick={e => e.stopPropagation()}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 1,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                />

                <CardContent sx={{ pt: 5 }}>
                  <Box className='request-header'>
                    <Typography variant='h6' className='request-id'>
                      {request.trackingId}
                    </Typography>
                    <Box className='request-badges'>
                      <Chip
                        label={request.status.replace('_', ' ')}
                        color={getStatusColor(request.status)}
                        size='small'
                        className='status-chip'
                      />
                      <Chip
                        label={request.priority}
                        color={getPriorityColor(request.priority)}
                        size='small'
                        variant='outlined'
                        className='priority-chip'
                      />
                    </Box>
                  </Box>

                  <Typography variant='h6' sx={{ mb: 1, fontWeight: 'medium' }}>
                    {request.title}
                  </Typography>

                  <Typography
                    variant='body2'
                    className='request-description'
                    sx={{ mb: 2 }}
                  >
                    {request.description}
                  </Typography>

                  <Box className='request-meta' sx={{ mb: 2 }}>
                    <Typography variant='body2' className='request-department'>
                      {request.department} Department
                    </Typography>
                    <Typography
                      variant='body2'
                      className='request-date'
                      sx={{
                        color: isOverdue(request.dueDate, request.status)
                          ? 'error.main'
                          : 'text.secondary',
                      }}
                    >
                      Due: {new Date(request.dueDate).toLocaleDateString()}
                    </Typography>
                    {request.assignedTo && (
                      <Typography variant='body2' color='primary'>
                        Assigned: {request.assignedTo}
                      </Typography>
                    )}
                  </Box>

                  <Box className='request-actions'>
                    <Button
                      variant='primary'
                      size='sm'
                      onClick={e => {
                        e.stopPropagation();
                        handleRequestClick(request);
                      }}
                    >
                      Start Workflow
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </StyledRequestCard>
          ))
        )}
      </StyledRequestsGrid>

      {/* Floating Action Button for New Request */}
      <Fab
        color='primary'
        aria-label='add request'
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => router.push('/request')}
      >
        <AddIcon />
      </Fab>

      {/* Dashboard Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() =>
          setFilters({
            status: [],
            priority: [],
            department: [],
            assignedTo: [],
            dueDateRange: { start: null, end: null },
            overdue: false,
            keywords: '',
          })
        }
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </StyledDashboardContainer>
  );
}

function getStatusColor(
  status: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' {
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
}

function getPriorityColor(
  priority: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'default';
  }
}

function isOverdue(dueDate: string, status: RequestStatus): boolean {
  const now = new Date();
  const due = new Date(dueDate);
  return due < now && status !== 'completed' && status !== 'rejected';
}
