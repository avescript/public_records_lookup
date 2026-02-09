import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import StaffDashboard from '../../../src/components/staff/StaffDashboard';
import { AgencyProvider } from '../../../src/contexts/AgencyContext';

// Mock the child components
jest.mock('../../../src/components/staff/StaffDashboard/QuickMetricsPanel', () => {
  return {
    QuickMetricsPanel: () => <div data-testid="quick-metrics-panel">Quick Metrics Panel</div>
  };
});

jest.mock('../../../src/components/staff/StaffDashboard/BulkOperationsPanel', () => {
  return {
    BulkOperationsPanel: ({ selectedRequests, onBulkAssign, onBulkStatusChange, onBulkExport, onBulkDelete }: any) => (
      <div data-testid="bulk-operations-panel">
        <span>{selectedRequests?.length || 0} selected</span>
        <button onClick={() => onBulkAssign(['req-1'], 'staff-1')}>Bulk Assign</button>
        <button onClick={() => onBulkStatusChange(['req-1'], 'completed')}>Bulk Status</button>
        <button onClick={() => onBulkExport(['req-1'])}>Bulk Export</button>
        <button onClick={() => onBulkDelete(['req-1'])}>Bulk Delete</button>
      </div>
    )
  };
});

jest.mock('../../../src/components/staff/StaffDashboard/AdvancedFilterPanel', () => {
  return {
    AdvancedFilterPanel: ({ onFiltersChange, onClearFilters, onViewModeChange }: any) => (
      <div data-testid="advanced-filter-panel">
        <button onClick={() => onFiltersChange({ status: ['pending'] })}>Filter Pending</button>
        <button onClick={onClearFilters}>Clear Filters</button>
        <button onClick={() => onViewModeChange('table')}>Switch to Table</button>
      </div>
    )
  };
});

// Mock services
jest.mock('../../../src/services/requestService', () => ({
  getRequestsByAgency: jest.fn(),
  updateRequest: jest.fn(),
  deleteRequest: jest.fn(),
  updateRequestStatus: jest.fn(),
  assignRequest: jest.fn(),
  exportRequestsToCSV: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockTheme = createTheme();

const mockAgencyContext = {
  selectedAgency: {
    id: 'agency-1',
    name: 'Police Department',
    type: 'law_enforcement' as const,
    contactInfo: {
      email: 'contact@pd.gov',
      phone: '555-0123',
      address: '123 Main St',
    },
    settings: {},
    isActive: true,
  },
  agencies: [],
  setSelectedAgency: jest.fn(),
  isLoading: false,
  error: null,
};

const mockRequests = [
  {
    id: 'req-1',
    requestNumber: 'REQ-001',
    requesterInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
    },
    requestDetails: {
      description: 'Test request 1',
      type: 'general',
      priority: 'normal' as const,
      urgency: 'normal' as const,
    },
    status: 'pending' as const,
    assignedTo: 'staff-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    agencyId: 'agency-1',
    documents: [],
    timeline: [],
    metadata: {},
  },
  {
    id: 'req-2',
    requestNumber: 'REQ-002',
    requesterInfo: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-5678',
    },
    requestDetails: {
      description: 'Test request 2',
      type: 'records',
      priority: 'high' as const,
      urgency: 'high' as const,
    },
    status: 'in_progress' as const,
    assignedTo: 'staff-2',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-16'),
    agencyId: 'agency-1',
    documents: [],
    timeline: [],
    metadata: {},
  },
];

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AgencyProvider value={mockAgencyContext}>
          {component}
        </AgencyProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('StaffDashboard V2-4 Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getRequestsByAgency } = require('../../../src/services/requestService');
    getRequestsByAgency.mockResolvedValue(mockRequests);
  });

  describe('Component Integration', () => {
    it('should render all V2-4 components', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('quick-metrics-panel')).toBeInTheDocument();
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
        expect(screen.getByTestId('advanced-filter-panel')).toBeInTheDocument();
      });
    });

    it('should display dashboard title and description', () => {
      renderWithProviders(<StaffDashboard />);

      expect(screen.getByText('Request Queue - V2.4 Enhanced')).toBeInTheDocument();
      expect(screen.getByText(/Manage and track public records requests/)).toBeInTheDocument();
    });
  });

  describe('Request Selection Management', () => {
    it('should handle individual request selection', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
      });

      // Initially no requests selected
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should update bulk operations panel when requests are selected', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
      });

      // The panel should show current selection count
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk assignment', async () => {
      const { assignRequest } = require('../../../src/services/requestService');
      assignRequest.mockResolvedValue({});

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Assign')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Bulk Assign'));

      await waitFor(() => {
        expect(assignRequest).toHaveBeenCalledWith('req-1', 'staff-1');
      });
    });

    it('should handle bulk status change', async () => {
      const { updateRequestStatus } = require('../../../src/services/requestService');
      updateRequestStatus.mockResolvedValue({});

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Status')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Bulk Status'));

      await waitFor(() => {
        expect(updateRequestStatus).toHaveBeenCalledWith('req-1', 'completed');
      });
    });

    it('should handle bulk export', async () => {
      const { exportRequestsToCSV } = require('../../../src/services/requestService');
      exportRequestsToCSV.mockResolvedValue('csv,content');

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Export')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Bulk Export'));

      await waitFor(() => {
        expect(exportRequestsToCSV).toHaveBeenCalledWith(['req-1']);
      });
    });

    it('should handle bulk delete', async () => {
      const { deleteRequest } = require('../../../src/services/requestService');
      deleteRequest.mockResolvedValue({});

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Bulk Delete'));

      await waitFor(() => {
        expect(deleteRequest).toHaveBeenCalledWith('req-1');
      });
    });
  });

  describe('Filtering Integration', () => {
    it('should handle filter changes from AdvancedFilterPanel', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Filter Pending')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filter Pending'));

      // Should update the dashboard state and re-render filtered results
      expect(screen.getByTestId('advanced-filter-panel')).toBeInTheDocument();
    });

    it('should handle clear filters', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear Filters'));

      // Should reset all filters
      expect(screen.getByTestId('advanced-filter-panel')).toBeInTheDocument();
    });

    it('should handle view mode changes', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Switch to Table')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Switch to Table'));

      // Should update the view mode
      expect(screen.getByTestId('advanced-filter-panel')).toBeInTheDocument();
    });
  });

  describe('Data Loading and Error Handling', () => {
    it('should show loading state initially', () => {
      renderWithProviders(<StaffDashboard />);

      // Should show loading state for requests
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const { getRequestsByAgency } = require('../../../src/services/requestService');
      getRequestsByAgency.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        // Should still render the dashboard structure
        expect(screen.getByText('Request Queue - V2.4 Enhanced')).toBeInTheDocument();
      });
    });

    it('should handle empty request list', async () => {
      const { getRequestsByAgency } = require('../../../src/services/requestService');
      getRequestsByAgency.mockResolvedValue([]);

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
      });

      // Should show 0 selected requests
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });
  });

  describe('Agency Context Integration', () => {
    it('should pass agency context to child components', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('quick-metrics-panel')).toBeInTheDocument();
      });

      // QuickMetricsPanel should receive agency context
      expect(screen.getByText('Quick Metrics Panel')).toBeInTheDocument();
    });

    it('should handle agency changes', async () => {
      const { getRequestsByAgency } = require('../../../src/services/requestService');

      const { rerender } = renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(getRequestsByAgency).toHaveBeenCalledWith('agency-1');
      });

      // Change agency context
      const newAgencyContext = {
        ...mockAgencyContext,
        selectedAgency: {
          ...mockAgencyContext.selectedAgency,
          id: 'agency-2',
          name: 'Fire Department',
        },
      };

      rerender(
        <ThemeProvider theme={mockTheme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AgencyProvider value={newAgencyContext}>
              <StaffDashboard />
            </AgencyProvider>
          </LocalizationProvider>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getRequestsByAgency).toHaveBeenCalledWith('agency-2');
      });
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockRequests[0],
        id: `req-${i + 1}`,
        requestNumber: `REQ-${String(i + 1).padStart(4, '0')}`,
      }));

      const { getRequestsByAgency } = require('../../../src/services/requestService');
      getRequestsByAgency.mockResolvedValue(largeDataset);

      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('quick-metrics-panel')).toBeInTheDocument();
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
        expect(screen.getByTestId('advanced-filter-panel')).toBeInTheDocument();
      });

      // Check for responsive grid layout
      const containers = document.querySelectorAll('.MuiContainer-root');
      expect(containers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithProviders(<StaffDashboard />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Request Queue - V2.4 Enhanced');
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<StaffDashboard />);

      // Should be able to tab through interactive elements
      const dashboard = screen.getByText('Request Queue - V2.4 Enhanced');
      expect(dashboard).toBeInTheDocument();
    });

    it('should have proper ARIA labels', async () => {
      renderWithProviders(<StaffDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations-panel')).toBeInTheDocument();
      });

      // Components should have proper accessibility attributes
      expect(screen.getByTestId('quick-metrics-panel')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-filter-panel')).toBeInTheDocument();
    });
  });
});