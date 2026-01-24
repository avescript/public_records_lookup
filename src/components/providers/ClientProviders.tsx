'use client';

import React from 'react';

import { AgencyProvider } from '../../contexts/AgencyContext';
import { AuthProvider } from '../../contexts/AuthContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <AgencyProvider>
        {children}
      </AgencyProvider>
    </AuthProvider>
  );
}