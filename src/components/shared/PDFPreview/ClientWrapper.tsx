'use client';

import { Box, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';

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
