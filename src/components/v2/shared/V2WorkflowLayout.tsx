'use client';

import React from 'react';
import { Box, Container } from '@mui/material';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layouts/AdminLayout';

interface V2WorkflowLayoutProps {
  children: React.ReactNode;
}

export function V2WorkflowLayout({ children }: V2WorkflowLayoutProps) {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box sx={{ minHeight: '100vh' }}>
            {children}
          </Box>
        </Container>
      </AdminLayout>
    </ProtectedRoute>
  );
}