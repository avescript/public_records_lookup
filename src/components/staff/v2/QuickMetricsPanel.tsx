'use client';

import React, { useMemo } from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { differenceInBusinessDays } from 'date-fns';

import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@/components/migration';
import type { StoredRequest } from '@/services/requestService';

interface QuickMetricsPanelProps {
  requests: StoredRequest[];
  sx?: any;
}

/**
 * Quick Metrics Panel
 * Displays key statistics and quick overview of request statuses
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-010 Enhanced Request Dashboard - Quick Metrics Panel
 */
export function QuickMetricsPanel({ requests, sx }: QuickMetricsPanelProps) {
  const metrics = useMemo(() => {
    const now = new Date();

    return {
      total: requests.length,
      open: requests.filter(
        r => r.status === 'submitted' || r.status === 'under_review'
      ).length,
      inProcess: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed').length,
      overdue: requests.filter(r => {
        if (r.status === 'completed' || r.status === 'rejected') return false;
        const daysSinceSubmission = differenceInBusinessDays(
          now,
          r.submittedAt.toDate()
        );
        return daysSinceSubmission > 10; // SLA_DAYS
      }).length,
      dueSoon: requests.filter(r => {
        if (r.status === 'completed' || r.status === 'rejected') return false;
        const daysSinceSubmission = differenceInBusinessDays(
          now,
          r.submittedAt.toDate()
        );
        return daysSinceSubmission >= 7 && daysSinceSubmission <= 10; // Within 3 days of SLA
      }).length,
    };
  }, [requests]);

  const MetricCard = ({
    title,
    value,
    icon,
    color = 'primary',
    subtitle,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
    subtitle?: string;
  }) => (
    <Grid item xs={12} sm={6} md={3} lg={2}>
      <Card variant='outlined' sx={{ height: '100%' }}>
        <CardContent>
          <Stack spacing={1}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Box
                sx={{
                  color: `${color}.main`,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {icon}
              </Box>
              <Typography variant='body2' color='text.secondary'>
                {title}
              </Typography>
            </Stack>
            <Typography variant='h4' component='div'>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant='caption' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box sx={sx}>
      <Grid container spacing={2}>
        <MetricCard
          title='Total Requests'
          value={metrics.total}
          icon={<AssignmentIcon />}
          color='primary'
        />

        <MetricCard
          title='Open'
          value={metrics.open}
          icon={<HourglassIcon />}
          color='info'
          subtitle='Awaiting review'
        />

        <MetricCard
          title='In Process'
          value={metrics.inProcess}
          icon={<HourglassIcon />}
          color='warning'
          subtitle='Being worked on'
        />

        <MetricCard
          title='Completed'
          value={metrics.completed}
          icon={<CheckCircleIcon />}
          color='success'
          subtitle='Delivered to requester'
        />

        <MetricCard
          title='Overdue'
          value={metrics.overdue}
          icon={<WarningIcon />}
          color='error'
          subtitle='Past SLA (10 days)'
        />

        <MetricCard
          title='Due Soon'
          value={metrics.dueSoon}
          icon={<WarningIcon />}
          color='warning'
          subtitle='Within 3 days of SLA'
        />
      </Grid>
    </Box>
  );
}
