import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getAllRequests } from '../../../src/services/requestService';
import '@testing-library/jest-dom';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock request service
jest.mock('../../../src/services/requestService', () => ({
  getAllRequests: jest.fn(),
}));

// Mock MUI Data Grid to avoid complex rendering issues
jest.mock('@mui/x-data-grid', () => ({
  DataGrid: ({ rows, columns, onRowClick }: any) => (
    <div data-testid="data-grid">
      <div data-testid="grid-rows-count">{rows.length} rows</div>
      {rows.map((row: any, index: number) => (
        <div 
          key={row.id || row.trackingId || index}
          data-testid={`grid-row-${row.trackingId}`}
          onClick={() => onRowClick && onRowClick({ row })}
        >
          {row.trackingId} - {row.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock MUI X Date Pickers
jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ label, onChange, value }: any) => (
    <input
      aria-label={label}
      data-testid={`date-picker-${label.toLowerCase().replace(' ', '-')}`}
      onChange={(e) => onChange && onChange(e.target.value ? new Date(e.target.value) : null)}
      value={value ? value.toISOString().split('T')[0] : ''}
      type="date"
    />
  ),
  LocalizationProvider: ({ children }: any) => children,
  AdapterDateFns: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
  has: jest.fn(),
  getAll: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(),
};

const mockRequests = [
  {
    id: '1',
    trackingId: 'REQ-001',
    title: 'Police Report Request',
    description: 'Request for incident report',
    department: 'police',
    status: 'submitted',
    contactEmail: 'user1@example.com',
    submittedAt: { toDate: () => new Date('2024-01-01') },
  },
  {
    id: '2',
    trackingId: 'REQ-002',
    title: 'Fire Inspection Records',
    description: 'Building inspection documents',
    department: 'fire',
    status: 'processing',
    contactEmail: 'user2@example.com',
    submittedAt: { toDate: () => new Date('2024-01-02') },
  },
  {
    id: '3',
    trackingId: 'REQ-003',
    title: 'Finance Budget Documents',
    description: 'Annual budget records',
    department: 'finance',
    status: 'completed',
    contactEmail: 'user3@example.com',
    submittedAt: { toDate: () => new Date('2024-01-03') },
  },
];

// Import the component after mocking
import { StaffDashboard } from '../../../src/components/staff/StaffDashboard';

describe('StaffDashboard Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (usePathname as jest.Mock).mockReturnValue('/staff');
    (getAllRequests as jest.Mock).mockResolvedValue(mockRequests);
    mockSearchParams.get.mockReturnValue(null);
  });

  describe('Basic Functionality', () => {
    test('renders dashboard title and loads requests', async () => {
      render(<StaffDashboard />);
      
      expect(screen.getByText('Request Queue')).toBeInTheDocument();
      expect(screen.getByText('Manage and track public records requests')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
        expect(screen.getByText('REQ-001 - Police Report Request')).toBeInTheDocument();
      });
    });

    test('displays loading state initially', () => {
      render(<StaffDashboard />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('displays filter controls', async () => {
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Departments')).toBeInTheDocument();
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search requests/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('filters requests by search query', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
        expect(screen.getByText('REQ-001 - Police Report Request')).toBeInTheDocument();
        expect(screen.queryByText('REQ-002 - Fire Inspection Records')).not.toBeInTheDocument();
      });
    });

    test('shows clear button when search has value and clears search', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });

    test('searches by tracking ID', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'REQ-002');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
        expect(screen.getByText('REQ-002 - Fire Inspection Records')).toBeInTheDocument();
      });
    });

    test('searches by description', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'incident report');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
        expect(screen.getByText('REQ-001 - Police Report Request')).toBeInTheDocument();
      });
    });
  });

  describe('Department Filtering', () => {
    test('displays department filter options', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Departments')).toBeInTheDocument();
      });

      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      
      expect(screen.getByText('Police Department')).toBeInTheDocument();
      expect(screen.getByText('Fire Department')).toBeInTheDocument();
      expect(screen.getByText('Finance Department')).toBeInTheDocument();
    });
  });

  describe('Status Filtering', () => {
    test('displays status filter options', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      
      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Date Range Filtering', () => {
    test('renders date picker components', async () => {
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('date-picker-start-date')).toBeInTheDocument();
        expect(screen.getByTestId('date-picker-end-date')).toBeInTheDocument();
      });
    });
  });

  describe('Clear All Filters', () => {
    test('shows clear all filters button when search is active', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
      });
    });

    test('clears all filters when clear all button is clicked', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });

      const clearAllButton = screen.getByText('Clear All Filters');
      await user.click(clearAllButton);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('URL Parameter Synchronization', () => {
    test('loads filters from URL parameters on initial load', () => {
      mockSearchParams.get.mockImplementation((key) => {
        if (key === 'departments') return 'police,fire';
        if (key === 'statuses') return 'submitted';
        if (key === 'search') return 'test query';
        return null;
      });

      render(<StaffDashboard />);
      
      expect(mockSearchParams.get).toHaveBeenCalledWith('departments');
      expect(mockSearchParams.get).toHaveBeenCalledWith('statuses');
      expect(mockSearchParams.get).toHaveBeenCalledWith('search');
      expect(mockSearchParams.get).toHaveBeenCalledWith('startDate');
      expect(mockSearchParams.get).toHaveBeenCalledWith('endDate');
    });

    test('updates URL when search changes', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      // Wait for debounced URL update
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Request Selection', () => {
    test('calls onRequestSelect when row is clicked', async () => {
      const mockOnRequestSelect = jest.fn();
      render(<StaffDashboard onRequestSelect={mockOnRequestSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001 - Police Report Request')).toBeInTheDocument();
      });

      const row = screen.getByTestId('grid-row-REQ-001');
      fireEvent.click(row);
      
      expect(mockOnRequestSelect).toHaveBeenCalledWith(expect.objectContaining({
        trackingId: 'REQ-001'
      }));
    });
  });

  describe('Error Handling', () => {
    test('displays error message when request loading fails', async () => {
      (getAllRequests as jest.Mock).mockRejectedValue(new Error('Failed to load'));
      
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filtering', () => {
    test('shows no results message when search excludes all requests', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 0 of 3 requests')).toBeInTheDocument();
      });
    });
  });
});