/**
 * RequestDetailsPanel - Detailed view of original request and context
 * Part of ReviewInterface - Step 4 of V2 Workflow
 */

'use client';

import React from 'react';
import {
  AttachFile as AttachFileIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import { PublicRecordRequest } from '@/types/request';
import { ReviewComparison } from '@/types/review';

interface RequestDetailsPanelProps {
  request: PublicRecordRequest;
  comparison: ReviewComparison;
  onEdit: () => void;
}

export function RequestDetailsPanel({
  request,
  comparison,
  onEdit,
}: RequestDetailsPanelProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM dd, yyyy \'at\' h:mm a');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Request Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <Typography variant='h6' component='h2'>
                  Request Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={request.priority || 'Normal'}
                    color={getPriorityColor(request.priority || 'normal')}
                    size='small'
                    icon={<FlagIcon />}
                  />
                  <Chip
                    label={request.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(request.status)}
                    size='small'
                  />
                </Box>
              </Box>

              <Typography variant='body1' sx={{ mb: 3, lineHeight: 1.6 }}>
                <strong>Description:</strong> {request.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Request ID
                  </Typography>
                  <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                    {request.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Date Range
                  </Typography>
                  <Typography variant='body2'>
                    {request.startDate && request.endDate
                      ? `${format(new Date(request.startDate), 'MMM dd, yyyy')} - ${format(new Date(request.endDate), 'MMM dd, yyyy')}`
                      : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Submitted
                  </Typography>
                  <Typography variant='body2'>
                    {formatDate(request.submittedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Due Date
                  </Typography>
                  <Typography
                    variant='body2'
                    color={
                      request.dueDate && new Date(request.dueDate) < new Date()
                        ? 'error'
                        : 'text.primary'
                    }
                  >
                    {request.dueDate ? formatDate(request.dueDate) : 'Not set'}
                  </Typography>
                </Grid>
              </Grid>

              {request.keywords && request.keywords.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Keywords
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}
                  >
                    {request.keywords.map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant='h6' component='h2' gutterBottom>
                Requester Information
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant='subtitle1'>
                    {request.requesterName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {request.requesterType || 'Individual'}
                  </Typography>
                </Box>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color='primary' />
                  </ListItemIcon>
                  <ListItemText
                    primary={request.requesterEmail}
                    secondary='Email'
                  />
                </ListItem>

                {request.requesterPhone && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color='primary' />
                    </ListItemIcon>
                    <ListItemText
                      primary={request.requesterPhone}
                      secondary='Phone'
                    />
                  </ListItem>
                )}

                {request.requesterOrganization && (
                  <ListItem>
                    <ListItemIcon>
                      <BusinessIcon color='primary' />
                    </ListItemIcon>
                    <ListItemText
                      primary={request.requesterOrganization}
                      secondary='Organization'
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Processing Timeline */}
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant='h6' component='h2' gutterBottom>
            Processing Timeline
          </Typography>

          <Timeline>
            <TimelineItem>
              <TimelineOppositeContent color='text.secondary'>
                {formatDate(request.submittedAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color='primary'>
                  <DescriptionIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant='subtitle1'>Request Submitted</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Initial request received and processed
                </Typography>
              </TimelineContent>
            </TimelineItem>

            {comparison.stepData?.locate && (
              <TimelineItem>
                <TimelineOppositeContent color='text.secondary'>
                  {comparison.stepData.locate.timestamp &&
                    formatDate(comparison.stepData.locate.timestamp)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color='success'>
                    <SearchIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant='subtitle1'>Records Located</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {comparison.stepData.selectedRecords?.length || 0} records
                    found and selected
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}

            {comparison.stepData?.redact && (
              <TimelineItem>
                <TimelineOppositeContent color='text.secondary'>
                  {comparison.stepData.redact.timestamp &&
                    formatDate(comparison.stepData.redact.timestamp)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color='warning'>
                    <EditIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant='subtitle1'>Records Redacted</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {comparison.redactions?.length || 0} redactions applied for
                    privacy compliance
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}

            {comparison.stepData?.respond && (
              <TimelineItem>
                <TimelineOppositeContent color='text.secondary'>
                  {comparison.stepData.respond.timestamp &&
                    formatDate(comparison.stepData.respond.timestamp)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color='info'>
                    <SendIcon />
                  </TimelineDot>
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant='subtitle1'>
                    Response Generated
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    AI-assisted response drafted and ready for review
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}
          </Timeline>
        </CardContent>
      </Card>

      {/* Quality & Risk Assessment */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant='h6' component='h2' gutterBottom>
                Quality Assessment
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='body2'>Overall Quality</Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {comparison.qualityScore}%
                  </Typography>
                </Box>
                <Box
                  sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}
                >
                  <Box
                    sx={{
                      width: `${comparison.qualityScore}%`,
                      height: 8,
                      bgcolor:
                        comparison.qualityScore >= 80
                          ? 'success.main'
                          : 'warning.main',
                      borderRadius: 1,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='body2'>Compliance Score</Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {comparison.complianceScore}%
                  </Typography>
                </Box>
                <Box
                  sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}
                >
                  <Box
                    sx={{
                      width: `${comparison.complianceScore}%`,
                      height: 8,
                      bgcolor:
                        comparison.complianceScore >= 85
                          ? 'success.main'
                          : 'error.main',
                      borderRadius: 1,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>

              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                Estimated response time: {comparison.estimatedResponseTime}{' '}
                minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant='h6' component='h2' gutterBottom>
                Risk Assessment
              </Typography>

              <Alert
                severity={
                  comparison.riskAssessment.level === 'low'
                    ? 'success'
                    : comparison.riskAssessment.level === 'medium'
                      ? 'warning'
                      : 'error'
                }
                sx={{ mb: 2 }}
              >
                Risk Level: {comparison.riskAssessment.level.toUpperCase()}
              </Alert>

              {comparison.riskAssessment.factors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Risk Factors:
                  </Typography>
                  {comparison.riskAssessment.factors.map((factor, index) => (
                    <Chip
                      key={index}
                      label={`${factor.category}: ${factor.severity}/10`}
                      size='small'
                      color={
                        factor.severity > 7
                          ? 'error'
                          : factor.severity > 4
                            ? 'warning'
                            : 'default'
                      }
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}

              {comparison.riskAssessment.recommendations.length > 0 && (
                <Box>
                  <Typography variant='subtitle2' gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {comparison.riskAssessment.recommendations.map(
                      (rec, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      )
                    )}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attachments */}
      {comparison.attachments && comparison.attachments.length > 0 && (
        <Card elevation={2} sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant='h6' component='h2' gutterBottom>
              Attachments ({comparison.attachments.length})
            </Typography>

            <List>
              {comparison.attachments.map(attachment => (
                <ListItem key={attachment.id} divider>
                  <ListItemIcon>
                    <AttachFileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={attachment.filename}
                    secondary={
                      <Box component='span'>
                        <Typography component='span' variant='body2'>
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB •{' '}
                          {formatDate(attachment.uploadedAt)}
                        </Typography>
                        {attachment.redacted && (
                          <Chip
                            label='Redacted'
                            size='small'
                            color='warning'
                            sx={{ ml: 1 }}
                          />
                        )}
                        {attachment.includeInDelivery && (
                          <Chip
                            label='Include in Delivery'
                            size='small'
                            color='success'
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant='contained' onClick={onEdit} startIcon={<EditIcon />}>
          Review Response
        </Button>
      </Box>
    </Box>
  );
}
