/**
 * SLA Monitoring Component Tests
 * V2-1 Epic: Enhanced Request Dashboard & Navigation
 * US-V2-011: Request Navigation & Entry
 */

import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';

import { SLAMonitoring } from '../../../src/components/staff/RequestDetailsDrawer/SLAMonitoring';
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

const mockUrgentRequest: StoredRequest = {
  ...mockRequest,
  id: 'req-urgent',
  description: 'URGENT: Emergency request for critical incident report',
};

const mockComplexRequest: StoredRequest = {
  ...mockRequest,
  id: 'req-complex',
  description:
    'Request for extensive records spanning multiple years with detailed documentation',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('SLAMonitoring Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders SLA monitoring component', () => {
      renderWithTheme(<SLAMonitoring request={mockRequest} />);
      expect(screen.getByText('SLA Monitoring')).toBeInTheDocument();
    });

    it('displays department-specific SLA timeframe', () => {
      renderWithTheme(<SLAMonitoring request={mockRequest} />);
      expect(screen.getByText(/Police SLA: 5 days/)).toBeInTheDocument();
    });

    it('shows due date and time remaining', () => {
      renderWithTheme(<SLAMonitoring request={mockRequest} />);
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    });

    it('displays progress bar', () => {
      renderWithTheme(<SLAMonitoring request={mockRequest} />);
      expect(screen.getByText('Time Progress')).toBeInTheDocument();
    });
  });

  describe('SLA Status Detection', () => {
    it('detects expedited requests', () => {
      renderWithTheme(<SLAMonitoring request={mockUrgentRequest} />);
      expect(screen.getByText('Expedited')).toBeInTheDocument();
      expect(screen.getByText(/Police SLA: 2 days/)).toBeInTheDocument();
    });

    it('detects complex requests', () => {
      renderWithTheme(<SLAMonitoring request={mockComplexRequest} />);
      expect(screen.getByText('Complex Request')).toBeInTheDocument();
      expect(screen.getByText(/Police SLA: 10 days/)).toBeInTheDocument();
    });

    it('shows correct status for on-track requests', () => {
      const recentRequest = {
        ...mockRequest,
        submittedAt: Timestamp.fromDate(
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        ), // 2 days ago
      };
      renderWithTheme(<SLAMonitoring request={recentRequest} />);
      expect(screen.getByText('Status: ON TRACK')).toBeInTheDocument();
    });

    it('shows completed status for completed requests', () => {
      const completedRequest = {
        ...mockRequest,
        status: 'completed' as const,
      };
      renderWithTheme(<SLAMonitoring request={completedRequest} />);
      expect(screen.getByText('Status: COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Custom SLA Configuration', () => {
    const customSLA = {
      department: 'Custom',
      standardDays: 7,
      expediteDays: 3,
      complexDays: 14,
    };

    it('uses custom SLA configuration', () => {
      renderWithTheme(
        <SLAMonitoring request={mockRequest} slaConfig={customSLA} />
      );
      expect(screen.getByText(/Custom SLA: 7 days/)).toBeInTheDocument();
    });

    it('respects custom due date', () => {
      const customDueDate = new Date('2024-01-20T12:00:00Z');
      renderWithTheme(
        <SLAMonitoring request={mockRequest} customDueDate={customDueDate} />
      );
      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('displays appropriate alert for overdue requests', () => {
      const overdueRequest = {
        ...mockRequest,
        submittedAt: Timestamp.fromDate(
          new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        ), // 10 days ago
      };
      renderWithTheme(<SLAMonitoring request={overdueRequest} />);
      expect(
        screen.getByText(/overdue and requires immediate attention/)
      ).toBeInTheDocument();
    });

    it('displays warning for at-risk requests', () => {
      const atRiskRequest = {
        ...mockRequest,
        submittedAt: Timestamp.fromDate(
          new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000)
        ), // 4.5 days ago
      };
      renderWithTheme(<SLAMonitoring request={atRiskRequest} />);
      expect(screen.getByText(/approaching due date/)).toBeInTheDocument();
    });

    it('shows success message for completed requests', () => {
      const completedRequest = {
        ...mockRequest,
        status: 'completed' as const,
      };
      renderWithTheme(<SLAMonitoring request={completedRequest} />);
      expect(
        screen.getByText(/completed within SLA timeframe/)
      ).toBeInTheDocument();
    });
  });

  describe('Department Configurations', () => {
    it('handles Transportation department SLA', () => {
      const transportRequest = { ...mockRequest, department: 'Transportation' };
      renderWithTheme(<SLAMonitoring request={transportRequest} />);
      expect(
        screen.getByText(/Transportation SLA: 7 days/)
      ).toBeInTheDocument();
    });

    it('handles Planning department SLA', () => {
      const planningRequest = { ...mockRequest, department: 'Planning' };
      renderWithTheme(<SLAMonitoring request={planningRequest} />);
      expect(screen.getByText(/Planning SLA: 10 days/)).toBeInTheDocument();
    });

    it('falls back to Police SLA for unknown departments', () => {
      const unknownRequest = { ...mockRequest, department: 'Unknown' };
      renderWithTheme(<SLAMonitoring request={unknownRequest} />);
      expect(screen.getByText(/Unknown SLA: 5 days/)).toBeInTheDocument();
    });
  });

  describe('Time Calculations', () => {
    it('calculates remaining time correctly', () => {
      // Create a request that's 1 day old (4 days remaining for Police)
      const oneDayOld = {
        ...mockRequest,
        submittedAt: Timestamp.fromDate(
          new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        ),
      };
      renderWithTheme(<SLAMonitoring request={oneDayOld} />);
      expect(screen.getByText(/4 days remaining/)).toBeInTheDocument();
    });

    it('shows overdue time correctly', () => {
      const overdueRequest = {
        ...mockRequest,
        submittedAt: Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ), // 7 days ago
      };
      renderWithTheme(<SLAMonitoring request={overdueRequest} />);
      expect(screen.getByText(/Overdue by 2 days/)).toBeInTheDocument();
    });
  });
});
