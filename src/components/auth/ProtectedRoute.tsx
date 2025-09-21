'use client';

import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff' | 'legal_reviewer';
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/admin/login';
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
