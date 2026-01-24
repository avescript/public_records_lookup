import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AgencyProvider, useAgency } from '../../src/contexts/AgencyContext';

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

      expect(result.current.currentAgency.id).toBe('pdx-police');
      expect(result.current.currentAgency.name).toBe('Portland Police Bureau');
    });

    it('should initialize with stored agency from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('seattle-police');

      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.currentAgency.id).toBe('seattle-police');
      expect(result.current.currentAgency.name).toBe('Seattle Police Department');
    });

    it('should fallback to default agency when localStorage has invalid agency', () => {
      localStorageMock.getItem.mockReturnValue('invalid-agency-id');

      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.currentAgency.id).toBe('pdx-police');
      expect(result.current.currentAgency.name).toBe('Portland Police Bureau');
    });

    it('should provide all available agencies', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.agencies).toHaveLength(6);
      expect(result.current.agencies[0].id).toBe('pdx-police');
      expect(result.current.agencies[1].id).toBe('seattle-police');
      expect(result.current.agencies[2].id).toBe('eugene-police');
    });
  });

  describe('Agency Switching', () => {
    it('should switch to different agency', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('seattle-police');
      });

      expect(result.current.currentAgency.id).toBe('seattle-police');
      expect(result.current.currentAgency.name).toBe('Seattle Police Department');
    });

    it('should persist agency change to localStorage', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('eugene-police');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'public-records-current-agency',
        'eugene-police'
      );
    });

    it('should dispatch custom event when agency changes', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('bend-police');
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'agency-changed',
          detail: expect.objectContaining({
            agencyId: 'bend-police',
            agency: expect.objectContaining({
              id: 'bend-police',
              name: 'Bend Police Department'
            })
          })
        })
      );
    });

    it('should ignore switch to invalid agency', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });
      const initialAgency = result.current.currentAgency;

      act(() => {
        result.current.switchAgency('invalid-agency');
      });

      expect(result.current.currentAgency).toEqual(initialAgency);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should not change state if switching to current agency', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('pdx-police'); // Already current
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Agency Data Integrity', () => {
    it('should have correct agency properties', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      const agency = result.current.agencies[0];
      expect(agency).toHaveProperty('id');
      expect(agency).toHaveProperty('name');
      expect(agency).toHaveProperty('color');
      expect(agency).toHaveProperty('icon');
      expect(typeof agency.id).toBe('string');
      expect(typeof agency.name).toBe('string');
      expect(typeof agency.color).toBe('string');
      expect(typeof agency.icon).toBe('string');
    });

    it('should have unique agency IDs', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      const agencyIds = result.current.agencies.map(a => a.id);
      const uniqueIds = new Set(agencyIds);
      expect(uniqueIds.size).toBe(agencyIds.length);
    });

    it('should have all required agencies', () => {
      const { result } = renderHook(() => useAgency(), { wrapper });

      const expectedIds = [
        'pdx-police',
        'seattle-police',
        'eugene-police',
        'bend-police',
        'corvallis-police',
        'salem-police'
      ];

      const actualIds = result.current.agencies.map(a => a.id);
      expect(actualIds).toEqual(expectedIds);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useAgency(), { wrapper });

      expect(result.current.currentAgency.id).toBe('pdx-police');
    });

    it('should handle localStorage setItem errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() => useAgency(), { wrapper });

      act(() => {
        result.current.switchAgency('seattle-police');
      });

      // Should still switch agency in state despite localStorage error
      expect(result.current.currentAgency.id).toBe('seattle-police');
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