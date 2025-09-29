'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/layouts/AdminLayout';
import { MatchResults } from '../../../components/staff/MatchResults';
import { RequestDetailsDrawer } from '../../../components/staff/RequestDetailsDrawer';
import { StaffDashboard } from '../../../components/staff/StaffDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';
import { findMatches, MatchCandidate, MatchResult } from '../../../services/aiMatchingService';
import { addRecordToRequest, getRequestById, RequestStatus, StoredRequest } from '../../../services/requestService';

function StaffPageContent() {
  const [selectedRequest, setSelectedRequest] = useState<StoredRequest | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const handleRequestSelect = async (request: StoredRequest) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
    
    // 🤖 Automatically trigger AI matching if no associated records exist yet
    if (!request.associatedRecords || request.associatedRecords.length === 0) {
      console.log('🤖 [Staff Page] Auto-triggering AI matching for request:', request.trackingId);
      try {
        setMatchLoading(true);
        setMatchError(null);
        setMatchesOpen(true);
        
        const result = await findMatches(request.id!, request.description);
        setMatchResult(result);
        console.log('✅ [Staff Page] Automatic AI matching completed for request:', request.trackingId);
      } catch (error) {
        console.error('⚠️ [Staff Page] Automatic AI matching failed for request:', request.trackingId, error);
        setMatchError('Auto-matching failed. You can try manually finding matches.');
      } finally {
        setMatchLoading(false);
      }
    }
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

  const handleAcceptMatch = async (candidateId: string) => {
    console.log('🎯 [Staff Page] Accepting match:', candidateId);
    
    if (!selectedRequest || !matchResult) {
      console.error('❌ [Staff Page] No selected request or match result available');
      return;
    }

    try {
      // Find the candidate data
      const candidate = matchResult.candidates.find(c => c.id === candidateId);
      if (!candidate) {
        console.error('❌ [Staff Page] Candidate not found:', candidateId);
        return;
      }

      // Add the record to the request
      await addRecordToRequest(
        selectedRequest.id!,
        candidateId,
        {
          title: candidate.title,
          description: candidate.description,
          source: candidate.source,
          recordType: candidate.recordType,
          agency: candidate.agency,
          dateCreated: candidate.dateCreated,
          relevanceScore: candidate.relevanceScore,
          confidence: candidate.confidence,
          keyPhrases: candidate.keyPhrases,
          metadata: candidate.metadata,
        },
        'Staff User' // TODO: Get actual logged-in user
      );

      console.log('✅ [Staff Page] Match accepted and record added to request');
      
      // Refresh the request data to show the newly added record
      try {
        const updatedRequest = await getRequestById(selectedRequest.id!);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
          console.log('🔄 [Staff Page] Request data refreshed with new associated record');
        }
      } catch (refreshError) {
        console.error('⚠️ [Staff Page] Error refreshing request data:', refreshError);
      }
      
      // Close matches view after successful acceptance
      setMatchesOpen(false);
      
    } catch (error) {
      console.error('❌ [Staff Page] Error accepting match:', error);
      setMatchError('Failed to accept match. Please try again.');
    }
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
