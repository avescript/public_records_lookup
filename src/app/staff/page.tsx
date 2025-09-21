'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';

import { StaffDashboard } from '../../components/staff/StaffDashboard';
import { StoredRequest } from '../../services/requestService';

export default function StaffPage() {
  const [selectedRequest, setSelectedRequest] = useState<StoredRequest | null>(
    null
  );

  const handleRequestSelect = (request: StoredRequest) => {
    setSelectedRequest(request);
    // TODO: Open request details drawer/modal
    console.log('Selected request:', request);
  };

  return (
    <Box>
      <StaffDashboard onRequestSelect={handleRequestSelect} />
      {/* TODO: Add request details drawer/modal here */}
    </Box>
  );
}
