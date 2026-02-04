/**
 * Requester Contact Info Component Tests
 * V2-1 Epic: Enhanced Request Dashboard & Navigation
 * US-V2-011: Request Navigation & Entry
 */

import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';

import { RequesterContactInfo } from '../../../src/components/staff/RequestDetailsDrawer/RequesterContactInfo';
import { StoredRequest } from '../../../src/services/requestService';

const theme = createTheme();

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
  associatedRecords: [],
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('RequesterContactInfo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders contact information section', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    it('displays requester email address', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('shows contact details section', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
    });

    it('displays derived contact name from email', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument();
    });

    it('shows contact type as Public Requester', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Public Requester')).toBeInTheDocument();
    });
  });

  describe('Contact Information Processing', () => {
    it('handles email with dots and underscores', () => {
      const emailRequest = {
        ...mockRequest,
        contactEmail: 'jane.mary_smith@test.com',
      };
      renderWithTheme(<RequesterContactInfo request={emailRequest} />);
      expect(screen.getByText('JANE MARY SMITH')).toBeInTheDocument();
      expect(screen.getByText('jane.mary_smith@test.com')).toBeInTheDocument();
    });

    it('handles complex email domains', () => {
      const complexEmailRequest = {
        ...mockRequest,
        contactEmail: 'user@government.state.ca.us',
      };
      renderWithTheme(<RequesterContactInfo request={complexEmailRequest} />);
      expect(
        screen.getByText('user@government.state.ca.us')
      ).toBeInTheDocument();
      expect(screen.getByText('Government/Organization')).toBeInTheDocument();
    });

    it('detects government email addresses', () => {
      const govEmailRequest = {
        ...mockRequest,
        contactEmail: 'official@city.gov',
      };
      renderWithTheme(<RequesterContactInfo request={govEmailRequest} />);
      expect(screen.getByText('Government/Organization')).toBeInTheDocument();
    });

    it('detects organization email addresses', () => {
      const orgEmailRequest = {
        ...mockRequest,
        contactEmail: 'reporter@newspaper.org',
      };
      renderWithTheme(<RequesterContactInfo request={orgEmailRequest} />);
      expect(screen.getByText('Government/Organization')).toBeInTheDocument();
    });
  });

  describe('Request Statistics', () => {
    it('shows request submitted date', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('First Request')).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('displays current request information', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Current Request')).toBeInTheDocument();
      expect(screen.getByText('TR-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Police Report Request')).toBeInTheDocument();
    });

    it('shows mock previous requests count', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Previous Requests')).toBeInTheDocument();
      expect(screen.getByText('2 requests')).toBeInTheDocument();
    });

    it('handles zero previous requests', () => {
      const newRequesterRequest = {
        ...mockRequest,
        contactEmail: 'new.user@example.com',
      };
      renderWithTheme(<RequesterContactInfo request={newRequesterRequest} />);
      expect(screen.getByText('0 requests')).toBeInTheDocument();
    });

    it('shows communication preferences', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Preferred Communication')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });
  });

  describe('Communication History', () => {
    it('displays communication history section', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Communication History')).toBeInTheDocument();
    });

    it('shows mock communication timeline', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('Initial request received')).toBeInTheDocument();
      expect(screen.getByText('Confirmation email sent')).toBeInTheDocument();
    });

    it('displays communication dates', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('shows system-generated communications', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('displays contact icon', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      const contactIcon = screen
        .getByText('Contact Information')
        .closest('div')
        ?.querySelector('svg');
      expect(contactIcon).toBeInTheDocument();
    });

    it('shows email icon next to email address', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      const emailSection = screen
        .getByText('john.doe@example.com')
        .closest('div');
      expect(emailSection?.querySelector('svg')).toBeInTheDocument();
    });

    it('displays appropriate chips for contact type', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      const chip = screen.getByText('Public Requester');
      expect(chip).toHaveClass('MuiChip-root');
    });

    it('shows communication method chips', () => {
      renderWithTheme(<RequesterContactInfo request={mockRequest} />);
      const emailChip = screen.getByText('Email');
      expect(emailChip).toHaveClass('MuiChip-root');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty email gracefully', () => {
      const emptyEmailRequest = {
        ...mockRequest,
        contactEmail: '',
      };
      renderWithTheme(<RequesterContactInfo request={emptyEmailRequest} />);
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    it('handles single character names', () => {
      const shortEmailRequest = {
        ...mockRequest,
        contactEmail: 'a@b.com',
      };
      renderWithTheme(<RequesterContactInfo request={shortEmailRequest} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('processes email without domain extension', () => {
      const noDomainRequest = {
        ...mockRequest,
        contactEmail: 'user@localhost',
      };
      renderWithTheme(<RequesterContactInfo request={noDomainRequest} />);
      expect(screen.getByText('user@localhost')).toBeInTheDocument();
    });
  });
});
