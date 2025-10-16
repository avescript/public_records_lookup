'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/core/Button';
import { StaffDashboard } from '@/components/staff/StaffDashboard';
import { StoredRequest } from '@/services/requestService';

import {
  StyledDashboardContainer,
  StyledDashboardHeader,
  StyledMetricsContainer,
  StyledMetricCard,
  StyledControlsContainer,
  StyledRequestsGrid,
  StyledRequestCard,
} from './EnhancedDashboard.styles';

export interface EnhancedDashboardProps {
  onRequestSelect: (request: StoredRequest) => void;
}

// Mock metrics for demonstration
const mockMetrics = {
  totalRequests: 147,
  pendingRequests: 23,
  completedToday: 8,
  avgResponseTime: '2.3 days',
};

// Extended StoredRequest interface for display purposes
interface ExtendedStoredRequest extends StoredRequest {
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

// Mock timestamp for demonstration
const mockTimestamp = new Date() as any;

// Mock requests for card view
const mockRequests: ExtendedStoredRequest[] = [
  {
    id: 'req-001',
    trackingId: 'REQ-2024-001',
    title: 'Traffic Safety Reports Request',
    description: 'Traffic safety reports for downtown district',
    department: 'Transportation',
    dateRange: {
      startDate: '2023-12-01',
      endDate: '2024-01-01',
    },
    status: 'submitted' as const,
    submittedAt: mockTimestamp,
    updatedAt: mockTimestamp,
    attachmentCount: 0,
    dueDate: '2024-01-29',
    priority: 'high',
    contactEmail: 'citizen@example.com',
  },
  {
    id: 'req-002',
    trackingId: 'REQ-2024-002',
    title: 'Police Incident Reports Request',
    description: 'Police incident reports from December 2023',
    department: 'Police',
    dateRange: {
      startDate: '2023-12-01',
      endDate: '2023-12-31',
    },
    status: 'processing' as const,
    submittedAt: mockTimestamp,
    updatedAt: mockTimestamp,
    attachmentCount: 0,
    dueDate: '2024-01-28',
    priority: 'medium',
    contactEmail: 'reporter@news.com',
  },
  // Add more mock requests as needed
];

function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'info';
    case 'completed': return 'success';
    case 'rejected': return 'error';
    default: return 'default';
  }
}

function getPriorityColor(priority: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'default';
  }
}

export function EnhancedDashboard({ onRequestSelect }: EnhancedDashboardProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'cards' | 'table' | null,
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

  const filteredRequests = mockRequests.filter(request =>
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewMode === 'table') {
    return <StaffDashboard onRequestSelect={onRequestSelect} />;
  }

  return (
    <StyledDashboardContainer>
      <StyledDashboardHeader>
        <Box className="header-content">
          <Typography variant="h4" component="h1" className="page-title">
            Staff Dashboard
          </Typography>
          <Typography variant="body1" className="page-subtitle">
            Manage public records requests with guided workflows
          </Typography>
        </Box>

        <StyledControlsContainer>
          <Box className="search-section">
            <TextField
              placeholder="Search requests..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon className="search-icon" />,
              }}
              className="search-field"
            />
            <IconButton className="filter-button">
              <FilterIcon />
            </IconButton>
          </Box>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            className="view-toggle"
          >
            <ToggleButton value="cards" className="toggle-button">
              <CardViewIcon />
              Cards
            </ToggleButton>
            <ToggleButton value="table" className="toggle-button">
              <TableViewIcon />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </StyledControlsContainer>
      </StyledDashboardHeader>

      {/* Metrics Cards */}
      <StyledMetricsContainer>
        <StyledMetricCard>
          <Card className="metric-card">
            <CardContent>
              <Typography className="metric-value">{mockMetrics.totalRequests}</Typography>
              <Typography className="metric-label">Total Requests</Typography>
            </CardContent>
          </Card>
        </StyledMetricCard>

        <StyledMetricCard>
          <Card className="metric-card">
            <CardContent>
              <Typography className="metric-value">{mockMetrics.pendingRequests}</Typography>
              <Typography className="metric-label">Pending Review</Typography>
            </CardContent>
          </Card>
        </StyledMetricCard>

        <StyledMetricCard>
          <Card className="metric-card">
            <CardContent>
              <Typography className="metric-value">{mockMetrics.completedToday}</Typography>
              <Typography className="metric-label">Completed Today</Typography>
            </CardContent>
          </Card>
        </StyledMetricCard>

        <StyledMetricCard>
          <Card className="metric-card">
            <CardContent>
              <Typography className="metric-value">{mockMetrics.avgResponseTime}</Typography>
              <Typography className="metric-label">Avg Response Time</Typography>
            </CardContent>
          </Card>
        </StyledMetricCard>
      </StyledMetricsContainer>

      {/* Requests Grid */}
      <StyledRequestsGrid>
        {filteredRequests.map((request) => (
          <StyledRequestCard key={request.id}>
            <Card className="request-card" onClick={() => handleRequestClick(request)}>
              <CardContent>
                <Box className="request-header">
                  <Typography variant="h6" className="request-id">
                    {request.trackingId}
                  </Typography>
                  <Box className="request-badges">
                    <Chip
                      label={request.status.replace('_', ' ')}
                      color={getStatusColor(request.status)}
                      size="small"
                      className="status-chip"
                    />
                    <Chip
                      label={request.priority}
                      color={getPriorityColor(request.priority)}
                      size="small"
                      variant="outlined"
                      className="priority-chip"
                    />
                  </Box>
                </Box>

                <Typography variant="body1" className="request-description">
                  {request.description}
                </Typography>

                <Box className="request-meta">
                  <Typography variant="body2" className="request-department">
                    {request.department} Department
                  </Typography>
                  <Typography variant="body2" className="request-date">
                    Due: {new Date(request.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box className="request-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
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
        ))}
      </StyledRequestsGrid>
    </StyledDashboardContainer>
  );
}