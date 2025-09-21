'use client';

import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

import ConfirmationContent from './ConfirmationContent';

function LoadingFallback() {
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

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmationContent />
    </Suspense>
  );
}
