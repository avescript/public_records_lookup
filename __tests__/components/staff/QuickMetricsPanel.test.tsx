import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QuickMetricsPanel } from '../../../src/components/staff/StaffDashboard/QuickMetricsPanel';
import { AgencyProvider } from '../../../src/contexts/AgencyContext';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => 'Nov 15'),
  differenceInBusinessDays: jest.fn(() => 5),
  addBusinessDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
}));

const mockTheme = createTheme();

const mockAgencyContext = {
  currentAgency: {
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
  setCurrentAgency: jest.fn(),
  isLoading: false,
  error: null,
};

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <AgencyProvider value={mockAgencyContext}>
        {component}
      </AgencyProvider>
    </ThemeProvider>
  );
};

describe('QuickMetricsPanel', () => {
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
        description: 'Test request',
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
        description: 'Another request',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the panel title with agency name', () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      expect(screen.getByText('Quick Metrics')).toBeInTheDocument();
      expect(screen.getByText('Police Department')).toBeInTheDocument();
    });

    it('should display loading state', () => {
      renderWithProviders(<QuickMetricsPanel requests={[]} loading={true} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render metric cards when not loading', () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });
  });

  describe('Metrics Calculations', () => {
    it('should calculate total requests correctly', () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should handle empty request list', () => {
      renderWithProviders(<QuickMetricsPanel requests={[]} loading={false} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Agency Context Integration', () => {
    it('should display agency name from context', () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      expect(screen.getByText('Police Department')).toBeInTheDocument();
    });

    it('should handle missing agency gracefully', () => {
      const noAgencyContext = {
        ...mockAgencyContext,
        currentAgency: null,
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <AgencyProvider value={noAgencyContext}>
            <QuickMetricsPanel requests={mockRequests} loading={false} />
          </AgencyProvider>
        </ThemeProvider>
      );

      expect(screen.getByText('Quick Metrics')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockRequests[0],
        id: `req-${i + 1}`,
        requestNumber: `REQ-${String(i + 1).padStart(4, '0')}`,
      }));

      renderWithProviders(<QuickMetricsPanel requests={largeDataset} loading={false} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});

describe('QuickMetricsPanel', () => {
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
        description: 'Test request',
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
        description: 'Another request',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel title with agency name', async () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      expect(screen.getByText('Quick Metrics')).toBeInTheDocument();
      expect(screen.getByText('Police Department')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      renderWithProviders(<QuickMetricsPanel requests={[]} loading={true} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render all metric cards after loading', async () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check for metric card labels
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Avg. Processing')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  describe('Metrics Calculations', () => {
    it('should calculate total requests correctly', async () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByText('2')).toBeInTheDocument(); // Total requests
    });

    it('should calculate status-based metrics', async () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show 1 pending and 1 in progress
      const metricValues = screen.getAllByText('1');
      expect(metricValues.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate high priority requests', async () => {
      renderWithProviders(<QuickMetricsPanel requests={mockRequests} loading={false} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // One high priority request
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity section', async () => {
      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should show recent request updates', async () => {
      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check for request details in recent activity
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should limit recent activity to 5 items', async () => {
      const manyRequests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequests[0],
        id: `req-${i + 1}`,
        requestNumber: `REQ-${String(i + 1).padStart(3, '0')}`,
        updatedAt: new Date(2024, 0, 20 - i), // Different dates for sorting
      }));

      const { getRequestsByAgency } = require('../../../src/services/requestService');
      getRequestsByAgency.mockResolvedValue(manyRequests);

      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should only show first 5 requests in recent activity
      expect(screen.getAllByText(/REQ-/).length).toBeLessThanOrEqual(5);
    });
  });

  describe('Progress Tracking', () => {
    it('should display completion progress bar', async () => {
      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Look for progress indicators in metric cards
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should show completion percentage', async () => {
      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        // Main loading should be gone, but progress bars for metrics should be visible
        const loadingIndicators = screen.getAllByRole('progressbar');
        expect(loadingIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { getRequestsByAgency } = require('../../../src/services/requestService');
      getRequestsByAgency.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should still render the panel structure
      expect(screen.getByText('Quick Metrics')).toBeInTheDocument();
    });

    it('should handle empty data', async () => {
      const { getRequestsByAgency } = require('../../../src/services/requestService');
      getRequestsByAgency.mockResolvedValue([]);

      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show zero values
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Agency Context', () => {
    it('should handle missing agency context', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <QuickMetricsPanel />
        </ThemeProvider>
      );

      expect(screen.getByText('Quick Metrics')).toBeInTheDocument();
    });

    it('should update when agency changes', async () => {
      const differentAgency = {
        ...mockAgencyContext,
        selectedAgency: {
          ...mockAgencyContext.selectedAgency,
          id: 'agency-2',
          name: 'Fire Department',
        },
      };

      render(
        <ThemeProvider theme={mockTheme}>
          <AgencyProvider value={differentAgency}>
            <QuickMetricsPanel />
          </AgencyProvider>
        </ThemeProvider>
      );

      expect(screen.getByText('Fire Department')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render metric cards in a responsive grid', async () => {
      renderWithProviders(<QuickMetricsPanel />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check for grid container structure
      const gridContainers = document.querySelectorAll('.MuiGrid-container');
      expect(gridContainers.length).toBeGreaterThan(0);
    });
  });
});