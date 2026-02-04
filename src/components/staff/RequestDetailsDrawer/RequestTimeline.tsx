'use client';

import React from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

import { StoredRequest } from '@/services/requestService';

export interface TimelineEvent {
  id: string;
  type:
    | 'submitted'
    | 'status_change'
    | 'comment'
    | 'view'
    | 'assignment'
    | 'match_found';
  title: string;
  description?: string;
  timestamp: Date;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

export interface RequestTimelineProps {
  request: StoredRequest;
}

// Helper function to convert Firebase Timestamp to Date
const convertToDate = (timestamp: any): Date => {
  try {
    if (!timestamp) return new Date();
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp);
    } else {
      return new Date(timestamp);
    }
  } catch (error) {
    return new Date();
  }
};

// Generate mock timeline events based on request data
function generateTimelineEvents(request: StoredRequest): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Submitted event
  events.push({
    id: 'submitted',
    type: 'submitted',
    title: 'Request Submitted',
    description: `Request ${request.trackingId} was submitted for ${request.department}`,
    timestamp: convertToDate(request.submittedAt),
    user: {
      name: request.contactEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .toUpperCase(),
      email: request.contactEmail,
      role: 'Requester',
    },
  });

  // Auto-status changes based on current status
  const statusChangeTime = new Date(
    convertToDate(request.submittedAt).getTime() + 30 * 60000
  ); // 30 mins later
  if (request.status !== 'submitted') {
    events.push({
      id: 'status_processing',
      type: 'status_change',
      title: 'Status Changed',
      description: 'Request moved to Processing status',
      timestamp: statusChangeTime,
      user: {
        name: 'System',
        email: 'system@agency.gov',
        role: 'System',
      },
    });
  }

  // If there are associated records, add AI matching event
  if (request.associatedRecords && request.associatedRecords.length > 0) {
    const matchTime = new Date(statusChangeTime.getTime() + 45 * 60000); // 45 mins after status change
    events.push({
      id: 'ai_match',
      type: 'match_found',
      title: 'AI Matches Found',
      description: `${request.associatedRecords.length} potential records identified`,
      timestamp: matchTime,
      user: {
        name: 'AI Matching System',
        email: 'ai@agency.gov',
        role: 'System',
      },
    });
  }

  // Review activity (if not just submitted)
  if (request.status === 'under_review' || request.status === 'completed') {
    const reviewTime = new Date(statusChangeTime.getTime() + 2 * 3600000); // 2 hours later
    events.push({
      id: 'review_started',
      type: 'assignment',
      title: 'Review Started',
      description: 'Request assigned for staff review',
      timestamp: reviewTime,
      user: {
        name: 'Sarah Johnson',
        email: 'sjohnson@agency.gov',
        role: 'Staff Reviewer',
      },
    });
  }

  // Completion (if completed)
  if (request.status === 'completed') {
    const completeTime = convertToDate(request.updatedAt);
    events.push({
      id: 'completed',
      type: 'status_change',
      title: 'Request Completed',
      description: 'All processing completed and ready for delivery',
      timestamp: completeTime,
      user: {
        name: 'Sarah Johnson',
        email: 'sjohnson@agency.gov',
        role: 'Staff Reviewer',
      },
    });
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function getEventIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'submitted':
      return <EmailIcon />;
    case 'status_change':
      return <EditIcon />;
    case 'comment':
      return <CommentIcon />;
    case 'view':
      return <ViewIcon />;
    case 'assignment':
      return <AssignmentIcon />;
    case 'match_found':
      return <SearchIcon />;
    default:
      return <PersonIcon />;
  }
}

function getEventColor(
  type: TimelineEvent['type']
): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' {
  switch (type) {
    case 'submitted':
      return 'info';
    case 'status_change':
      return 'primary';
    case 'comment':
      return 'secondary';
    case 'view':
      return 'info';
    case 'assignment':
      return 'warning';
    case 'match_found':
      return 'success';
    default:
      return 'primary';
  }
}

export function RequestTimeline({ request }: RequestTimelineProps) {
  const events = generateTimelineEvents(request);

  const formatTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatTime(date);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant='h6'
          sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
        >
          <AssignmentIcon sx={{ mr: 1 }} />
          Request Timeline
        </Typography>

        <List sx={{ width: '100%' }}>
          {events.map((event, index) => (
            <React.Fragment key={event.id}>
              <ListItem alignItems='flex-start' sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${getEventColor(event.type)}.main`,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getEventIcon(event.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'medium' }}
                      >
                        {event.title}
                      </Typography>
                      <Chip
                        size='small'
                        label={formatRelativeTime(event.timestamp)}
                        variant='outlined'
                        color={getEventColor(event.type)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      {event.description && (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mt: 0.5 }}
                        >
                          {event.description}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        {event.user && (
                          <>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              by {event.user.name}
                            </Typography>
                            <Chip
                              size='small'
                              label={event.user.role}
                              variant='outlined'
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {formatTime(event.timestamp)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < events.length - 1 && (
                <Divider variant='inset' component='li' />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
