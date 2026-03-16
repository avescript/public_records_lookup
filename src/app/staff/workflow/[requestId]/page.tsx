/**
 * Next.js Page Route: /staff/workflow/[requestId]
 * V2 Workflow orchestration page for public records request processing
 */

'use client';

import React from 'react';
import { ArrowBack as BackIcon, Home as HomeIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Breadcrumbs,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/migration';
import { V2WorkflowOrchestrator } from '@/components/staff/V2WorkflowOrchestrator';

interface WorkflowPageProps {
  params: { requestId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function WorkflowPage({
  params: { requestId },
  searchParams,
}: WorkflowPageProps) {
  const router = useRouter();

  const initialStep = searchParams?.step
    ? parseInt(
        Array.isArray(searchParams.step)
          ? searchParams.step[0]
          : searchParams.step
      ) || 0
    : 0;

  if (!requestId) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert
          severity='error'
          action={
            <Button onClick={() => router.push('/staff')}>
              Return to Dashboard
            </Button>
          }
        >
          Request ID is required to start the V2 workflow.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Navigation */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          py: 2,
        }}
      >
        <Container>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Breadcrumbs aria-label='breadcrumb'>
              <Link
                color='inherit'
                href='/staff'
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize='inherit' />
                Staff Dashboard
              </Link>
              <Typography color='text.primary'>
                V2 Workflow - Request {requestId}
              </Typography>
            </Breadcrumbs>

            <Button
              startIcon={<BackIcon />}
              onClick={() => router.push('/staff')}
              variant='outlined'
              size='small'
            >
              Return to Dashboard
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container sx={{ py: 0 }}>
        <V2WorkflowOrchestrator
          requestId={requestId}
          initialStep={initialStep}
        />
      </Container>
    </Box>
  );
}
