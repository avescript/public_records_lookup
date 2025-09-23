'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/layouts/AdminLayout';
import { MatchResults } from '../../../components/staff/MatchResults';
import { RequestDetailsDrawer } from '../../../components/staff/RequestDetailsDrawer';
import { StaffDashboard } from '../../../components/staff/StaffDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';
import { findMatches, MatchResult } from '../../../services/aiMatchingService';
import { RequestStatus,StoredRequest } from '../../../services/requestService';

function StaffPageContent() {
  const [selectedRequest, setSelectedRequest] = useState<StoredRequest | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

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

  const handleFindMatches = async (requestId: string, description: string) => {
    setMatchLoading(true);
    setMatchError(null);
    setMatchesOpen(true);
    
    try {
      const result = await findMatches(requestId, description);
      setMatchResult(result);
    } catch (error) {
      console.error('Error finding matches:', error);
      setMatchError('Failed to find matches. Please try again.');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleMatchesClose = () => {
    setMatchesOpen(false);
    setMatchResult(null);
    setMatchError(null);
  };

  const handleAcceptMatch = (candidateId: string) => {
    console.log('Accepting match:', candidateId);
    // TODO: Implement match acceptance logic
  };

  const handleRejectMatch = (candidateId: string) => {
    console.log('Rejecting match:', candidateId);
    // TODO: Implement match rejection logic
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
            onFindMatches={handleFindMatches}
          />
          <MatchResults
            open={matchesOpen}
            onClose={handleMatchesClose}
            matchResult={matchResult}
            loading={matchLoading}
            error={matchError || undefined}
            onAcceptMatch={handleAcceptMatch}
            onRejectMatch={handleRejectMatch}
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
