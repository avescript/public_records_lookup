'use client';

import React from 'react';
import {
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { differenceInBusinessDays, format } from 'date-fns';

import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@/components/migration';
import type { StoredRequest } from '@/services/requestService';

interface RequestGridProps {
  requests: StoredRequest[];
  loading: boolean;
  selectedIds: string[];
  onRequestClick: (request: StoredRequest) => void;
  onSelectionChange: (selectedIds: string[]) => void;
}

/**
 * Request Grid Component
 * Modern card-based layout for displaying requests
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-010 Enhanced Request Dashboard - Request Cards Layout
 */
export function RequestGrid({
  requests,
  loading,
  selectedIds,
  onRequestClick,
  onSelectionChange,
}: RequestGridProps) {
  const handleSelect = (requestId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, requestId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== requestId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(
        requests.map(r => r.id).filter((id): id is string => id !== undefined)
      );
    } else {
      onSelectionChange([]);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary' gutterBottom>
          No requests found
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Try adjusting your filters or search query
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Select All */}
      {requests.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Checkbox
            checked={
              selectedIds.length === requests.length && requests.length > 0
            }
            indeterminate={
              selectedIds.length > 0 && selectedIds.length < requests.length
            }
            onChange={e => handleSelectAll(e.target.checked)}
          />
          <Typography variant='caption' component='span' sx={{ ml: 1 }}>
            Select All
          </Typography>
        </Box>
      )}

      {/* Request Cards Grid */}
      <Grid container spacing={2}>
        {requests.map(
          request =>
            request.id && (
              <Grid item xs={12} sm={6} md={4} lg={3} key={request.id}>
                <RequestCard
                  request={request}
                  selected={selectedIds.includes(request.id)}
                  onSelect={checked => handleSelect(request.id!, checked)}
                  onClick={() => onRequestClick(request)}
                />
              </Grid>
            )
        )}
      </Grid>
    </Box>
  );
}

/**
 * Individual Request Card Component
 */
interface RequestCardProps {
  request: StoredRequest;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
}

function RequestCard({
  request,
  selected,
  onSelect,
  onClick,
}: RequestCardProps) {
  const daysSinceSubmission = differenceInBusinessDays(
    new Date(),
    request.submittedAt.toDate()
  );
  const isOverdue =
    daysSinceSubmission > 10 &&
    request.status !== 'completed' &&
    request.status !== 'rejected';
  const isDueSoon =
    daysSinceSubmission >= 7 &&
    daysSinceSubmission <= 10 &&
    request.status !== 'completed' &&
    request.status !== 'rejected';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'info';
      case 'under_review':
        return 'primary';
      case 'processing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
        ...(selected && {
          borderColor: 'primary.main',
          bgcolor: 'action.selected',
        }),
      }}
    >
      {/* Selection Checkbox */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
        <Checkbox
          checked={selected}
          onChange={e => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          size='small'
        />
      </Box>

      <CardContent onClick={onClick}>
        {/* Header */}
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='flex-start'
          sx={{ mb: 2 }}
        >
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography variant='caption' color='text.secondary'>
              {request.id}
            </Typography>
            <Typography
              variant='h6'
              component='div'
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {request.title}
            </Typography>
          </Box>
          <IconButton size='small' onClick={onClick}>
            <ArrowForwardIcon />
          </IconButton>
        </Stack>

        {/* Description */}
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            flex: 1,
          }}
        >
          {request.description}
        </Typography>

        {/* Status & Urgency */}
        <Stack direction='row' spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={request.status}
            color={getStatusColor(request.status) as any}
            size='small'
          />
          {isOverdue && <Chip label='Overdue' color='error' size='small' />}
          {isDueSoon && <Chip label='Due Soon' color='warning' size='small' />}
        </Stack>

        {/* Footer Info */}
        <Stack spacing={0.5}>
          <Stack direction='row' alignItems='center' spacing={0.5}>
            <PersonIcon sx={{ fontSize: 16, color: 'action.active' }} />
            <Typography variant='caption' color='text.secondary'>
              {request.contactEmail}
            </Typography>
          </Stack>
          <Stack direction='row' alignItems='center' spacing={0.5}>
            <ScheduleIcon sx={{ fontSize: 16, color: 'action.active' }} />
            <Typography variant='caption' color='text.secondary'>
              {format(request.submittedAt.toDate(), 'MMM d, yyyy')}
              {' • '}
              {daysSinceSubmission} day{daysSinceSubmission !== 1 ? 's' : ''}{' '}
              ago
            </Typography>
          </Stack>
          {request.department && (
            <Typography variant='caption' color='text.secondary'>
              {request.department}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
