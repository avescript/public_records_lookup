'use client';

import React, { useEffect, useState } from 'react';
import {
  AutoAwesome as AutoAwesomeIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { getRequestById, StoredRequest } from '@/services/requestService';
import { StepNavigation, WorkflowStep } from '../shared/StepNavigation';

interface LocateStepProps {
  requestId: string;
}

export function LocateStep({ requestId }: LocateStepProps) {
  const [request, setRequest] = useState<StoredRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock completed steps for now
  const completedSteps: WorkflowStep[] = [];
  const currentStep: WorkflowStep = 'locate';

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const requestData = await getRequestById(requestId);
      setRequest(requestData);
    } catch (err) {
      setError('Failed to load request');
      console.error('Error fetching request:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Loading request...</Typography>
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Alert severity="error">
        {error || 'Request not found'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Step Navigation */}
      <StepNavigation
        requestId={requestId}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Request Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Request Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Title
            </Typography>
            <Typography variant="body1" gutterBottom>
              {request.title}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Department
            </Typography>
            <Typography variant="body1" gutterBottom>
              {request.department}
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
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Date Range
            </Typography>
            <Typography variant="body1" gutterBottom>
              {request.dateRange.startDate} to {request.dateRange.endDate}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip 
              label={request.status.replace('_', ' ').toUpperCase()}
              color="primary"
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* AI-Powered Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h5">
            AI-Powered Record Discovery
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Our AI will analyze your request and automatically search for relevant records. 
          You can also refine the search or add records manually.
        </Alert>

        <Stack spacing={3}>
          {/* Search Interface */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Intelligent Search
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  placeholder="Describe what records you're looking for..."
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ minWidth: 200 }}
                >
                  AI Search
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Divider>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Manual Upload */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manual Record Upload
              </Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Upload records directly if you have them available
                </Typography>
                <Button variant="outlined" startIcon={<UploadIcon />}>
                  Choose Files
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Paper>

      {/* Results Section (placeholder) */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Search Results
        </Typography>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Start your search to find relevant records
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}