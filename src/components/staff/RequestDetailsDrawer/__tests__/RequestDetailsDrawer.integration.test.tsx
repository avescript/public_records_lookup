import React from 'react';
import { createTheme,ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';

import { RequestStatus,StoredRequest } from '../../../../services/requestService';
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

describe('RequestDetailsDrawer - Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnStatusUpdate = jest.fn();
  const mockOnNotesAdd = jest.fn();

  const baseRequest: StoredRequest = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (updateRequestStatus as jest.Mock).mockResolvedValue(undefined);
    (addInternalNote as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Core Component Functionality', () => {
    it('renders drawer with essential request information', () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      // Verify basic structure
      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.getByText('Request Information')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      
      // Verify request details
      expect(screen.getByText('TR-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Police Report Request')).toBeInTheDocument();
      expect(screen.getByText('Police')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={false}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Request Details')).not.toBeInTheDocument();
    });

    it('handles null request gracefully', () => {
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

      // Should not render the drawer content when request is null
      expect(screen.queryByText('TR-2024-001')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
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
  });

  describe('Internal Notes System', () => {
    it('shows message when no internal notes exist', () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
      expect(screen.getByText('No internal notes yet')).toBeInTheDocument();
      expect(screen.getByText('Add Note')).toBeInTheDocument();
    });

    it('allows adding new internal notes', async () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      const user = userEvent.setup();
      
      // Click Add Note button to show input
      const addButton = screen.getByText('Add Note');
      await user.click(addButton);

      // Find and fill the note input
      const noteInput = screen.getByPlaceholderText('Add an internal note about this request...');
      await user.type(noteInput, 'Follow up with requester');

      // Find and click the actual Add Note button in the form
      const submitButton = screen.getAllByText('Add Note')[1]; // Second instance
      await user.click(submitButton);

      await waitFor(() => {
        expect(addInternalNote).toHaveBeenCalledWith('req123', 'Follow up with requester');
        expect(mockOnNotesAdd).toHaveBeenCalledWith('req123', 'Follow up with requester');
      });
    });

    it('validates empty note input', async () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      const user = userEvent.setup();
      
      // Click Add Note button to show input
      const addButton = screen.getByText('Add Note');
      await user.click(addButton);

      // Try to submit without entering text
      const submitButton = screen.getAllByText('Add Note')[1];
      expect(submitButton).toBeDisabled();

      expect(addInternalNote).not.toHaveBeenCalled();
      expect(mockOnNotesAdd).not.toHaveBeenCalled();
    });

    it('allows canceling note addition', async () => {
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      const user = userEvent.setup();
      
      // Click Add Note button to show input
      const addButton = screen.getByText('Add Note');
      await user.click(addButton);

      // Enter some text
      const noteInput = screen.getByPlaceholderText('Add an internal note about this request...');
      await user.type(noteInput, 'Test note');

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should go back to showing just the Add Note button
      expect(screen.queryByPlaceholderText('Add an internal note about this request...')).not.toBeInTheDocument();
      expect(addInternalNote).not.toHaveBeenCalled();
    });
  });

  describe('Service Integration', () => {
    it('handles service errors gracefully', async () => {
      (addInternalNote as jest.Mock).mockRejectedValue(new Error('Service error'));
      
      render(
        <TestWrapper>
          <RequestDetailsDrawer
            open={true}
            request={baseRequest}
            onClose={mockOnClose}
            onStatusUpdate={mockOnStatusUpdate}
            onNotesAdd={mockOnNotesAdd}
          />
        </TestWrapper>
      );

      const user = userEvent.setup();
      
      const addButton = screen.getByText('Add Note');
      await user.click(addButton);

      const noteInput = screen.getByPlaceholderText('Add an internal note about this request...');
      await user.type(noteInput, 'Test note');

      const submitButton = screen.getAllByText('Add Note')[1];
      await user.click(submitButton);

      await waitFor(() => {
        expect(addInternalNote).toHaveBeenCalled();
      });

      // Component should not crash
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });
  });
});