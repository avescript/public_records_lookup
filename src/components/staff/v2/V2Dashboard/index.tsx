'use client';

import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@/components/migration';
import { useAgency } from '@/contexts/AgencyContext';
import { getAllRequests, type StoredRequest } from '@/services/requestService';

import { QuickMetricsPanel } from '../QuickMetricsPanel';
import { RequestFilters } from '../RequestFilters';
import { RequestGrid } from '../RequestGrid';

/**
 * V2 Enhanced Request Dashboard
 *
 * Features:
 * - Quick metrics panel with key stats
 * - Advanced filtering and search
 * - Modern card-based layout
 * - Bulk operations support
 * - Quick actions for common tasks
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-010 Enhanced Request Dashboard
 */
export function V2Dashboard() {
  const router = useRouter();
  const { currentAgency } = useAgency();

  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    statuses: [] as string[],
    departments: [] as string[],
    dateRange: { start: null as Date | null, end: null as Date | null },
    priority: [] as string[],
    assignedTo: [] as string[],
  });

  // Load requests
  useEffect(() => {
    loadRequests();
  }, [currentAgency]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const allRequests = await getAllRequests();

      // Filter by current agency
      const agencyRequests = currentAgency
        ? allRequests.filter(r => r.agency === currentAgency.id)
        : allRequests;

      setRequests(agencyRequests);
      setFilteredRequests(agencyRequests);
    } catch (err) {
      setError('Failed to load requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...requests];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          (r.id && r.id.toLowerCase().includes(query)) ||
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.contactEmail.toLowerCase().includes(query) ||
          r.trackingId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(r => filters.statuses.includes(r.status));
    }

    // Department filter
    if (filters.departments.length > 0) {
      filtered = filtered.filter(r =>
        filters.departments.includes(r.department || '')
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(
        r => r.submittedAt.toDate() >= filters.dateRange.start!
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(
        r => r.submittedAt.toDate() <= filters.dateRange.end!
      );
    }

    // Priority filter (future enhancement)
    // Assigned to filter (future enhancement)

    setFilteredRequests(filtered);
  }, [requests, searchQuery, filters]);

  const handleRequestClick = (request: StoredRequest) => {
    router.push(`/staff/v2/${request.id}`);
  };

  const handleNewRequest = () => {
    router.push('/request/new');
  };

  const handleRefresh = () => {
    loadRequests();
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedRequestIds(selectedIds);
  };

  return (
    <Box>
      {/* Quick Metrics */}
      <QuickMetricsPanel requests={requests} sx={{ mb: 3 }} />

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        {/* Toolbar */}
        <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size='sm'
            placeholder='Search requests by ID, title, description, or requester...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
          />

          <Tooltip title='Filters'>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title='Refresh'>
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleNewRequest}
          >
            New Request
          </Button>
        </Stack>

        {/* Filters Panel */}
        {showFilters && (
          <Box sx={{ mb: 3 }}>
            <RequestFilters
              filters={filters}
              requests={requests}
              onChange={handleFiltersChange}
            />
          </Box>
        )}

        {/* Results Summary */}
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Showing {filteredRequests.length} of {requests.length} requests
          {selectedRequestIds.length > 0 &&
            ` (${selectedRequestIds.length} selected)`}
        </Typography>

        {/* Error State */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Request Grid */}
        <RequestGrid
          requests={filteredRequests}
          loading={loading}
          selectedIds={selectedRequestIds}
          onRequestClick={handleRequestClick}
          onSelectionChange={handleSelectionChange}
        />
      </Paper>
    </Box>
  );
}
