'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/layouts/AdminLayout';
import { StaffDashboard } from '../../../components/staff/StaffDashboard';
import { RequestDetailsDrawer } from '../../../components/staff/RequestDetailsDrawer';
import { AuthProvider } from '../../../contexts/AuthContext';
import { StoredRequest, RequestStatus } from '../../../services/requestService';

function StaffPageContent() {
  const [selectedRequest, setSelectedRequest] = useState<StoredRequest | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRequestSelect = (request: StoredRequest) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedRequest(null);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: RequestStatus) => {
    // TODO: Implement status update in requestService
    console.log('Updating status:', requestId, newStatus);
    // After successful update, refresh the request data
    // For now, we'll just close the drawer
    setDrawerOpen(false);
  };

  const handleNotesAdd = async (requestId: string, note: string) => {
    // TODO: Implement notes system in requestService
    console.log('Adding note:', requestId, note);
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <Box>
          <StaffDashboard onRequestSelect={handleRequestSelect} />
          <RequestDetailsDrawer
            open={drawerOpen}
            onClose={handleDrawerClose}
            request={selectedRequest}
            onStatusUpdate={handleStatusUpdate}
            onNotesAdd={handleNotesAdd}
          />
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
