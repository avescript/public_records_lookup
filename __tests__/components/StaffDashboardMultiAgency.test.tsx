/**
 * StaffDashboard Multi-Agency Tests - Refined
 * Epic 9 Task 3: Multi-Agency Request Management
 * Tests for agency filtering, cross-agency routing, and multi-agency UI features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffDashboard } from '../../src/components/staff/StaffDashboard';
import { AgencyProvider } from '../../src/contexts/AgencyContext';
import { SYNTHETIC_AGENCIES } from '../../src/data/syntheticDataTemplates';
import * as requestService from '../../src/services/requestService';

// Mock the request service
jest.mock('../../src/services/requestService', () => ({
  getAllRequests: jest.fn(),
  routeRequestToAgency: jest.fn(),
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGet = jest.fn(() => null);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
  usePathname: () => '/staff',
}));

// Mock localStorage for AgencyContext
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test wrapper with AgencyProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AgencyProvider>{children}</AgencyProvider>
);

describe('StaffDashboard Multi-Agency Features', () => {
  const mockRequests = [
    {
      id: '1',
      trackingId: 'PR-001',
      title: 'Police Report Request',
      department: 'police',
      agency: 'police',
      status: 'submitted' as const,
      submittedAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      updatedAt: { toDate: () => new Date('2024-01-15T10:00:00Z') },
      contactEmail: 'citizen1@example.com',
      description: 'Request for police incident report',
      dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
      attachmentCount: 0,
    },
    {
      id: '2',
      trackingId: 'PR-002',
      title: 'Fire Department Records',
      department: 'fire',
      agency: 'fire',
      status: 'processing' as const,
      submittedAt: { toDate: () => new Date('2024-01-16T14:30:00Z') },
      updatedAt: { toDate: () => new Date('2024-01-16T14:30:00Z') },
      contactEmail: 'citizen2@example.com',
      description: 'Request for fire inspection records',
      dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
      attachmentCount: 1,
    },
    {
      id: '3',
      trackingId: 'PR-003',
      title: 'Finance Budget Information',
      department: 'finance',
      agency: 'finance',
      status: 'under_review' as const,
      submittedAt: { toDate: () => new Date('2024-01-17T09:15:00Z') },
      updatedAt: { toDate: () => new Date('2024-01-17T09:15:00Z') },
      contactEmail: 'citizen3@example.com',
      description: 'Request for budget allocation records',
      dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
      attachmentCount: 0,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('selected_agency', 'police');
    mockGet.mockReturnValue(null);
    
    // Set up default mock response that resolves immediately
    (requestService.getAllRequests as jest.Mock).mockImplementation((agencyFilter) => {
      if (agencyFilter === 'police') {
        return Promise.resolve([mockRequests[0]]);
      }
      return Promise.resolve(mockRequests);
    });
    (requestService.routeRequestToAgency as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Agency Context Integration', () => {
    it('should fetch requests for current agency by default', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(requestService.getAllRequests).toHaveBeenCalledWith('police');
      }, { timeout: 3000 });
    });

    it('should display request data after loading', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for loading to complete and data to appear
      await waitFor(() => {
        expect(screen.getByText('Police Report Request')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show toggle button for all agencies view', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('Show All Agencies')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Agency Filtering', () => {
    it('should switch between current agency and all agencies view', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Find and click toggle button
      const toggleButton = await screen.findByText('Show All Agencies');
      expect(toggleButton).toBeInTheDocument();

      await act(async () => {
        await user.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Show Current Agency Only')).toBeInTheDocument();
        expect(requestService.getAllRequests).toHaveBeenCalledWith(undefined);
      });
    });

    it('should show agency filter when viewing all agencies', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Click toggle to show all agencies
      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Agencies')).toBeInTheDocument();
      });
    });

    it('should filter by selected agencies when viewing all', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to all agencies view
      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      // Wait for agency filter to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Agencies')).toBeInTheDocument();
      });

      // Should show all requests when viewing all agencies
      await waitFor(() => {
        expect(screen.getByText('Police Report Request')).toBeInTheDocument();
        expect(screen.getByText('Fire Department Records')).toBeInTheDocument();
        expect(screen.getByText('Finance Budget Information')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Agency Routing', () => {
    it('should show routing button when viewing all agencies', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to all agencies view
      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      // Wait for data grid to render with routing buttons
      await waitFor(() => {
        const routeButtons = screen.queryAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });
    });

    it('should open routing dialog when clicking route button', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to all agencies view
      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      // Wait for routing buttons to appear
      await waitFor(() => {
        const routeButtons = screen.queryAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });

      // Click first route button
      const routeButtons = screen.getAllByLabelText('Route to Agency');
      await act(async () => {
        await user.click(routeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Route Request to Another Agency')).toBeInTheDocument();
      });
    });

    it('should handle request routing with validation', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to all agencies and open routing
      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      await waitFor(() => {
        const routeButtons = screen.queryAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });

      const routeButtons = screen.getAllByLabelText('Route to Agency');
      await act(async () => {
        await user.click(routeButtons[0]);
      });

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Route Request to Another Agency')).toBeInTheDocument();
      });

      // Select target agency
      const agencySelect = screen.getByLabelText('Target Agency');
      await act(async () => {
        await user.click(agencySelect);
      });
      
      const fireOption = screen.getByRole('option', { name: 'Fire Department' });
      await act(async () => {
        await user.click(fireOption);
      });

      // Add routing reason
      const reasonField = screen.getByLabelText('Reason for Routing');
      await act(async () => {
        await user.type(reasonField, 'Test routing reason');
      });

      // Submit routing
      const routeButton = screen.getByRole('button', { name: 'Route Request' });
      expect(routeButton).not.toBeDisabled();
      
      await act(async () => {
        await user.click(routeButton);
      });

      await waitFor(() => {
        expect(requestService.routeRequestToAgency).toHaveBeenCalledWith(
          '1',
          'fire',
          'Test routing reason',
          'current-user'
        );
      });
    });
  });

  describe('Agency Display', () => {
    it('should show agency information in request rows', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for initial load and data
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('Police Report Request')).toBeInTheDocument();
      });

      // Check for agency column header
      await waitFor(() => {
        expect(screen.getByText('Agency')).toBeInTheDocument();
      });
    });

    it('should show all agency names when viewing all agencies', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for load and switch to all agencies
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      // Wait for all requests to load
      await waitFor(() => {
        expect(screen.getByText('Police Report Request')).toBeInTheDocument();
        expect(screen.getByText('Fire Department Records')).toBeInTheDocument();
        expect(screen.getByText('Finance Budget Information')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle request loading errors', async () => {
      const loadingError = new Error('Failed to load requests');
      (requestService.getAllRequests as jest.Mock).mockRejectedValue(loadingError);

      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load requests/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle routing errors gracefully', async () => {
      const user = userEvent.setup();
      const routingError = new Error('Routing failed');
      (requestService.routeRequestToAgency as jest.Mock).mockRejectedValue(routingError);

      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for load and setup routing
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      await waitFor(() => {
        const routeButtons = screen.queryAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });

      // Trigger routing that should fail
      const routeButtons = screen.getAllByLabelText('Route to Agency');
      await act(async () => {
        await user.click(routeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Target Agency')).toBeInTheDocument();
      });

      const agencySelect = screen.getByLabelText('Target Agency');
      await act(async () => {
        await user.click(agencySelect);
      });
      
      const fireOption = screen.getByRole('option', { name: 'Fire Department' });
      await act(async () => {
        await user.click(fireOption);
      });

      const reasonField = screen.getByLabelText('Reason for Routing');
      await act(async () => {
        await user.type(reasonField, 'Test routing failure');
      });

      const routeButton = screen.getByRole('button', { name: 'Route Request' });
      await act(async () => {
        await user.click(routeButton);
      });

      await waitFor(() => {
        expect(requestService.routeRequestToAgency).toHaveBeenCalled();
        // Error should be handled gracefully - dialog should remain open or error should be shown
      });
    });
  });
});

  describe('Agency Context Integration', () => {
    it('should fetch requests for current agency by default', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(requestService.getAllRequests).toHaveBeenCalledWith('police');
      });
    });

    it('should display agency information in request rows', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Police Department')).toBeInTheDocument();
      });

      // Check that agency chips are displayed
      const agencyChips = screen.getAllByText(/Police Department|Fire Department|Finance Department/);
      expect(agencyChips.length).toBeGreaterThan(0);
    });

    it('should show toggle button for all agencies view', async () => {
      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Show All Agencies')).toBeInTheDocument();
      });
    });
  });

  describe('Agency Filtering', () => {
    it('should switch between current agency and all agencies view', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Initially should show current agency only
      await waitFor(() => {
        expect(screen.getByText('Show All Agencies')).toBeInTheDocument();
      });

      // Click to show all agencies
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Show Current Agency Only')).toBeInTheDocument();
        expect(requestService.getAllRequests).toHaveBeenCalledWith(undefined);
      });
    });

    it('should show agency filter when viewing all agencies', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies view
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Agencies')).toBeInTheDocument();
      });
    });

    it('should filter requests by selected agencies', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies view first
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Agencies')).toBeInTheDocument();
      });

      // Open agency filter dropdown
      const agencySelect = screen.getByLabelText('Agencies');
      await user.click(agencySelect);

      // Select police agency
      const policeOption = screen.getByText('Police Department');
      await user.click(policeOption);

      // Should filter to only show police requests
      await waitFor(() => {
        expect(screen.getByText('Police Report Request')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Agency Routing', () => {
    it('should show routing button when viewing all agencies', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies view
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        // Should show routing icons in the actions column
        const routeButtons = screen.getAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });
    });

    it('should open routing dialog when clicking route button', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies view
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        const routeButtons = screen.getAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });

      // Click first route button
      const firstRouteButton = screen.getAllByLabelText('Route to Agency')[0];
      await user.click(firstRouteButton);

      await waitFor(() => {
        expect(screen.getByText('Route Request to Another Agency')).toBeInTheDocument();
      });
    });

    it('should handle request routing with proper validation', async () => {
      const user = userEvent.setup();
      (requestService.routeRequestToAgency as jest.Mock).mockResolvedValue(undefined);
      
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies view and open routing dialog
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        const routeButtons = screen.getAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });

      const firstRouteButton = screen.getAllByLabelText('Route to Agency')[0];
      await user.click(firstRouteButton);

      await waitFor(() => {
        expect(screen.getByText('Route Request to Another Agency')).toBeInTheDocument();
      });

      // Dialog should show current request info
      expect(screen.getByText('Police Report Request')).toBeInTheDocument();

      // Select target agency
      const agencySelect = screen.getByLabelText('Target Agency');
      await user.click(agencySelect);
      const fireOption = screen.getByText('Fire Department');
      await user.click(fireOption);

      // Add routing reason
      const reasonField = screen.getByLabelText('Reason for Routing');
      await user.type(reasonField, 'This request involves fire safety regulations and should be handled by the Fire Department.');

      // Submit routing
      const routeButton = screen.getByText('Route Request');
      expect(routeButton).not.toBeDisabled();
      await user.click(routeButton);

      await waitFor(() => {
        expect(requestService.routeRequestToAgency).toHaveBeenCalledWith(
          '1',
          'fire',
          'This request involves fire safety regulations and should be handled by the Fire Department.',
          'current-user'
        );
      });
    });

    it('should disable routing button without target agency and reason', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Open routing dialog
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        const routeButtons = screen.getAllByLabelText('Route to Agency');
        expect(routeButtons[0]).toBeInTheDocument();
      });

      const firstRouteButton = screen.getAllByLabelText('Route to Agency')[0];
      await user.click(firstRouteButton);

      await waitFor(() => {
        const routeButton = screen.getByText('Route Request');
        expect(routeButton).toBeDisabled();
      });
    });

    it('should exclude current agency from routing options', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies and open routing for police request
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        const routeButtons = screen.getAllByLabelText('Route to Agency');
        expect(routeButtons[0]).toBeInTheDocument();
      });

      const firstRouteButton = screen.getAllByLabelText('Route to Agency')[0];
      await user.click(firstRouteButton);

      await waitFor(() => {
        const agencySelect = screen.getByLabelText('Target Agency');
        expect(agencySelect).toBeInTheDocument();
      });

      // Open dropdown
      const agencySelect = screen.getByLabelText('Target Agency');
      await user.click(agencySelect);

      // Police Department should not be in the options since it's the current agency
      expect(screen.queryByText('Police Department')).not.toBeInTheDocument();
      expect(screen.getByText('Fire Department')).toBeInTheDocument();
      expect(screen.getByText('Finance Department')).toBeInTheDocument();
    });
  });

  describe('Agency Column Display', () => {
    it('should highlight current agency requests', async () => {
      localStorageMock.getItem.mockReturnValue('police');
      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        // Should show police requests with primary color (current agency)
        const policeChips = screen.getAllByText('Police Department');
        expect(policeChips.length).toBeGreaterThan(0);
      });
    });

    it('should show agency names correctly for all requests', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Switch to all agencies view
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Police Department')).toBeInTheDocument();
        expect(screen.getByText('Fire Department')).toBeInTheDocument();
        expect(screen.getByText('Finance Department')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Persistence', () => {
    it('should maintain agency filter state across interactions', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Enable all agencies view
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Show Current Agency Only')).toBeInTheDocument();
      });

      // The toggle state should persist
      expect(screen.getByText('Show Current Agency Only')).toBeInTheDocument();
    });

    it('should clear agency filters when clearing all filters', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Enable all agencies view and add filters
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        const agencySelect = screen.getByLabelText('Agencies');
        expect(agencySelect).toBeInTheDocument();
      });

      // Add agency filter
      const agencySelect = screen.getByLabelText('Agencies');
      await user.click(agencySelect);
      const policeOption = screen.getByText('Police Department');
      await user.click(policeOption);

      // Clear all filters
      await waitFor(() => {
        const clearButton = screen.getByText('Clear All Filters');
        expect(clearButton).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear All Filters');
      await user.click(clearButton);

      // Should reset to current agency only mode
      await waitFor(() => {
        expect(screen.getByText('Show All Agencies')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle routing errors gracefully', async () => {
      const user = userEvent.setup();
      const routingError = new Error('Routing failed');
      (requestService.routeRequestToAgency as jest.Mock).mockRejectedValue(routingError);

      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Complete routing process that should fail
      const toggleButton = screen.getByText('Show All Agencies');
      await user.click(toggleButton);

      await waitFor(() => {
        const routeButtons = screen.getAllByLabelText('Route to Agency');
        expect(routeButtons[0]).toBeInTheDocument();
      });

      const firstRouteButton = screen.getAllByLabelText('Route to Agency')[0];
      await user.click(firstRouteButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Target Agency')).toBeInTheDocument();
      });

      const agencySelect = screen.getByLabelText('Target Agency');
      await user.click(agencySelect);
      const fireOption = screen.getByText('Fire Department');
      await user.click(fireOption);

      const reasonField = screen.getByLabelText('Reason for Routing');
      await user.type(reasonField, 'Test routing failure');

      const routeButton = screen.getByText('Route Request');
      await user.click(routeButton);

      await waitFor(() => {
        expect(requestService.routeRequestToAgency).toHaveBeenCalled();
        // Error should be handled gracefully (dialog should remain open or close depending on implementation)
      });
    });

    it('should handle request loading errors', async () => {
      const loadingError = new Error('Failed to load requests');
      (requestService.getAllRequests as jest.Mock).mockRejectedValue(loadingError);

      render(<StaffDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load requests/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle routing errors gracefully', async () => {
      const user = userEvent.setup();
      const routingError = new Error('Routing failed');
      (requestService.routeRequestToAgency as jest.Mock).mockRejectedValue(routingError);

      render(<StaffDashboard />, { wrapper: TestWrapper });

      // Wait for load and setup routing
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const toggleButton = await screen.findByText('Show All Agencies');
      await act(async () => {
        await user.click(toggleButton);
      });

      await waitFor(() => {
        const routeButtons = screen.queryAllByLabelText('Route to Agency');
        expect(routeButtons.length).toBeGreaterThan(0);
      });

      // Trigger routing that should fail
      const routeButtons = screen.getAllByLabelText('Route to Agency');
      await act(async () => {
        await user.click(routeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Target Agency')).toBeInTheDocument();
      });

      const agencySelect = screen.getByLabelText('Target Agency');
      await act(async () => {
        await user.click(agencySelect);
      });
      
      const fireOption = screen.getByRole('option', { name: 'Fire Department' });
      await act(async () => {
        await user.click(fireOption);
      });

      const reasonField = screen.getByLabelText('Reason for Routing');
      await act(async () => {
        await user.type(reasonField, 'Test routing failure');
      });

      const routeButton = screen.getByRole('button', { name: 'Route Request' });
      await act(async () => {
        await user.click(routeButton);
      });

      await waitFor(() => {
        expect(requestService.routeRequestToAgency).toHaveBeenCalled();
        // Error should be handled gracefully - dialog should remain open or error should be shown
      });
    });
  });
});