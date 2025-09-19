import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { StaffDashboard } from '../../../src/components/staff/StaffDashboard';
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

// Mock MUI X Date Pickers components
jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ label, onChange, value, slotProps }: any) => (
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

// Mock date fns
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: jest.fn((date, formatStr) => {
      if (formatStr === 'MMM d, yyyy h:mm a') return 'Jan 1, 2024 10:00 AM';
      if (formatStr === 'MMM d, yyyy') return 'Jan 10, 2024';
      return 'Jan 1, 2024';
    }),
    differenceInBusinessDays: jest.fn(() => 5),
    addBusinessDays: jest.fn(() => new Date('2024-01-10')),
    isAfter: jest.fn(() => true),
    isBefore: jest.fn(() => true),
    startOfDay: jest.fn((date) => date),
    endOfDay: jest.fn((date) => date),
  };
});

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

describe('StaffDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (usePathname as jest.Mock).mockReturnValue('/staff');
    (getAllRequests as jest.Mock).mockResolvedValue(mockRequests);
    mockSearchParams.get.mockReturnValue(null);
  });

  describe('Initial Rendering', () => {
    test('renders dashboard with title and description', async () => {
      render(<StaffDashboard />);
      
      expect(screen.getByText('Request Queue')).toBeInTheDocument();
      expect(screen.getByText('Manage and track public records requests')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });
    });

    test('displays loading state initially', () => {
      render(<StaffDashboard />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('loads and displays requests in data grid', async () => {
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
        expect(screen.getByText('Police Report Request')).toBeInTheDocument();
        expect(screen.getByText('REQ-002')).toBeInTheDocument();
        expect(screen.getByText('Fire Inspection Records')).toBeInTheDocument();
      });
    });
  });

  describe('Department Filtering', () => {
    test('filters requests by selected departments', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      // Open department filter
      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      
      // Select police department
      const policeOption = screen.getByText('Police Department');
      await user.click(policeOption);
      
      // Close dropdown by clicking outside
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });
    });

    test('displays selected department chips', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      
      const policeOption = screen.getByText('Police Department');
      await user.click(policeOption);
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.getByText('Police Department')).toBeInTheDocument();
      });
    });

    test('allows multiple department selection', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      
      await user.click(screen.getByText('Police Department'));
      await user.click(screen.getByText('Fire Department'));
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering', () => {
    test('filters requests by selected status', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      
      const submittedOption = screen.getByText('Submitted');
      await user.click(submittedOption);
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });
    });

    test('allows multiple status selection', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      
      await user.click(screen.getByText('Submitted'));
      await user.click(screen.getByText('Processing'));
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('filters requests by search query in title', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });
    });

    test('filters requests by search query in description', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'incident report');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });
    });

    test('filters requests by tracking ID', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'REQ-002');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });
    });

    test('shows clear button when search has value', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      });
    });

    test('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 requests')).toBeInTheDocument();
      });
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

    test('filters by start date', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const startDatePicker = screen.getByTestId('date-picker-start-date');
      await user.type(startDatePicker, '2024-01-02');
      
      // Should filter out requests before the start date
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 requests')).toBeInTheDocument();
      });
    });

    test('filters by end date', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const endDatePicker = screen.getByTestId('date-picker-end-date');
      await user.type(endDatePicker, '2024-01-02');
      
      // Should filter out requests after the end date
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Clear All Filters', () => {
    test('shows clear all filters button when filters are active', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      // Add a department filter
      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      await user.click(screen.getByText('Police Department'));
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
      });
    });

    test('clears all filters when clear all button is clicked', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      // Add filters
      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      await user.click(screen.getByText('Police Department'));
      await user.keyboard('{Escape}');

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
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
      
      // Verify that URL parameters were attempted to be read
      expect(mockSearchParams.get).toHaveBeenCalledWith('departments');
      expect(mockSearchParams.get).toHaveBeenCalledWith('statuses');
      expect(mockSearchParams.get).toHaveBeenCalledWith('search');
      expect(mockSearchParams.get).toHaveBeenCalledWith('startDate');
      expect(mockSearchParams.get).toHaveBeenCalledWith('endDate');
    });

    test('updates URL when filters change', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      // Add a department filter
      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      await user.click(screen.getByText('Police Department'));
      await user.keyboard('{Escape}');
      
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
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const row = screen.getByText('REQ-001').closest('[role="row"]');
      fireEvent.click(row!);
      
      expect(mockOnRequestSelect).toHaveBeenCalledWith(expect.objectContaining({
        trackingId: 'REQ-001'
      }));
    });

    test('calls onRequestSelect when view button is clicked', async () => {
      const mockOnRequestSelect = jest.fn();
      render(<StaffDashboard onRequestSelect={mockOnRequestSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByLabelText('View Details');
      fireEvent.click(viewButtons[0]);
      
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

  describe('Combined Filters', () => {
    test('applies multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      // Add department filter
      const departmentSelect = screen.getByLabelText('Departments');
      await user.click(departmentSelect);
      await user.click(screen.getByText('Police Department'));
      await user.keyboard('{Escape}');

      // Add search filter
      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'Police');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
      });
    });

    test('shows no results when filters exclude all requests', async () => {
      const user = userEvent.setup();
      render(<StaffDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search requests/);
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('Showing 0 of 3 requests')).toBeInTheDocument();
      });
    });
  });
});