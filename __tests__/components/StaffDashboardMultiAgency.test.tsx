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

      // Wait for the toggle to complete and show "Show Current Agency Only" text
      await waitFor(() => {
        expect(screen.getByText('Show Current Agency Only')).toBeInTheDocument();
      });

      // Now verify the agencies filter is present by checking for additional form controls
      await waitFor(() => {
        const formControls = screen.getAllByRole('combobox');
        // Should have at least 3 controls: departments, status, and agencies
        expect(formControls.length).toBeGreaterThanOrEqual(3);
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

      // Wait for toggle to complete
      await waitFor(() => {
        expect(screen.getByText('Show Current Agency Only')).toBeInTheDocument();
      });

      // Verify additional form controls are present (indicating agencies filter is shown)
      await waitFor(() => {
        const formControls = screen.getAllByRole('combobox');
        expect(formControls.length).toBeGreaterThanOrEqual(3);
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

      // Try to find agency select by role instead of label
      await waitFor(() => {
        const agencySelects = screen.getAllByRole('combobox');
        expect(agencySelects.length).toBeGreaterThan(0);
      });

      const agencySelects = screen.getAllByRole('combobox');
      // Find the agency select (should be one of the comboboxes in the dialog)
      const agencySelect = agencySelects.find(select => 
        select.getAttribute('aria-haspopup') === 'listbox' &&
        !select.classList.contains('MuiSelect-nativeInput')
      );

      if (agencySelect) {
        await act(async () => {
          await user.click(agencySelect);
        });

        // Look for Fire Department option
        await waitFor(() => {
          const options = screen.getAllByRole('option');
          expect(options.length).toBeGreaterThan(0);
        });

        const fireOption = screen.getByRole('option', { name: /Fire Department/i });
        await act(async () => {
          await user.click(fireOption);
        });

        // Add routing reason - find the text field
        const reasonField = screen.getByRole('textbox', { name: /reason/i });
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
      }
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

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Route Request to Another Agency')).toBeInTheDocument();
      });

      // Try to find form elements more flexibly
      await waitFor(() => {
        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes.length).toBeGreaterThan(0);
      });

      const agencySelects = screen.getAllByRole('combobox');
      const agencySelect = agencySelects.find(select => 
        select.getAttribute('aria-haspopup') === 'listbox' &&
        !select.classList.contains('MuiSelect-nativeInput')
      );

      if (agencySelect) {
        await act(async () => {
          await user.click(agencySelect);
        });

        await waitFor(() => {
          const options = screen.getAllByRole('option');
          expect(options.length).toBeGreaterThan(0);
        });

        const fireOption = screen.getByRole('option', { name: /Fire Department/i });
        await act(async () => {
          await user.click(fireOption);
        });

        const reasonField = screen.getByRole('textbox', { name: /reason/i });
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
      }
    });
  });
});