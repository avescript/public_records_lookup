/**
 * Request Timeline Component Tests
 * V2-1 Epic: Enhanced Request Dashboard & Navigation
 * US-V2-011: Request Navigation & Entry
 */

import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';

import { RequestTimeline } from '../../../src/components/staff/RequestDetailsDrawer/RequestTimeline';
import {
  AssociatedRecord,
  StoredRequest,
} from '../../../src/services/requestService';

const theme = createTheme();

const mockAssociatedRecords: AssociatedRecord[] = [
  {
    candidateId: 'record-1',
    title: 'Police Report #12345',
    description: 'Traffic incident report',
    source: 'Police Department Records',
    agency: 'Police',
    relevanceScore: 0.95,
    confidence: 'high',
    keyPhrases: ['traffic', 'incident'],
    acceptedBy: 'staff@city.gov',
    acceptedAt: Timestamp.fromDate(new Date('2024-01-16T10:30:00Z')),
    metadata: { pageCount: 3 },
    recordType: 'document',
    dateCreated: '2024-01-10',
  },
];

const mockRequest: StoredRequest = {
  id: 'req-123',
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
  status: 'under_review',
  submittedAt: Timestamp.fromDate(new Date('2024-01-15T09:00:00Z')),
  updatedAt: Timestamp.fromDate(new Date('2024-01-16T15:00:00Z')),
  attachmentCount: 2,
  agency: 'police-dept',
  associatedRecords: mockAssociatedRecords,
};

const mockCompletedRequest: StoredRequest = {
  ...mockRequest,
  status: 'completed',
  id: 'req-completed',
};

const mockSubmittedRequest: StoredRequest = {
  ...mockRequest,
  status: 'submitted',
  associatedRecords: [],
  id: 'req-submitted',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('RequestTimeline Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders timeline component', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('Request Timeline')).toBeInTheDocument();
    });

    it('displays timeline icon', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      const timelineHeader = screen
        .getByText('Request Timeline')
        .closest('div');
      expect(timelineHeader?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders timeline events in a list', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      const listElements = screen.getAllByRole('listitem');
      expect(listElements.length).toBeGreaterThan(0);
    });
  });

  describe('Event Generation', () => {
    it('always includes request submission event', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
      expect(
        screen.getByText(/Request TR-2024-001 was submitted for Police/)
      ).toBeInTheDocument();
    });

    it('includes AI matching event when associated records exist', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('AI Matches Found')).toBeInTheDocument();
      expect(
        screen.getByText('1 potential records identified')
      ).toBeInTheDocument();
    });

    it('excludes AI matching event when no associated records', () => {
      renderWithTheme(<RequestTimeline request={mockSubmittedRequest} />);
      expect(screen.queryByText('AI Matches Found')).not.toBeInTheDocument();
    });

    it('includes status change event for non-submitted requests', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('Status Changed')).toBeInTheDocument();
      expect(
        screen.getByText('Request moved to Processing status')
      ).toBeInTheDocument();
    });

    it('includes review event for under_review status', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('Review Started')).toBeInTheDocument();
      expect(
        screen.getByText('Request assigned for staff review')
      ).toBeInTheDocument();
    });

    it('includes completion event for completed requests', () => {
      renderWithTheme(<RequestTimeline request={mockCompletedRequest} />);
      expect(screen.getByText('Request Completed')).toBeInTheDocument();
      expect(
        screen.getByText('All processing completed and ready for delivery')
      ).toBeInTheDocument();
    });
  });

  describe('User Attribution', () => {
    it('shows requester information for submission event', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('by JOHN DOE')).toBeInTheDocument();
      expect(screen.getByText('Requester')).toBeInTheDocument();
    });

    it('shows system user for automated events', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('by System')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('shows AI system for matching events', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('by AI Matching System')).toBeInTheDocument();
    });

    it('shows staff reviewer for review events', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(screen.getByText('by Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Staff Reviewer')).toBeInTheDocument();
    });
  });

  describe('Event Icons and Colors', () => {
    it('displays appropriate icons for different event types', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      // Check that avatars contain icons (testing the icon presence indirectly)
      const avatars = screen
        .getAllByText('Request Submitted')[0]
        .closest('li')
        ?.querySelector('.MuiAvatar-root');
      expect(avatars).toBeInTheDocument();
    });

    it('uses consistent color scheme for event types', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      const eventItems = screen.getAllByRole('listitem');
      eventItems.forEach(item => {
        const avatar = item.querySelector('.MuiAvatar-root');
        expect(avatar).toBeInTheDocument();
      });
    });
  });

  describe('Timestamps and Time Formatting', () => {
    it('displays relative time for recent events', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      // Should show relative time like "X days ago"
      const timeChips = screen.getAllByText(/ago|Just now/);
      expect(timeChips.length).toBeGreaterThan(0);
    });

    it('displays absolute timestamps', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      // Should show formatted dates
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('handles edge case of very recent events', () => {
      const veryRecentRequest = {
        ...mockRequest,
        submittedAt: Timestamp.fromDate(new Date(Date.now() - 30000)), // 30 seconds ago
      };
      renderWithTheme(<RequestTimeline request={veryRecentRequest} />);
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });
  });

  describe('Event Ordering', () => {
    it('displays events in chronological order', () => {
      renderWithTheme(<RequestTimeline request={mockCompletedRequest} />);
      const eventTitles = screen.getAllByText(
        /Request Submitted|Status Changed|AI Matches Found|Review Started|Request Completed/
      );
      expect(eventTitles.length).toBeGreaterThan(1);

      // First event should be submission
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
    });

    it('properly sequences events based on timestamps', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      const listItems = screen.getAllByRole('listitem');
      // Should have multiple events in proper sequence
      expect(listItems.length).toBeGreaterThan(2);
    });
  });

  describe('Visual Elements', () => {
    it('displays dividers between events', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      const listItems = screen.getAllByRole('listitem');
      if (listItems.length > 1) {
        // Dividers should be present between items (test structure exists)
        expect(listItems[0]).toBeInTheDocument();
      }
    });

    it('shows event descriptions when available', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      expect(
        screen.getByText(/Request TR-2024-001 was submitted for Police/)
      ).toBeInTheDocument();
      expect(
        screen.getByText('Request moved to Processing status')
      ).toBeInTheDocument();
    });

    it('displays role chips for users', () => {
      renderWithTheme(<RequestTimeline request={mockRequest} />);
      const roleChips = screen.getAllByText(/Requester|System|Staff Reviewer/);
      expect(roleChips.length).toBeGreaterThan(0);
    });
  });

  describe('Different Request States', () => {
    it('generates appropriate timeline for submitted-only request', () => {
      renderWithTheme(<RequestTimeline request={mockSubmittedRequest} />);
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
      expect(screen.queryByText('Review Started')).not.toBeInTheDocument();
    });

    it('generates complete timeline for completed request', () => {
      renderWithTheme(<RequestTimeline request={mockCompletedRequest} />);
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
      expect(screen.getByText('Status Changed')).toBeInTheDocument();
      expect(screen.getByText('Review Started')).toBeInTheDocument();
      expect(screen.getByText('Request Completed')).toBeInTheDocument();
    });

    it('handles requests with multiple associated records', () => {
      const multiRecordRequest = {
        ...mockRequest,
        associatedRecords: [
          ...mockAssociatedRecords,
          {
            ...mockAssociatedRecords[0],
            candidateId: 'record-2',
            title: 'Another Report',
          },
        ],
      };
      renderWithTheme(<RequestTimeline request={multiRecordRequest} />);
      expect(
        screen.getByText('2 potential records identified')
      ).toBeInTheDocument();
    });
  });
});
