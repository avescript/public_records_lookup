'use client';

import React, { useState } from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import { PublicLayout } from '../../components/layouts/PublicLayout';
import {
  getRequestByTrackingId,
  StoredRequest,
} from '../../services/requestService';

export default function StatusLookupPage() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<StoredRequest | null>(null);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError(null);
    setRequest(null);

    try {
      const requestData = await getRequestByTrackingId(trackingId.trim());
      if (!requestData) {
        setError(
          'Request not found. Please check your tracking ID and try again.'
        );
      } else {
        setRequest(requestData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to retrieve request'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMMM d, yyyy \'at\' h:mm a');
  };

  const getDepartmentDisplayName = (department: string) => {
    const departments: Record<string, string> = {
      police: 'Police Department',
      fire: 'Fire Department',
      clerk: 'City Clerk',
      finance: 'Finance Department',
      other: 'Other',
    };
    return departments[department] || department;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'primary';
      case 'processing':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Your request has been received and is waiting to be processed.';
      case 'processing':
        return 'Your request is currently being processed by the department.';
      case 'under_review':
        return 'Your request is under review. Additional approval may be required.';
      case 'completed':
        return 'Your request has been completed and is ready for delivery.';
      case 'rejected':
        return 'Your request has been rejected. Please contact the department for more information.';
      default:
        return 'Status unknown.';
    }
  };

  return (
    <PublicLayout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Track Your Request
        </Typography>
        <Typography
          variant="body1"
          paragraph
          align="center"
          color="text.secondary"
        >
          Enter your tracking ID to check the status of your public records
          request.
        </Typography>

        {/* Search Form */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Tracking ID"
              placeholder="Enter your tracking ID (e.g., PR-123456-ABCD)"
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              onKeyPress={handleKeyPress}
              error={!!error && !request}
              helperText={
                error && !request
                  ? error
                  : 'Enter the tracking ID from your confirmation email or receipt'
              }
              disabled={loading}
            />
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SearchIcon />
                )
              }
              onClick={handleSearch}
              disabled={loading || !trackingId.trim()}
              sx={{ minWidth: 120, height: 56 }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
        </Paper>

        {/* Error Alert */}
        {error && !request && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Request Details */}
        {request && (
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Request Status
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Chip
                    label={request.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(request.status)}
                    size="medium"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {formatDate(request.updatedAt)}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {getStatusDescription(request.status)}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Request Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tracking ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {request.trackingId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(request.submittedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1">
                    {getDepartmentDisplayName(request.department)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact Email
                  </Typography>
                  <Typography variant="body1">
                    {request.contactEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Request Title
                  </Typography>
                  <Typography variant="body1">{request.title}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Date Range
                  </Typography>
                  <Typography variant="body1">
                    {request.dateRange.startDate} to {request.dateRange.endDate}
                    {request.dateRange.preset &&
                      ` (${request.dateRange.preset})`}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{request.description}</Typography>
                </Grid>
                {request.attachmentCount > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Attachments
                    </Typography>
                    <Typography variant="body1">
                      {request.attachmentCount} file(s) uploaded
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you can't find your request or have questions about the status,
            please contact the relevant department directly or call our main
            office for assistance.
          </Typography>
        </Box>
      </Box>
    </PublicLayout>
  );
}
