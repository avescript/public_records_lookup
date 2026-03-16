'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  SYNTHETIC_AGENCIES,
  SyntheticAgency,
} from '../data/syntheticDataTemplates';

interface AgencyContextType {
  currentAgency: SyntheticAgency | null;
  availableAgencies: SyntheticAgency[];
  switchAgency: (agencyId: string) => void;
  isLoading: boolean;
}

const AgencyContext = createContext<AgencyContextType | null>(null);

export function useAgency() {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}

interface AgencyProviderProps {
  children: React.ReactNode;
}

export function AgencyProvider({ children }: AgencyProviderProps) {
  const [currentAgency, setCurrentAgency] = useState<SyntheticAgency | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const availableAgencies = SYNTHETIC_AGENCIES;

  useEffect(() => {
    // Check for existing agency preference
    const savedAgencyId = localStorage.getItem('selected_agency');
    if (savedAgencyId) {
      const agency = availableAgencies.find(a => a.id === savedAgencyId);
      if (agency) {
        setCurrentAgency(agency);
      } else {
        // Fall back to first agency if saved one doesn't exist
        setCurrentAgency(availableAgencies[0]);
        localStorage.setItem('selected_agency', availableAgencies[0].id);
      }
    } else {
      // Default to first agency (Police Department)
      setCurrentAgency(availableAgencies[0]);
      localStorage.setItem('selected_agency', availableAgencies[0].id);
    }
    setIsLoading(false);
  }, [availableAgencies]);

  const switchAgency = (agencyId: string) => {
    const agency = availableAgencies.find(a => a.id === agencyId);
    if (agency) {
      setCurrentAgency(agency);
      localStorage.setItem('selected_agency', agencyId);

      // Trigger custom event for other components to listen to agency changes
      const event = new CustomEvent('agencyChanged', {
        detail: {
          previousAgency: currentAgency,
          newAgency: agency,
        },
      });
      window.dispatchEvent(event);
    }
  };

  const value: AgencyContextType = {
    currentAgency,
    availableAgencies,
    switchAgency,
    isLoading,
  };

  return (
    <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>
  );
}
