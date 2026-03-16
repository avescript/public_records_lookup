import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AgencyProvider, useAgency } from '../../src/contexts/AgencyContext';

// Mock the synthetic agencies data
jest.mock('../../src/data/syntheticDataTemplates', () => ({
  SYNTHETIC_AGENCIES: [
    {
      id: 'police',
      name: 'Police Department',
      departments: ['patrol', 'investigations'],
      commonRequestTypes: ['incident_reports'],
      documentTypes: ['incident_report'],
      averageResponseTime: 15,
      complexityWeight: 0.8,
    },
    {
      id: 'fire',
      name: 'Fire Department',
      departments: ['emergency_response'],
      commonRequestTypes: ['emergency_response'],
      documentTypes: ['incident_report'],
      averageResponseTime: 10,
      complexityWeight: 0.6,
    },
    {
      id: 'finance',
      name: 'Finance Department',
      departments: ['accounting'],
      commonRequestTypes: ['budget_reports'],
      documentTypes: ['financial_report'],
      averageResponseTime: 12,
      complexityWeight: 0.4,
    },
  ],
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock custom event dispatching
const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

describe('AgencyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AgencyProvider>{children}</AgencyProvider>
  );

  describe('Provider Initialization', () => {
    it('should initialize with first agency as default when no localStorage value', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.currentAgency?.id).toBe('police');
      expect(result.current.currentAgency?.name).toBe('Police Department');
    });

    it('should initialize with stored agency from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('fire');

      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.currentAgency?.id).toBe('fire');
      expect(result.current.currentAgency?.name).toBe('Fire Department');
    });

    it('should fallback to default agency when localStorage has invalid agency', () => {
      localStorageMock.getItem.mockReturnValue('invalid-agency-id');

      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.currentAgency?.id).toBe('police');
      expect(result.current.currentAgency?.name).toBe('Police Department');
    });

    it('should provide all available agencies', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.availableAgencies).toHaveLength(3);
      expect(result.current.availableAgencies[0].id).toBe('police');
      expect(result.current.availableAgencies[1].id).toBe('fire');
      expect(result.current.availableAgencies[2].id).toBe('finance');
    });
  });

  describe('Agency Switching', () => {
    it('should switch to different agency', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('fire');
      });

      expect(result.current.currentAgency?.id).toBe('fire');
      expect(result.current.currentAgency?.name).toBe('Fire Department');
    });

    it('should persist agency change to localStorage', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('finance');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'selected_agency',
        'finance'
      );
    });

    it('should switch to different agency and update state', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('fire');
      });

      expect(result.current.currentAgency?.id).toBe('fire');
      expect(result.current.currentAgency?.name).toBe('Fire Department');
    });

    it('should ignore switch to invalid agency', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });
      const initialAgency = result.current.currentAgency;

      act(() => {
        result.current.switchAgency('invalid-agency');
      });

      expect(result.current.currentAgency).toEqual(initialAgency);
      // Note: localStorage.setItem will still be called during initialization
    });

    it('should not dispatch event if switching to current agency', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      // Clear any previous dispatch events
      jest.clearAllMocks();

      act(() => {
        result.current.switchAgency('police'); // Already current
      });

      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Agency Data Integrity', () => {
    it('should have correct agency properties', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      const agency = result.current.availableAgencies[0];
      expect(agency).toHaveProperty('id');
      expect(agency).toHaveProperty('name');
      expect(agency).toHaveProperty('departments');
      expect(agency).toHaveProperty('commonRequestTypes');
      expect(typeof agency.id).toBe('string');
      expect(typeof agency.name).toBe('string');
      expect(Array.isArray(agency.departments)).toBe(true);
      expect(Array.isArray(agency.commonRequestTypes)).toBe(true);
    });

    it('should have unique agency IDs', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      const agencyIds = result.current.availableAgencies.map(a => a.id);
      const uniqueIds = new Set(agencyIds);
      expect(uniqueIds.size).toBe(agencyIds.length);
    });

    it('should have all required agencies', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      const expectedIds = ['police', 'fire', 'finance'];

      const actualIds = result.current.availableAgencies.map(a => a.id);
      expect(actualIds).toEqual(expectedIds);
    });
  });

  describe('Error Handling', () => {
    it('should handle component lifecycle properly', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      // Should have a functioning context
      expect(result.current.currentAgency?.id).toBe('police');
      expect(result.current.switchAgency).toBeInstanceOf(Function);
      expect(result.current.availableAgencies).toHaveLength(3);
    });
  });

  describe('Hook Usage Outside Provider', () => {
    it('should throw error when useAgency is used without AgencyProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAgency());
      }).toThrow('useAgency must be used within an AgencyProvider');

      consoleError.mockRestore();
    });
  });
});
