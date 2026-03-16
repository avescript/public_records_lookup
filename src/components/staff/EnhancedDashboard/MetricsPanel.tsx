'use client';

import React, { useEffect, useState } from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

import { RequestStatus, StoredRequest } from '@/services/requestService';

export interface DashboardMetrics {
  totalRequests: number;
  pendingRequests: number;
  completedToday: number;
  overdueRequests: number;
  avgResponseTime: string;
  assignedToMe: number;
  pendingApprovals: number;
  statusDistribution: Record<RequestStatus, number>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'updated' | 'completed' | 'assigned';
    requestId: string;
    title: string;
    timestamp: Date;
    user?: string;
  }>;
}

export interface MetricsPanelProps {
  requests: StoredRequest[];
  currentUserId?: string;
  refreshInterval?: number;
}

// Helper function to calculate metrics from requests data
function calculateMetrics(
  requests: StoredRequest[],
  currentUserId?: string
): DashboardMetrics {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Status distribution
  const statusDistribution: Record<RequestStatus, number> = {
    submitted: 0,
    processing: 0,
    under_review: 0,
    completed: 0,
    rejected: 0,
  };

  let completedToday = 0;
  let overdueRequests = 0;
  let assignedToMe = 0;

  requests.forEach(request => {
    // Count by status
    statusDistribution[request.status]++;

    // Completed today
    if (request.status === 'completed' && request.updatedAt.toDate() >= today) {
      completedToday++;
    }

    // Check if overdue (mock due date logic)
    const dueDate = new Date(request.submittedAt.toDate());
    dueDate.setDate(dueDate.getDate() + 5); // Assume 5 day SLA
    if (
      now > dueDate &&
      request.status !== 'completed' &&
      request.status !== 'rejected'
    ) {
      overdueRequests++;
    }

    // TODO: Implement proper assignment system
    // For now, assume some requests are assigned to current user
    if (currentUserId && Math.random() > 0.7) {
      // Mock assignment
      assignedToMe++;
    }
  });

  // Calculate average response time (mock calculation)
  const avgResponseDays = requests.length > 0 ? 2.3 : 0;
  const avgResponseTime = `${avgResponseDays} days`;

  // Generate recent activity (mock data based on actual requests)
  const recentActivity = requests
    .slice(0, 5)
    .map(request => ({
      id: request.id || 'unknown',
      type: 'created' as const,
      requestId: request.trackingId,
      title: request.title,
      timestamp: request.submittedAt.toDate(),
      user: 'System',
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    totalRequests: requests.length,
    pendingRequests:
      statusDistribution.submitted + statusDistribution.processing,
    completedToday,
    overdueRequests,
    avgResponseTime,
    assignedToMe,
    pendingApprovals: statusDistribution.under_review,
    statusDistribution,
    recentActivity,
  };
}

export function MetricsPanel({
  requests,
  currentUserId,
  refreshInterval = 30000,
}: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setLoading(true);
      const newMetrics = calculateMetrics(requests, currentUserId);
      setMetrics(newMetrics);
      setLoading(false);
    };

    updateMetrics();

    // Set up refresh interval if specified
    let interval: NodeJS.Timeout;
    if (refreshInterval > 0) {
      interval = setInterval(updateMetrics, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requests, currentUserId, refreshInterval]);

  if (loading || !metrics) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent>
              <LinearProgress />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'submitted':
        return '#f57c00';
      case 'processing':
        return '#1976d2';
      case 'under_review':
        return '#9c27b0';
      case 'completed':
        return '#388e3c';
      case 'rejected':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Primary Metrics Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 2,
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <AssignmentIcon
              sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
            />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              {metrics.totalRequests}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Requests
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <HourglassIcon
              sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
            />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              {metrics.pendingRequests}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Pending Review
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CompletedIcon
              sx={{ fontSize: 40, color: 'success.main', mb: 1 }}
            />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              {metrics.completedToday}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Completed Today
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              {metrics.avgResponseTime}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Avg Response Time
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Secondary Metrics Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 2,
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold', color: 'error.main' }}
            >
              {metrics.overdueRequests}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Overdue Requests
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon
              sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }}
            />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              {metrics.assignedToMe}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Assigned to Me
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography
              variant='h3'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              {metrics.pendingApprovals}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Pending Approvals
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography
              variant='h6'
              sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
            >
              <TimelineIcon sx={{ mr: 1 }} />
              Status Distribution
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(metrics.statusDistribution).map(
                ([status, count]) =>
                  count > 0 && (
                    <Chip
                      key={status}
                      label={`${status.replace('_', ' ')}: ${count}`}
                      size='small'
                      sx={{
                        backgroundColor: getStatusColor(
                          status as RequestStatus
                        ),
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  )
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Activity Timeline */}
      <Card>
        <CardContent>
          <Typography
            variant='h6'
            sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
          >
            <TimelineIcon sx={{ mr: 1 }} />
            Recent Activity
          </Typography>
          {metrics.recentActivity.length > 0 ? (
            <List dense>
              {metrics.recentActivity.map((activity, index) => (
                <ListItem
                  key={activity.id}
                  divider={index < metrics.recentActivity.length - 1}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <AssignmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <Box>
                        <Typography variant='caption' component='span'>
                          {activity.requestId} • {activity.type} •{' '}
                          {formatTimeAgo(activity.timestamp)}
                        </Typography>
                        {activity.user && (
                          <Typography
                            variant='caption'
                            component='span'
                            sx={{ ml: 1 }}
                          >
                            by {activity.user}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ textAlign: 'center', py: 2 }}
            >
              No recent activity to display
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
