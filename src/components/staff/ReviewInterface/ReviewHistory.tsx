/**
 * ReviewHistory - Comprehensive audit trail and review history
 * Part of ReviewInterface - Step 4 of V2 Workflow
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Comment as CommentIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  Typography,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';

import {
  ApprovalRequest,
  ApprovalStatus,
  ReviewChange,
  ReviewSession,
} from '@/types/review';

interface ReviewHistoryProps {
  requestId: string;
  approvalRequests: ApprovalRequest[];
  reviewSession: ReviewSession | null;
}

interface ActivityEvent {
  id: string;
  type: 'approval' | 'comment' | 'edit' | 'system' | 'delivery';
  timestamp: Date;
  actor: string;
  description: string;
  details?: any;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export function ReviewHistory({
  requestId,
  approvalRequests,
  reviewSession,
}: ReviewHistoryProps) {
  const [activityHistory, setActivityHistory] = useState<ActivityEvent[]>([]);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'recent',
  ]);

  useEffect(() => {
    loadActivityHistory();
  }, [requestId, approvalRequests, reviewSession, loadActivityHistory]);

  const loadActivityHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);

      // Convert approval requests to activity events
      const approvalEvents: ActivityEvent[] = approvalRequests.map(
        approval => ({
          id: `approval-${approval.id}`,
          type: 'approval',
          timestamp: approval.reviewedAt
            ? new Date(approval.reviewedAt)
            : new Date(approval.submittedAt),
          actor: approval.approverName,
          description: getApprovalDescription(approval),
          details: approval,
          icon: getApprovalIcon(approval.status),
          color: getApprovalColor(approval.status),
        })
      );

      // Load additional system events
      const response = await fetch(`/api/requests/${requestId}/history`);
      const systemEvents = await response.json();

      // Combine and sort all events
      const allEvents = [...approvalEvents, ...systemEvents].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivityHistory(allEvents);
    } catch (error) {
      console.error('Failed to load activity history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [requestId, approvalRequests]);

  const getApprovalDescription = (approval: ApprovalRequest): string => {
    const action =
      approval.status === 'approved'
        ? 'approved'
        : approval.status === 'rejected'
          ? 'rejected'
          : approval.status === 'needs_revision'
            ? 'requested revision for'
            : 'was assigned to review';

    return `${action} this request as ${approval.level.replace('_', ' ')}`;
  };

  const getApprovalIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon />;
      case 'rejected':
        return <CancelIcon />;
      case 'needs_revision':
        return <WarningIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getApprovalColor = (
    status: ApprovalStatus
  ): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'needs_revision':
        return 'warning';
      default:
        return 'info';
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
          sessionId: reviewSession?.id,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setShowCommentDialog(false);
        await loadActivityHistory(); // Refresh history
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getTimelineEvents = () => {
    const events = activityHistory.slice(0, 20); // Limit to recent events
    return events;
  };

  if (loadingHistory) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <Typography>Loading activity history...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Current Session Info */}
      {reviewSession && (
        <Alert severity='info' sx={{ mb: 3 }}>
          <Typography variant='subtitle2' gutterBottom>
            Current Review Session
          </Typography>
          <Typography variant='body2'>
            Started {formatDistanceToNow(new Date(reviewSession.startedAt))} ago
            {reviewSession.completedAt && (
              <span>
                {' '}
                • Completed{' '}
                {formatDistanceToNow(new Date(reviewSession.completedAt))} ago
              </span>
            )}
            {reviewSession.changes.length > 0 && (
              <span> • {reviewSession.changes.length} changes recorded</span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Activity Timeline */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant='h6' component='h2'>
              Activity Timeline
            </Typography>
            <Button
              startIcon={<CommentIcon />}
              onClick={() => setShowCommentDialog(true)}
            >
              Add Comment
            </Button>
          </Box>

          <Timeline>
            {getTimelineEvents().map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent
                  color='text.secondary'
                  sx={{ maxWidth: '150px' }}
                >
                  <Typography variant='body2'>
                    {format(new Date(event.timestamp), 'MMM dd')}
                  </Typography>
                  <Typography variant='body2'>
                    {format(new Date(event.timestamp), 'h:mm a')}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={event.color}>{event.icon}</TimelineDot>
                  {index < getTimelineEvents().length - 1 && (
                    <TimelineConnector />
                  )}
                </TimelineSeparator>

                <TimelineContent>
                  <Paper elevation={1} sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        <PersonIcon fontSize='small' />
                      </Avatar>
                      <Typography variant='subtitle2'>{event.actor}</Typography>
                      <Chip
                        label={event.type.toUpperCase()}
                        size='small'
                        color={event.color}
                        variant='outlined'
                        sx={{ ml: 'auto' }}
                      />
                    </Box>

                    <Typography variant='body2' sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>

                    {/* Event Details */}
                    {event.type === 'approval' && event.details?.comments && (
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          borderLeft: 3,
                          borderColor:
                            event.color === 'success'
                              ? 'success.main'
                              : event.color === 'error'
                                ? 'error.main'
                                : event.color === 'warning'
                                  ? 'warning.main'
                                  : 'info.main',
                        }}
                      >
                        <Typography
                          variant='body2'
                          sx={{ fontStyle: 'italic' }}
                        >
                          &ldquo;{event.details.comments}&rdquo;
                        </Typography>
                      </Box>
                    )}

                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mt: 1 }}
                    >
                      {formatDistanceToNow(new Date(event.timestamp))} ago
                    </Typography>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>

          {activityHistory.length === 0 && (
            <Alert severity='info'>
              No activity recorded yet. Actions taken during the review process
              will appear here.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Sections */}
      <Grid container spacing={3}>
        {/* Approval Details */}
        <Grid item xs={12} md={6}>
          <Accordion
            expanded={expandedSections.includes('approvals')}
            onChange={() => handleSectionToggle('approvals')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='h6'>
                Approval Details ({approvalRequests.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {approvalRequests.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  No approvals have been requested yet.
                </Typography>
              ) : (
                <List>
                  {approvalRequests.map(approval => (
                    <ListItem key={approval.id} divider>
                      <ListItemIcon>
                        {getApprovalIcon(approval.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {approval.approverName}
                            <Chip
                              label={approval.level
                                .replace('_', ' ')
                                .toUpperCase()}
                              size='small'
                              variant='outlined'
                            />
                            <Chip
                              label={approval.status
                                .replace('_', ' ')
                                .toUpperCase()}
                              size='small'
                              color={getApprovalColor(approval.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant='body2'>
                              Submitted:{' '}
                              {format(
                                new Date(approval.submittedAt),
                                'MMM dd, yyyy \'at\' h:mm a'
                              )}
                            </Typography>
                            {approval.reviewedAt && (
                              <Typography variant='body2'>
                                Reviewed:{' '}
                                {format(
                                  new Date(approval.reviewedAt),
                                  'MMM dd, yyyy \'at\' h:mm a'
                                )}
                              </Typography>
                            )}
                            {approval.comments && (
                              <Typography
                                variant='body2'
                                sx={{ fontStyle: 'italic', mt: 0.5 }}
                              >
                                &ldquo;{approval.comments}&rdquo;
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Review Changes */}
        <Grid item xs={12} md={6}>
          <Accordion
            expanded={expandedSections.includes('changes')}
            onChange={() => handleSectionToggle('changes')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='h6'>
                Review Changes ({reviewSession?.changes.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {!reviewSession || reviewSession.changes.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  No changes have been recorded during this review session.
                </Typography>
              ) : (
                <List>
                  {reviewSession.changes.map(change => (
                    <ListItem key={change.id} divider>
                      <ListItemIcon>
                        <EditIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {change.changeType.replace('_', ' ').toUpperCase()}
                            <Chip
                              label={change.section.replace('_', ' ')}
                              size='small'
                              variant='outlined'
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant='body2' sx={{ mb: 0.5 }}>
                              {change.comments}
                            </Typography>
                            {change.proposedValue && (
                              <Typography
                                variant='body2'
                                sx={{
                                  p: 1,
                                  bgcolor: 'grey.50',
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                }}
                              >
                                Proposed: {change.proposedValue}
                              </Typography>
                            )}
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ mt: 0.5 }}
                            >
                              {format(
                                new Date(change.timestamp),
                                'MMM dd, yyyy \'at\' h:mm a'
                              )}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* System Events */}
      <Accordion
        expanded={expandedSections.includes('system')}
        onChange={() => handleSectionToggle('system')}
        sx={{ mt: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant='h6'>System Events</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {activityHistory
              .filter(event => event.type === 'system')
              .slice(0, 10)
              .map(event => (
                <ListItem key={event.id} divider>
                  <ListItemIcon>{event.icon}</ListItemIcon>
                  <ListItemText
                    primary={event.description}
                    secondary={format(
                      new Date(event.timestamp),
                      'MMM dd, yyyy \'at\' h:mm a'
                    )}
                  />
                </ListItem>
              ))}
          </List>
          {activityHistory.filter(event => event.type === 'system').length ===
            0 && (
            <Typography variant='body2' color='text.secondary'>
              No system events recorded.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Add Comment Dialog */}
      <Dialog
        open={showCommentDialog}
        onClose={() => setShowCommentDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add Review Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder='Enter your review comments...'
            label='Comment'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddComment}
            variant='contained'
            disabled={!newComment.trim()}
            startIcon={<CommentIcon />}
          >
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
