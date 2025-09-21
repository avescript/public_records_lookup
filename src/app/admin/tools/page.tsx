'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/layouts/AdminLayout';
import { AuthProvider } from '../../../contexts/AuthContext';
import { seedTestData } from '../../../utils/seedTestData';

function AdminToolsContent() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await seedTestData();
      setMessage({ type: 'success', text: 'Test data seeded successfully!' });
    } catch (error) {
      console.error('Error seeding data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to seed test data. Check console for details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Tools
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Development utilities for testing and data management.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSeedData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {loading ? 'Seeding Data...' : 'Seed Test Data'}
            </Button>

            <Typography variant="caption" color="text.secondary">
              This will create 7 sample requests for testing the staff
              dashboard.
            </Typography>
          </Box>
        </Box>
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default function AdminToolsPage() {
  return (
    <AuthProvider>
      <AdminToolsContent />
    </AuthProvider>
  );
}
