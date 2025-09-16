'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Grid, 
  Button,
  Divider,
  Card,
  CardContent 
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StoredRequest } from '../../../services/requestService';

interface RequestConfirmationProps {
  request: StoredRequest;
  onCopyTrackingId: () => void;
  onStartNewRequest: () => void;
}

export function RequestConfirmation({ 
  request, 
  onCopyTrackingId, 
  onStartNewRequest 
}: RequestConfirmationProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    // Handle Firestore Timestamp objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMMM d, yyyy \'at\' h:mm a');
  };

  const getDepartmentDisplayName = (department: string) => {
    const departments: Record<string, string> = {
      'police': 'Police Department',
      'fire': 'Fire Department',
      'clerk': 'City Clerk',
      'finance': 'Finance Department',
      'other': 'Other'
    };
    return departments[department] || department;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'primary';
      case 'processing': return 'info';
      case 'under_review': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Success Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, textAlign: 'center', bgcolor: 'success.50' }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom color="success.main">
          Request Submitted Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your public records request has been received and assigned a tracking number.
        </Typography>
      </Paper>

      {/* Tracking Information */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tracking Information
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <Typography variant="body2" color="text.secondary">
                Tracking ID
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {request.trackingId}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={onCopyTrackingId}
                fullWidth
                size="small"
              >
                Copy ID
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Request Details */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Request Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Request Title
              </Typography>
              <Typography variant="body1" gutterBottom>
                {request.title}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Department
              </Typography>
              <Typography variant="body1" gutterBottom>
                {getDepartmentDisplayName(request.department)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Contact Email
              </Typography>
              <Typography variant="body1" gutterBottom>
                {request.contactEmail}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={request.status.replace('_', ' ').toUpperCase()} 
                color={getStatusColor(request.status)}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Date Range
              </Typography>
              <Typography variant="body1" gutterBottom>
                {request.dateRange.startDate} to {request.dateRange.endDate}
                {request.dateRange.preset && ` (${request.dateRange.preset})`}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1" gutterBottom>
                {request.description}
              </Typography>
            </Grid>
            {request.attachmentCount > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Attachments
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {request.attachmentCount} file(s) uploaded
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Submitted
              </Typography>
              <Typography variant="body1">
                {formatDate(request.submittedAt)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What Happens Next?
          </Typography>
          <Typography variant="body1" paragraph>
            1. Your request will be reviewed by the {getDepartmentDisplayName(request.department)}
          </Typography>
          <Typography variant="body1" paragraph>
            2. You will receive an email confirmation shortly
          </Typography>
          <Typography variant="body1" paragraph>
            3. Processing typically takes 5-10 business days
          </Typography>
          <Typography variant="body1" paragraph>
            4. You can track your request status using the tracking ID above
          </Typography>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={onStartNewRequest}
          size="large"
        >
          Submit Another Request
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.location.href = '/status'}
        >
          Track This Request
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          size="large"
          onClick={() => window.print()}
        >
          Print Confirmation
        </Button>
      </Box>

      {/* Important Notice */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          <strong>Important:</strong> Please save your tracking ID ({request.trackingId}) 
          to check the status of your request. You will need this ID for any inquiries.
        </Typography>
      </Box>
    </Box>
  );
}