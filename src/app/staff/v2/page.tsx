'use client';

import React from 'react';

import { Box, Container, Typography } from '@/components/migration';
import { V2Dashboard } from '@/components/staff/v2/V2Dashboard';

/**
 * V2 Request Landing Page
 * Entry point for the guided 4-step workflow
 *
 * Epic: V2-1 Request Landing Page
 * US: V2-010 Enhanced Request Dashboard
 */
export default function V2StaffPage() {
  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' component='h1' sx={{ mb: 1 }}>
          Request Management
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage and process public records requests with AI-guided workflow
        </Typography>
      </Box>

      <V2Dashboard />
    </Container>
  );
}
