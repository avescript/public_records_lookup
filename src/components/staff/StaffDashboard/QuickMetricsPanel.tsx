'use client';

import React, { useMemo } from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  Pending as PendingIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { addBusinessDays, differenceInBusinessDays, format } from 'date-fns';

import { useAgency } from '../../../contexts/AgencyContext';
import { StoredRequest } from '../../../services/requestService';

interface QuickMetricsPanelProps {
  requests: StoredRequest[];
  loading?: boolean;
}

interface MetricCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// SLA Configuration (in business days)
const SLA_DAYS = 10;
const DUE_SOON_THRESHOLD = 3;

export const QuickMetricsPanel: React.FC<QuickMetricsPanelProps> = ({
  requests,
  loading = false,
}) => {
  const theme = useTheme();
  const { currentAgency } = useAgency();

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
      return { status: 'overdue', daysUntilDue: Math.abs(daysUntilDue) };
    } else if (daysUntilDue <= DUE_SOON_THRESHOLD) {
      return { status: 'due-soon', daysUntilDue };
    } else {
      return { status: 'on-time', daysUntilDue };
    }
  };

  const metrics = useMemo(() => {
    const total = requests.length;
    const statusCounts = {
      submitted: requests.filter(r => r.status === 'submitted').length,
      processing: requests.filter(r => r.status === 'processing').length,
      under_review: requests.filter(r => r.status === 'under_review').length,
      completed: requests.filter(r => r.status === 'completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };

    const assignedToMe = requests.filter(
      r => r.assignedTo === 'current-user-id'
    ).length; // TODO: Replace with actual user ID logic

    // Due date analysis
    const dueDateAnalysis = requests.map(r => ({
      ...r,
      dueStatus: getDueDateStatus(r.submittedAt),
    }));

    const overdue = dueDateAnalysis.filter(
      r => r.dueStatus.status === 'overdue'
    ).length;
    const dueSoon = dueDateAnalysis.filter(
      r => r.dueStatus.status === 'due-soon'
    ).length;

    const pendingApprovals = requests.filter(
      r => r.status === 'under_review'
    ).length;

    // Calculate completion rate
    const completionRate =
      total > 0 ? (statusCounts.completed / total) * 100 : 0;

    const metricCards: MetricCard[] = [
      {
        title: 'Total Requests',
        value: total,
        icon: <AssignmentIcon />,
        color: theme.palette.primary.main,
      },
      {
        title: 'In Processing',
        value: statusCounts.processing,
        icon: <HourglassIcon />,
        color: theme.palette.info.main,
      },
      {
        title: 'Assigned to Me',
        value: assignedToMe,
        icon: <AssignmentIcon />,
        color: theme.palette.secondary.main,
      },
      {
        title: 'Overdue',
        value: overdue,
        icon: <ErrorIcon />,
        color: theme.palette.error.main,
      },
      {
        title: 'Due Soon',
        value: dueSoon,
        icon: <WarningIcon />,
        color: theme.palette.warning.main,
      },
      {
        title: 'Pending Approvals',
        value: pendingApprovals,
        icon: <PendingIcon />,
        color: theme.palette.warning.main,
      },
      {
        title: 'Completed',
        value: statusCounts.completed,
        icon: <CheckCircleIcon />,
        color: theme.palette.success.main,
      },
    ];

    return {
      cards: metricCards,
      statusCounts,
      completionRate,
      overdue,
      dueSoon,
      recentActivity: dueDateAnalysis
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        )
        .slice(0, 5),
    };
  }, [requests, theme, getDueDateStatus]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
            <Typography variant='body2' sx={{ mt: 1 }}>
              Loading metrics...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <TimelineIcon color='primary' />
          Quick Metrics
          {currentAgency && (
            <Chip
              label={currentAgency.name}
              size='small'
              color='primary'
              variant='outlined'
            />
          )}
        </Typography>

        {/* Metric Cards Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {metrics.cards.map((metric, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card
                variant='outlined'
                sx={{
                  height: '100%',
                  bgcolor: alpha(metric.color, 0.05),
                  borderColor: alpha(metric.color, 0.2),
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='space-between'
                    mb={1}
                  >
                    <Box sx={{ color: metric.color }}>{metric.icon}</Box>
                    <Typography
                      variant='h4'
                      sx={{
                        color: metric.color,
                        fontWeight: 'bold',
                        fontSize: metric.value > 999 ? '1.5rem' : '2rem',
                      }}
                    >
                      {metric.value}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {metric.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Completion Rate */}
        <Box sx={{ mb: 3 }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mb={1}
          >
            <Typography variant='body2' color='text.secondary'>
              Completion Rate
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {metrics.completionRate.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={metrics.completionRate}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: theme.palette.success.main,
              },
            }}
          />
        </Box>

        {/* Recent Activity */}
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            Recent Activity
          </Typography>
          <List dense>
            {metrics.recentActivity.map((request, index) => (
              <ListItem
                key={request.id}
                sx={{
                  px: 0,
                  borderLeft: '3px solid',
                  borderLeftColor:
                    request.dueStatus.status === 'overdue'
                      ? 'error.main'
                      : request.dueStatus.status === 'due-soon'
                        ? 'warning.main'
                        : 'success.main',
                  pl: 1,
                  mb: 0.5,
                  bgcolor: alpha(
                    request.dueStatus.status === 'overdue'
                      ? theme.palette.error.main
                      : request.dueStatus.status === 'due-soon'
                        ? theme.palette.warning.main
                        : theme.palette.success.main,
                    0.03
                  ),
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {request.dueStatus.status === 'overdue' ? (
                    <ErrorIcon color='error' fontSize='small' />
                  ) : request.dueStatus.status === 'due-soon' ? (
                    <WarningIcon color='warning' fontSize='small' />
                  ) : (
                    <CheckCircleIcon color='success' fontSize='small' />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant='body2' noWrap>
                      {request.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant='caption' color='text.secondary'>
                      {request.trackingId} • {formatDate(request.submittedAt)}
                      {request.dueStatus.status === 'overdue' && (
                        <Chip
                          label={`${request.dueStatus.daysUntilDue}d overdue`}
                          size='small'
                          color='error'
                          sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                        />
                      )}
                      {request.dueStatus.status === 'due-soon' && (
                        <Chip
                          label={`${request.dueStatus.daysUntilDue}d left`}
                          size='small'
                          color='warning'
                          sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                        />
                      )}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {metrics.recentActivity.length === 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      style={{ fontStyle: 'italic' }}
                    >
                      No recent activity
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper function for alpha color blending
function alpha(color: string, value: number): string {
  // Simple alpha implementation for the theme colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${value})`;
  }
  return `${color}${Math.round(value * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
