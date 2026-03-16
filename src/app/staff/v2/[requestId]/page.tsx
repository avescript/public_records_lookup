'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
} from '@/components/migration';
import { StepNavigator } from '@/components/staff/v2/StepNavigator';
import { getRequestById, type StoredRequest } from '@/services/requestService';

/**
 * V2 Request Workflow Page
 * Hosts the 4-step guided workflow for processing requests
 *
 * Steps:
 * 1. Locate - AI-powered record discovery
 * 2. Redact - Enhanced AI redaction
 * 3. Respond - AI-generated response drafting
 * 4. Review - Approval workflow and delivery
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-011 Request Navigation & Entry
 */
export default function V2RequestWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const [request, setRequest] = useState<StoredRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) {
        setError('No request ID provided');
        setLoading(false);
        return;
      }

      // Load request
      const loadedRequest = await getRequestById(requestId);
      if (!loadedRequest) {
        setError(`Request not found: ${requestId}`);
        setLoading(false);
        return;
      }

      setRequest(loadedRequest);
      setLoading(false);
    };

    loadRequest();
  }, [requestId]);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleBackToDashboard = () => {
    router.push('/staff/v2');
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error || 'Request not found'}
        </Alert>
        <Typography
          variant='body2'
          color='primary'
          sx={{ cursor: 'pointer' }}
          onClick={handleBackToDashboard}
        >
          ← Back to Dashboard
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='body2'
          color='primary'
          sx={{ cursor: 'pointer', mb: 1 }}
          onClick={handleBackToDashboard}
        >
          ← Back to Dashboard
        </Typography>
        <Typography variant='h4' component='h1' gutterBottom>
          {request.title}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Request ID: {request.id} • Submitted by {request.contactEmail}
        </Typography>
      </Box>

      {/* Step Navigator */}
      <StepNavigator
        requestId={requestId}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        request={request}
      />
    </Container>
  );
}
