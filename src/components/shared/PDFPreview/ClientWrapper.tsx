'use client';

import dynamic from 'next/dynamic';

import { Box, CircularProgress } from '@/components/migration';

// Client-only wrapper for PDFPreview to prevent SSR issues
const PDFPreviewComponent = dynamic(() => import('./index'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
      }}
    >
      <CircularProgress />
    </Box>
  ),
});

export default PDFPreviewComponent;
