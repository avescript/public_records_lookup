/**
 * Legal Review Dashboard Page (Epic 5)
 * Provides comprehensive legal review interface for US-050 and US-051
 */

'use client';

import React from 'react';
import { Container, Box } from '@mui/material';
import { LegalReviewDashboard } from '../../../components/staff/LegalReviewDashboard';

export default function LegalReviewPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <LegalReviewDashboard />
      </Box>
    </Container>
  );
}