'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';
import { AdminLayout } from '../../../components/layouts/AdminLayout';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../../contexts/AuthContext';
import { StaffDashboard } from '../../../components/staff/StaffDashboard';
import { StoredRequest } from '../../../services/requestService';

function StaffPageContent() {
  const [selectedRequest, setSelectedRequest] = useState<StoredRequest | null>(null);

  const handleRequestSelect = (request: StoredRequest) => {
    setSelectedRequest(request);
    // TODO: Open request details drawer/modal
    console.log('Selected request:', request);
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <Box>
          <StaffDashboard onRequestSelect={handleRequestSelect} />
          {/* TODO: Add request details drawer/modal here */}
        </Box>
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default function StaffPage() {
  return (
    <AuthProvider>
      <StaffPageContent />
    </AuthProvider>
  );
}