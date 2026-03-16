/**
 * Migration Provider Component
 * Epic V2-7 Phase 5: Priority 3 Migration Tooling
 *
 * Provides migration tracking context and optionally renders
 * the migration dashboard in development mode.
 */

'use client';

import React, { createContext, useContext, useState } from 'react';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { Fab } from '@mui/material';

import MigrationDashboard from './MigrationDashboard';

interface MigrationProviderProps {
  children: React.ReactNode;
  showDashboard?: boolean;
  dashboardPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface MigrationContextValue {
  isDashboardOpen: boolean;
  toggleDashboard: () => void;
  isEnabled: boolean;
}

const MigrationContext = createContext<MigrationContextValue>({
  isDashboardOpen: false,
  toggleDashboard: () => {},
  isEnabled: false,
});

export const useMigrationContext = () => useContext(MigrationContext);

export const MigrationProvider: React.FC<MigrationProviderProps> = ({
  children,
  showDashboard = true,
  dashboardPosition = 'top-right',
}) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const isEnabled = process.env.NODE_ENV === 'development';

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
  };

  const contextValue: MigrationContextValue = {
    isDashboardOpen,
    toggleDashboard,
    isEnabled,
  };

  // Don't render anything in production
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <MigrationContext.Provider value={contextValue}>
      {children}

      {showDashboard && (
        <>
          {/* Floating Action Button to toggle dashboard */}
          {!isDashboardOpen && (
            <Fab
              color='primary'
              onClick={toggleDashboard}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 9998,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
              title='Show Migration Dashboard'
            >
              <TimelineIcon />
            </Fab>
          )}

          {/* Migration Dashboard */}
          <MigrationDashboard
            isOpen={isDashboardOpen}
            onClose={toggleDashboard}
            position={dashboardPosition}
          />
        </>
      )}
    </MigrationContext.Provider>
  );
};

export default MigrationProvider;
