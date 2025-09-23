import React from 'react';
import { createTheme,ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';

import { InternalNote,RequestStatus, StoredRequest } from '../../../../services/requestService';
import { RequestDetailsDrawer } from '../index';

// Mock the request service
jest.mock('../../../../services/requestService', () => ({
  updateRequestStatus: jest.fn(),
  addInternalNote: jest.fn(),
}));

import { addInternalNote,updateRequestStatus } from '../../../../services/requestService';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RequestDetailsDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnStatusUpdate = jest.fn();
  const mockOnNotesAdd = jest.fn();

  const mockInternalNotes: InternalNote[] = [
    {
      id: 'note1',
      content: 'Initial review completed',
      addedBy: 'John Smith',
      addedAt: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
    },
    {
      id: 'note2',
      content: 'Waiting for additional documentation',
      addedBy: 'Jane Doe',
      addedAt: Timestamp.fromDate(new Date('2024-01-16T14:30:00Z')),
    },
  ];

  const mockRequest: StoredRequest = {
    id: 'req123',
    trackingId: 'TR-2024-001',
    title: 'Police Report Request',
    contactEmail: 'john.doe@example.com',
    department: 'Police',
    description: 'Request for incident report from January 1st',
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      preset: 'single-day',
    },
    status: 'Under Review' as RequestStatus,
    submittedAt: Timestamp.fromDate(new Date('2024-01-15T09:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-01-16T15:00:00Z')),
    attachmentCount: 0,
    internalNotes: mockInternalNotes,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (updateRequestStatus as jest.Mock).mockResolvedValue(undefined);
    (addInternalNote as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Drawer Display', () => {
    it('renders drawer when open', () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.getByText('TR-2024-001')).toBeInTheDocument();
    });

    it('does not render drawer when closed', () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={false}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Request Details')).not.toBeInTheDocument();
    });

    it('renders without request data', () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={null}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.queryByText('TR-2024-001')).not.toBeInTheDocument();
    });
  });

  describe('Request Information Display', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );
    });

    it('displays tracking ID and basic information', () => {
      expect(screen.getByText('TR-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Police')).toBeInTheDocument();
      expect(screen.getByText('Police Report Request')).toBeInTheDocument();
      expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
    });

    it('displays contact information', () => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('displays request description', () => {
      expect(screen.getByText('Request for incident report from January 1st')).toBeInTheDocument();
    });

    it('displays submission and update dates', () => {
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    });
  });

  describe('Status Management', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );
    });

    it('displays current status as chip', () => {
      expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
    });

    it('shows edit button for status', () => {
      expect(screen.getByLabelText(/edit status/i)).toBeInTheDocument();
    });

    it('allows editing status when edit button is clicked', async () => {
      const user = userEvent.setup();
      const editButton = screen.getByLabelText(/edit status/i);
      
      await user.click(editButton);

      // Should show dropdown with current status
      expect(screen.getByDisplayValue('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('saves status change when save button is clicked', async () => {
      const user = userEvent.setup();
      const editButton = screen.getByLabelText(/edit status/i);
      
      await user.click(editButton);

      const statusSelect = screen.getByDisplayValue('Under Review');
      await user.click(statusSelect);
      
      const completedOption = screen.getByText('Completed');
      await user.click(completedOption);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateRequestStatus).toHaveBeenCalledWith('req123', 'Completed');
        expect(mockOnStatusUpdate).toHaveBeenCalledWith('req123', 'Completed');
      });
    });

    it('cancels status editing without saving', async () => {
      const user = userEvent.setup();
      const editButton = screen.getByLabelText(/edit status/i);
      
      await user.click(editButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should go back to chip display
      expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
      expect(updateRequestStatus).not.toHaveBeenCalled();
    });

    it('displays all available status options when editing', async () => {
      const user = userEvent.setup();
      const editButton = screen.getByLabelText(/edit status/i);
      
      await user.click(editButton);

      const statusSelect = screen.getByDisplayValue('Under Review');
      await user.click(statusSelect);

      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Pending Information')).toBeInTheDocument();
      expect(screen.getByText('Ready for Release')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Denied')).toBeInTheDocument();
    });
  });

  describe('Internal Notes System', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );
    });

    it('displays existing internal notes', () => {
      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
      expect(screen.getByText('Initial review completed')).toBeInTheDocument();
      expect(screen.getByText('Waiting for additional documentation')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('displays formatted timestamps for notes', () => {
      // Notes should show relative time or formatted dates
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
    });

    it('allows adding new internal notes', async () => {
      const user = userEvent.setup();
      const noteInput = screen.getByPlaceholderText('Add internal note...');
      const addButton = screen.getByText('Add Note');

      await user.type(noteInput, 'Follow up with requester');
      await user.click(addButton);

      await waitFor(() => {
        expect(addInternalNote).toHaveBeenCalledWith('req123', 'Follow up with requester');
        expect(mockOnNotesAdd).toHaveBeenCalledWith('req123', 'Follow up with requester');
      });

      // Input should be cleared after successful submission
      expect(noteInput).toHaveValue('');
    });

    it('validates note input before submission', async () => {
      const user = userEvent.setup();
      const addButton = screen.getByText('Add Note');

      await user.click(addButton);

      // Should not call service with empty note
      expect(addInternalNote).not.toHaveBeenCalled();
      expect(mockOnNotesAdd).not.toHaveBeenCalled();
    });

    it('handles note addition errors gracefully', async () => {
      (addInternalNote as jest.Mock).mockRejectedValue(new Error('Add note failed'));
      const user = userEvent.setup();
      
      const noteInput = screen.getByPlaceholderText('Add internal note...');
      const addButton = screen.getByText('Add Note');

      await user.type(noteInput, 'Test note');
      await user.click(addButton);

      await waitFor(() => {
        expect(addInternalNote).toHaveBeenCalled();
        // Input should retain value on error
        expect(noteInput).toHaveValue('Test note');
      });
    });

    it('displays message when no internal notes exist', () => {
      const requestWithoutNotes = { ...mockRequest, internalNotes: [] };
      
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={requestWithoutNotes}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      expect(screen.getByText('No internal notes yet')).toBeInTheDocument();
    });
  });

  describe('Drawer Interaction', () => {
    it('calls onClose when close button is clicked', async () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      const user = userEvent.setup();
      const closeButton = screen.getByLabelText('close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking outside drawer', async () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      // Simulate clicking on backdrop
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Timeline and Activity', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );
    });

    it('displays timeline section', () => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('shows timestamps for request lifecycle', () => {
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={mockRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );
    });

    it('has proper ARIA labels', () => {
      expect(screen.getByLabelText('close')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('aria-label', 'close');
    });
  });
});