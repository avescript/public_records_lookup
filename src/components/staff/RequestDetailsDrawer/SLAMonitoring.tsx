'use client';

import React from 'react';
import {
  AlarmOn as AlarmIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';

import { RequestStatus, StoredRequest } from '@/services/requestService';

export interface SLAConfig {
  department: string;
  standardDays: number;
  expediteDays: number;
  complexDays: number;
}

export interface SLAStatus {
  dueDate: Date;
  remainingDays: number;
  remainingHours: number;
  percentComplete: number;
  status: 'on-track' | 'at-risk' | 'overdue' | 'completed';
  isExpedited: boolean;
  isComplex: boolean;
  warningThresholdDays: number;
}

export interface SLAMonitoringProps {
  request: StoredRequest;
  slaConfig?: SLAConfig;
  customDueDate?: Date;
}

// Default SLA configurations by department
const defaultSLAConfigs: Record<string, SLAConfig> = {
  Police: {
    department: 'Police',
    standardDays: 5,
    expediteDays: 2,
    complexDays: 10,
  },
  Transportation: {
    department: 'Transportation',
    standardDays: 7,
    expediteDays: 3,
    complexDays: 14,
  },
  Planning: {
    department: 'Planning',
    standardDays: 10,
    expediteDays: 5,
    complexDays: 21,
  },
  'Public Works': {
    department: 'Public Works',
    standardDays: 7,
    expediteDays: 3,
    complexDays: 14,
  },
  'Fire Department': {
    department: 'Fire Department',
    standardDays: 5,
    expediteDays: 2,
    complexDays: 10,
  },
  'Parks & Recreation': {
    department: 'Parks & Recreation',
    standardDays: 7,
    expediteDays: 3,
    complexDays: 14,
  },
  Finance: {
    department: 'Finance',
    standardDays: 10,
    expediteDays: 5,
    complexDays: 21,
  },
  'Human Resources': {
    department: 'Human Resources',
    standardDays: 10,
    expediteDays: 5,
    complexDays: 21,
  },
};

// Helper function to determine if request is complex (based on description keywords)
function isComplexRequest(request: StoredRequest): boolean {
  const complexKeywords = [
    'multiple',
    'years',
    'extensive',
    'detailed',
    'comprehensive',
    'all',
    'entire',
    'complete',
  ];
  const description = request.description.toLowerCase();
  return complexKeywords.some(keyword => description.includes(keyword));
}

// Helper function to determine if request is expedited (based on description keywords)
function isExpeditedRequest(request: StoredRequest): boolean {
  const expediteKeywords = [
    'urgent',
    'emergency',
    'asap',
    'immediately',
    'critical',
    'time-sensitive',
  ];
  const description = request.description.toLowerCase();
  return expediteKeywords.some(keyword => description.includes(keyword));
}

// Calculate SLA status
function calculateSLAStatus(
  request: StoredRequest,
  slaConfig: SLAConfig,
  customDueDate?: Date
): SLAStatus {
  const now = new Date();
  const submittedDate = request.submittedAt.toDate();

  const isExpedited = isExpeditedRequest(request);
  const isComplex = isComplexRequest(request);

  let slaDays: number;
  if (isExpedited) {
    slaDays = slaConfig.expediteDays;
  } else if (isComplex) {
    slaDays = slaConfig.complexDays;
  } else {
    slaDays = slaConfig.standardDays;
  }

  const dueDate =
    customDueDate ||
    new Date(submittedDate.getTime() + slaDays * 24 * 60 * 60 * 1000);
  const totalTimeMs = dueDate.getTime() - submittedDate.getTime();
  const elapsedTimeMs = now.getTime() - submittedDate.getTime();
  const remainingTimeMs = dueDate.getTime() - now.getTime();

  const remainingDays = Math.ceil(remainingTimeMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.ceil(remainingTimeMs / (60 * 60 * 1000));
  const percentComplete = Math.min(
    100,
    Math.max(0, (elapsedTimeMs / totalTimeMs) * 100)
  );

  const warningThresholdDays = Math.max(1, Math.floor(slaDays * 0.2)); // 20% of SLA time

  let status: SLAStatus['status'];
  if (request.status === 'completed') {
    status = 'completed';
  } else if (remainingDays < 0) {
    status = 'overdue';
  } else if (remainingDays <= warningThresholdDays) {
    status = 'at-risk';
  } else {
    status = 'on-track';
  }

  return {
    dueDate,
    remainingDays,
    remainingHours,
    percentComplete,
    status,
    isExpedited,
    isComplex,
    warningThresholdDays,
  };
}

function getStatusIcon(status: SLAStatus['status']) {
  switch (status) {
    case 'completed':
      return <CompletedIcon />;
    case 'overdue':
      return <AlarmIcon />;
    case 'at-risk':
      return <WarningIcon />;
    default:
      return <ScheduleIcon />;
  }
}

function getStatusColor(
  status: SLAStatus['status']
): 'success' | 'error' | 'warning' | 'info' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'overdue':
      return 'error';
    case 'at-risk':
      return 'warning';
    default:
      return 'info';
  }
}

function getProgressColor(
  status: SLAStatus['status']
): 'primary' | 'error' | 'warning' | 'success' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'overdue':
      return 'error';
    case 'at-risk':
      return 'warning';
    default:
      return 'primary';
  }
}

export function SLAMonitoring({
  request,
  slaConfig,
  customDueDate,
}: SLAMonitoringProps) {
  const config =
    slaConfig ||
    defaultSLAConfigs[request.department] ||
    defaultSLAConfigs['Police'];
  const slaStatus = calculateSLAStatus(request, config, customDueDate);

  const formatTimeRemaining = () => {
    if (slaStatus.status === 'completed') {
      return 'Completed';
    } else if (slaStatus.status === 'overdue') {
      return `Overdue by ${Math.abs(slaStatus.remainingDays)} day${Math.abs(slaStatus.remainingDays) !== 1 ? 's' : ''}`;
    } else if (slaStatus.remainingDays > 0) {
      return `${slaStatus.remainingDays} day${slaStatus.remainingDays !== 1 ? 's' : ''} remaining`;
    } else if (slaStatus.remainingHours > 0) {
      return `${slaStatus.remainingHours} hour${slaStatus.remainingHours !== 1 ? 's' : ''} remaining`;
    } else {
      return 'Due now';
    }
  };

  const getSLAMessage = () => {
    switch (slaStatus.status) {
      case 'completed':
        return 'Request completed within SLA timeframe';
      case 'overdue':
        return 'Request is overdue and requires immediate attention';
      case 'at-risk':
        return 'Request is approaching due date and may need priority handling';
      default:
        return 'Request is on track to meet SLA requirements';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant='h6'
          sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
        >
          {getStatusIcon(slaStatus.status)}
          <Box sx={{ ml: 1 }}>SLA Monitoring</Box>
        </Typography>

        {/* SLA Status Alert */}
        {slaStatus.status !== 'on-track' && (
          <Alert
            severity={getStatusColor(slaStatus.status)}
            sx={{ mb: 2 }}
            icon={getStatusIcon(slaStatus.status)}
          >
            {getSLAMessage()}
          </Alert>
        )}

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              Time Progress
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {Math.round(slaStatus.percentComplete)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={Math.min(100, slaStatus.percentComplete)}
            color={getProgressColor(slaStatus.status)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* SLA Details */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant='caption' color='text.secondary'>
              Due Date
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
              {slaStatus.dueDate.toLocaleDateString()} at{' '}
              {slaStatus.dueDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
          <Box>
            <Typography variant='caption' color='text.secondary'>
              Time Remaining
            </Typography>
            <Typography
              variant='body2'
              sx={{
                fontWeight: 'medium',
                color:
                  slaStatus.status === 'overdue'
                    ? 'error.main'
                    : slaStatus.status === 'at-risk'
                      ? 'warning.main'
                      : 'text.primary',
              }}
            >
              {formatTimeRemaining()}
            </Typography>
          </Box>
        </Box>

        {/* SLA Type Indicators */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={`${request.department} SLA: ${
              slaStatus.isExpedited
                ? `${config.expediteDays} days`
                : slaStatus.isComplex
                  ? `${config.complexDays} days`
                  : `${config.standardDays} days`
            }`}
            size='small'
            variant='outlined'
            color='info'
          />

          {slaStatus.isExpedited && (
            <Chip
              label='Expedited'
              size='small'
              color='error'
              icon={<AlarmIcon />}
            />
          )}

          {slaStatus.isComplex && (
            <Chip
              label='Complex Request'
              size='small'
              color='warning'
              variant='outlined'
            />
          )}

          <Chip
            label={`Status: ${slaStatus.status.replace('-', ' ').toUpperCase()}`}
            size='small'
            color={getStatusColor(slaStatus.status)}
            variant={slaStatus.status === 'on-track' ? 'outlined' : 'filled'}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
