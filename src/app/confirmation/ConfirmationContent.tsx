'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequestConfirmation } from '../../components/request/RequestConfirmation';
import { StoredRequest, getRequestByTrackingId } from '../../services/requestService';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get('trackingId');
  
  const [request, setRequest] = useState<StoredRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!trackingId) {
        setError('No tracking ID provided');
        setLoading(false);
        return;
      }

      try {
        const requestData = await getRequestByTrackingId(trackingId);
        if (!requestData) {
          setError('Request not found');
        } else {
          setRequest(requestData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [trackingId]);

  const handleCopyTrackingId = async () => {
    if (trackingId) {
      try {
        await navigator.clipboard.writeText(trackingId);
        // You might want to show a toast notification here
        console.log('Tracking ID copied to clipboard');
      } catch (err) {
        console.error('Failed to copy tracking ID:', err);
      }
    }
  };

  const handleStartNewRequest = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Request not found'}
        </Alert>
        <Typography variant="body1">
          Please check your tracking ID and try again, or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  return (
    <RequestConfirmation
      request={request}
      onCopyTrackingId={handleCopyTrackingId}
      onStartNewRequest={handleStartNewRequest}
    />
  );
}