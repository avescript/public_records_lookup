'use client';

import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  FilterList as FilterListIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/core/Button';
import { getAllRequests, StoredRequest } from '@/services/requestService';
import { tokens } from '@/theme/tokens';

import { 
  StyledDashboardHeader, 
  StyledMetricCard, 
  StyledRequestCard, 
  StyledSearchContainer} from './styles';

// Quick stats interface
interface DashboardStats {
  total: number;
  submitted: number;
  processing: number;
  underReview: number;
  completed: number;
  overdue: number;
}

// Request card component for the dashboard
interface RequestCardProps {
  request: StoredRequest;
  onSelect: (request: StoredRequest) => void;
}

function RequestCard({ request, onSelect }: RequestCardProps) {
  const theme = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'info';
      case 'processing': return 'warning';
      case 'under_review': return 'secondary';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <PendingIcon fontSize="small" />;
      case 'processing': return <PlayArrowIcon fontSize="small" />;
      case 'under_review': return <AssignmentIcon fontSize="small" />;
      case 'completed': return <CheckCircleIcon fontSize="small" />;
      case 'rejected': return <WarningIcon fontSize="small" />;
      default: return <PendingIcon fontSize="small" />;
    }
  };

  return (
    <StyledRequestCard onClick={() => onSelect(request)}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 2 }}>
            {request.description || 'Untitled Request'}
          </Typography>
          <Chip
            icon={getStatusIcon(request.status)}
            label={request.status.replace('_', ' ').toUpperCase()}
            color={getStatusColor(request.status) as any}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>Contact:</strong> {request.contactEmail}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>Department:</strong> {request.department || 'Not specified'}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Submitted: {request.submittedAt instanceof Date ? 
            request.submittedAt.toLocaleDateString() : 
            new Date(request.submittedAt.seconds * 1000).toLocaleDateString()}
        </Typography>
      </CardContent>
    </StyledRequestCard>
  );
}

export function V2Dashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    submitted: 0,
    processing: 0,
    underReview: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchQuery]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await getAllRequests();
      setRequests(allRequests);
      calculateStats(allRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requestList: StoredRequest[]) => {
    const stats: DashboardStats = {
      total: requestList.length,
      submitted: 0,
      processing: 0,
      underReview: 0,
      completed: 0,
      overdue: 0,
    };

    requestList.forEach(request => {
      switch (request.status) {
        case 'submitted':
          stats.submitted++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'under_review':
          stats.underReview++;
          break;
        case 'completed':
          stats.completed++;
          break;
      }
    });

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request =>
        request.description?.toLowerCase().includes(query) ||
        request.contactEmail?.toLowerCase().includes(query) ||
        request.department?.toLowerCase().includes(query) ||
        request.title?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleRequestSelect = (request: StoredRequest) => {
    // Navigate to the first step of the V2 workflow
    router.push(`/v2/request/${request.id}/locate` as any);
  };

  const handleNewRequest = () => {
    // Navigate to the original request form for now
    router.push('/request' as any);
  };

  return (
    <Box>
      {/* Header */}
      <StyledDashboardHeader>
        <Box className="header-content">
          <DashboardIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" component="h1" className="header-title">
              Request Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" className="header-subtitle">
              AI-powered guided workflow for public records management
            </Typography>
          </Box>
        </Box>
        <Button
          variant="primary"
          startIcon={<AddIcon />}
          onClick={handleNewRequest}
          size="lg"
        >
          New Request
        </Button>
      </StyledDashboardHeader>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StyledMetricCard>
            <Typography className="metric-value" color="primary.main">
              {stats.total}
            </Typography>
            <Typography className="metric-label">
              Total Requests
            </Typography>
          </StyledMetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledMetricCard>
            <Typography className="metric-value" color="info.main">
              {stats.submitted}
            </Typography>
            <Typography className="metric-label">
              Submitted
            </Typography>
          </StyledMetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledMetricCard>
            <Typography className="metric-value" color="warning.main">
              {stats.processing}
            </Typography>
            <Typography className="metric-label">
              Processing
            </Typography>
          </StyledMetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledMetricCard>
            <Typography className="metric-value" color="secondary.main">
              {stats.underReview}
            </Typography>
            <Typography className="metric-label">
              Under Review
            </Typography>
          </StyledMetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledMetricCard>
            <Typography className="metric-value" color="success.main">
              {stats.completed}
            </Typography>
            <Typography className="metric-label">
              Completed
            </Typography>
          </StyledMetricCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledMetricCard>
            <Typography className="metric-value" color="error.main">
              {stats.overdue}
            </Typography>
            <Typography className="metric-label">
              Overdue
            </Typography>
          </StyledMetricCard>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <StyledSearchContainer>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search requests, requesters, or departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Stack>
      </StyledSearchContainer>

      {/* Request Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading requests...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request.id}>
              <RequestCard request={request} onSelect={handleRequestSelect} />
            </Grid>
          ))}
          {filteredRequests.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {searchQuery ? 'No requests match your search criteria.' : 'No requests found.'}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}