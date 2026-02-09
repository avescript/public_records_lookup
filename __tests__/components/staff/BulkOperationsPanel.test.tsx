import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BulkOperationsPanel } from '../../../src/components/staff/StaffDashboard/BulkOperationsPanel';

const mockTheme = createTheme();

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

const defaultProps = {
  selectedRequests: ['req-1', 'req-2'],
  requests: mockRequests,
  onBulkAssign: jest.fn(),
  onBulkStatusChange: jest.fn(),
  onBulkExport: jest.fn(),
  onBulkDelete: jest.fn(),
};

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('BulkOperationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel title', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    });

    it('should display selection count', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      expect(screen.getByText('2 requests selected')).toBeInTheDocument();
    });

    it('should show all operation buttons when requests are selected', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      expect(screen.getByText('Assign To')).toBeInTheDocument();
      expect(screen.getByText('Change Status')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should disable buttons when no requests are selected', () => {
      renderWithTheme(
        <BulkOperationsPanel 
          {...defaultProps} 
          selectedRequests={[]} 
        />
      );
      
      expect(screen.getByText('0 requests selected')).toBeInTheDocument();
      
      // All buttons should be disabled
      const assignButton = screen.getByRole('button', { name: /assign to/i });
      const statusButton = screen.getByRole('button', { name: /change status/i });
      const exportButton = screen.getByRole('button', { name: /export csv/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      
      expect(assignButton).toBeDisabled();
      expect(statusButton).toBeDisabled();
      expect(exportButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Assignment Operations', () => {
    it('should open assignment dialog when clicking Assign To', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Assign To'));
      
      expect(screen.getByText('Assign Requests')).toBeInTheDocument();
      expect(screen.getByText('Select a staff member to assign 2 requests to:')).toBeInTheDocument();
    });

    it('should show available staff members in assignment dialog', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Assign To'));
      
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Mike Wilson')).toBeInTheDocument();
    });

    it('should call onBulkAssign when confirming assignment', async () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Assign To'));
      
      // Select a staff member
      fireEvent.click(screen.getByText('John Smith'));
      
      // Confirm assignment
      fireEvent.click(screen.getByText('Assign'));
      
      await waitFor(() => {
        expect(defaultProps.onBulkAssign).toHaveBeenCalledWith(
          ['req-1', 'req-2'],
          'john-smith'
        );
      });
    });

    it('should close assignment dialog when canceling', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Assign To'));
      expect(screen.getByText('Assign Requests')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Assign Requests')).not.toBeInTheDocument();
    });
  });

  describe('Status Change Operations', () => {
    it('should open status change dialog when clicking Change Status', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Change Status'));
      
      expect(screen.getByText('Change Request Status')).toBeInTheDocument();
      expect(screen.getByText('Select new status for 2 requests:')).toBeInTheDocument();
    });

    it('should show available status options', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Change Status'));
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should call onBulkStatusChange when confirming status change', async () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Change Status'));
      
      // Select a status
      fireEvent.click(screen.getByText('Completed'));
      
      // Confirm status change
      fireEvent.click(screen.getByText('Update Status'));
      
      await waitFor(() => {
        expect(defaultProps.onBulkStatusChange).toHaveBeenCalledWith(
          ['req-1', 'req-2'],
          'completed'
        );
      });
    });
  });

  describe('Export Operations', () => {
    it('should call onBulkExport when clicking Export CSV', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Export CSV'));
      
      expect(defaultProps.onBulkExport).toHaveBeenCalledWith(['req-1', 'req-2']);
    });
  });

  describe('Delete Operations', () => {
    it('should open delete confirmation dialog when clicking Delete', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Delete'));
      
      expect(screen.getByText('Delete Requests')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete 2 requests/)).toBeInTheDocument();
    });

    it('should show warning message in delete dialog', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Delete'));
      
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('should call onBulkDelete when confirming deletion', async () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Delete'));
      
      // Confirm deletion
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      
      await waitFor(() => {
        expect(defaultProps.onBulkDelete).toHaveBeenCalledWith(['req-1', 'req-2']);
      });
    });

    it('should close delete dialog when canceling', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Delete'));
      expect(screen.getByText('Delete Requests')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Delete Requests')).not.toBeInTheDocument();
    });
  });

  describe('Selection Management', () => {
    it('should update display when selection changes', () => {
      const { rerender } = renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      expect(screen.getByText('2 requests selected')).toBeInTheDocument();
      
      rerender(
        <ThemeProvider theme={mockTheme}>
          <BulkOperationsPanel 
            {...defaultProps} 
            selectedRequests={['req-1']}
          />
        </ThemeProvider>
      );
      
      expect(screen.getByText('1 request selected')).toBeInTheDocument();
    });

    it('should handle single vs plural selection text', () => {
      renderWithTheme(
        <BulkOperationsPanel 
          {...defaultProps} 
          selectedRequests={['req-1']}
        />
      );
      
      expect(screen.getByText('1 request selected')).toBeInTheDocument();
    });
  });

  describe('Dialog States', () => {
    it('should not show multiple dialogs at once', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      // Open assignment dialog
      fireEvent.click(screen.getByText('Assign To'));
      expect(screen.getByText('Assign Requests')).toBeInTheDocument();
      
      // Assignment dialog should close when opening another
      fireEvent.click(screen.getByText('Change Status'));
      expect(screen.queryByText('Assign Requests')).not.toBeInTheDocument();
      expect(screen.getByText('Change Request Status')).toBeInTheDocument();
    });

    it('should reset form states when closing dialogs', async () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      // Open and cancel assignment dialog
      fireEvent.click(screen.getByText('Assign To'));
      fireEvent.click(screen.getByText('John Smith'));
      fireEvent.click(screen.getByText('Cancel'));
      
      // Reopen assignment dialog - selection should be reset
      fireEvent.click(screen.getByText('Assign To'));
      
      // The previously selected option should not be selected
      await waitFor(() => {
        const johnSmithButton = screen.getByText('John Smith');
        expect(johnSmithButton).not.toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing request data gracefully', () => {
      renderWithTheme(
        <BulkOperationsPanel 
          {...defaultProps} 
          requests={[]}
          selectedRequests={['req-1']}
        />
      );
      
      expect(screen.getByText('1 request selected')).toBeInTheDocument();
    });

    it('should handle undefined selectedRequests', () => {
      renderWithTheme(
        <BulkOperationsPanel 
          {...defaultProps} 
          selectedRequests={undefined as any}
        />
      );
      
      expect(screen.getByText('0 requests selected')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large selections efficiently', () => {
      const largeSelection = Array.from({ length: 100 }, (_, i) => `req-${i}`);
      
      renderWithTheme(
        <BulkOperationsPanel 
          {...defaultProps} 
          selectedRequests={largeSelection}
        />
      );
      
      expect(screen.getByText('100 requests selected')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for buttons', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      const assignButton = screen.getByRole('button', { name: /assign to/i });
      const statusButton = screen.getByRole('button', { name: /change status/i });
      const exportButton = screen.getByRole('button', { name: /export csv/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      
      expect(assignButton).toHaveAttribute('aria-label');
      expect(statusButton).toHaveAttribute('aria-label');
      expect(exportButton).toHaveAttribute('aria-label');
      expect(deleteButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation in dialogs', () => {
      renderWithTheme(<BulkOperationsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Assign To'));
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });
});