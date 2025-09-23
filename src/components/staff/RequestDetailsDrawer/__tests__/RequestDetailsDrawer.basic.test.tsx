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

describe('RequestDetailsDrawer - Core Functionality', () => {
  const mockOnClose = jest.fn();
  const mockOnStatusUpdate = jest.fn();
  const mockOnNotesAdd = jest.fn();

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
    internalNotes: [
      {
        id: 'note1',
        content: 'Initial review completed',
        addedBy: 'John Smith',
        addedAt: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (updateRequestStatus as jest.Mock).mockResolvedValue(undefined);
    (addInternalNote as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Basic Rendering', () => {
    it('renders when open with request data', () => {
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
      expect(screen.getByText('Police Report Request')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
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

      // Component should render but not show request details
      expect(screen.queryByText('TR-2024-001')).not.toBeInTheDocument();
    });
  });

  describe('Request Information', () => {
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

    it('displays essential request details', () => {
      expect(screen.getByText('TR-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Police')).toBeInTheDocument();
      expect(screen.getByText('Police Report Request')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Request for incident report from January 1st')).toBeInTheDocument();
    });
  });

  describe('Internal Notes', () => {
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

    it('displays existing notes', () => {
      expect(screen.getByText('Internal Notes')).toBeInTheDocument();
      expect(screen.getByText('Initial review completed')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('allows adding new notes', async () => {
      const user = userEvent.setup();
      const noteInput = screen.getByPlaceholderText('Add internal note...');
      const addButton = screen.getByText('Add Note');

      await user.type(noteInput, 'Follow up with requester');
      await user.click(addButton);

      await waitFor(() => {
        expect(addInternalNote).toHaveBeenCalledWith('req123', 'Follow up with requester');
        expect(mockOnNotesAdd).toHaveBeenCalledWith('req123', 'Follow up with requester');
      });
    });

    it('validates empty note input', async () => {
      const user = userEvent.setup();
      const addButton = screen.getByText('Add Note');

      await user.click(addButton);

      expect(addInternalNote).not.toHaveBeenCalled();
      expect(mockOnNotesAdd).not.toHaveBeenCalled();
    });
  });

  describe('Drawer Controls', () => {
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

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const closeButton = screen.getByLabelText('close');
      
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      (addInternalNote as jest.Mock).mockRejectedValue(new Error('Service error'));
      
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
      const noteInput = screen.getByPlaceholderText('Add internal note...');
      const addButton = screen.getByText('Add Note');

      await user.type(noteInput, 'Test note');
      await user.click(addButton);

      await waitFor(() => {
        expect(addInternalNote).toHaveBeenCalled();
      });

      // Should not crash the component
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });
  });
});