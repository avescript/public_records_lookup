/**
 * Agency Dashboard Component Tests
 * Epic 9 Task 6: Agency Dashboard & Analytics
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AgencyDashboard from '../../../src/components/admin/AgencyDashboard';
import type {
  AgencyMetrics,
  DashboardConfig,
  PerformanceKPIs,
  TimeRange,
} from '../../../src/services/agencyAnalyticsService';
import * as AgencyAnalyticsService from '../../../src/services/agencyAnalyticsService';

// Mock the service
jest.mock('../../../src/services/agencyAnalyticsService');

describe('AgencyDashboard', () => {
  const mockAgencyId = 'test-agency-001';

  const mockTimeRange: TimeRange = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    granularity: 'day',
  };

  const mockKPIs: PerformanceKPIs = {
    requestsPerHour: 25.5,
    documentsPerHour: 12.3,
    systemAvailability: 99.95,
    userSatisfactionScore: 4.5,
    errorRate: 0.5,
    slaComplianceRate: 98.5,
    staffEfficiency: 92.0,
    automationRate: 85.0,
    costPerRequest: 2.45,
    performanceVsBenchmark: [
      {
        metric: 'Processing Time',
        agencyValue: 45,
        benchmarkValue: 60,
        percentageDifference: -25,
        trend: 'improving',
      },
    ],
  };

  const mockMetrics: AgencyMetrics = {
    agencyId: mockAgencyId,
    agencyName: 'Test Agency',
    timeRange: mockTimeRange,
    requestMetrics: {
      totalRequests: 150,
      completedRequests: 120,
      pendingRequests: 25,
      rejectedRequests: 5,
      averageProcessingTime: 45.5,
      medianProcessingTime: 38.2,
      processingTimeDistribution: [
        { timeRange: '0-15 min', count: 30, percentage: 25 },
        { timeRange: '15-30 min', count: 40, percentage: 33 },
        { timeRange: '30-60 min', count: 35, percentage: 29 },
        { timeRange: '60+ min', count: 15, percentage: 13 },
      ],
      requestVolumeTrend: [
        { timestamp: new Date().toISOString(), value: 20 },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          value: 18,
        },
      ],
      completionRateTrend: [
        { timestamp: new Date().toISOString(), value: 85 },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          value: 82,
        },
      ],
      requestTypeBreakdown: [
        {
          type: 'Record Request',
          count: 80,
          percentage: 53,
          averageProcessingTime: 40,
        },
        {
          type: 'Information Request',
          count: 70,
          percentage: 47,
          averageProcessingTime: 52,
        },
      ],
      statusDistribution: [
        { status: 'completed', count: 120, percentage: 80 },
        { status: 'pending', count: 25, percentage: 17 },
        { status: 'rejected', count: 5, percentage: 3 },
      ],
    },
    documentMetrics: {
      totalDocuments: 500,
      processedDocuments: 450,
      failedDocuments: 50,
      ocrProcessedDocuments: 300,
      ocrSuccessRate: 95.5,
      averageOcrConfidence: 0.92,
      ocrProcessingTime: 3.5,
      formatDistribution: [
        {
          format: 'PDF',
          count: 250,
          percentage: 50,
          averageProcessingTime: 4.5,
          ocrRequired: true,
        },
        {
          format: 'DOCX',
          count: 150,
          percentage: 30,
          averageProcessingTime: 2.0,
          ocrRequired: false,
        },
        {
          format: 'PNG',
          count: 100,
          percentage: 20,
          averageProcessingTime: 3.0,
          ocrRequired: true,
        },
      ],
      totalBatches: 25,
      averageBatchSize: 18,
      batchProcessingTime: 120,
      batchSuccessRate: 94.5,
      rulesApplied: 450,
      autoApprovedRedactions: 380,
      manualReviewRequired: 70,
    },
    costMetrics: {
      currentPeriodCost: 1250.5,
      previousPeriodCost: 1100.0,
      costTrend: [
        { timestamp: new Date().toISOString(), value: 1250 },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          value: 1200,
        },
      ],
      documentProcessingCosts: 500.2,
      ocrProcessingCosts: 312.5,
      storageUsageCosts: 250.1,
      apiUsageCosts: 187.7,
      currentTier: 'premium',
      tierUtilization: {
        maxRequests: 1000,
        usedRequests: 150,
        maxStorage: 100,
        usedStorage: 45,
        maxDocuments: 5000,
        usedDocuments: 500,
      },
      nextBillingDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      billingHistory: [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 1100.0,
          description: 'Monthly subscription',
          status: 'paid',
        },
      ],
    },
    performanceKPIs: mockKPIs,
    systemHealth: {
      overallHealth: 'healthy',
      uptime: 99.95,
      responseTime: 125,
      cpuUsage: 45.5,
      memoryUsage: 62.3,
      storageUsage: 55.8,
      activeAlerts: [],
      recentIssues: [],
    },
  };

  const mockConfig: DashboardConfig = {
    agencyId: mockAgencyId,
    layout: {
      widgets: [
        {
          id: 'widget-1',
          type: 'kpi-card',
          title: 'Requests/Hour',
          position: { x: 0, y: 0 },
          size: { width: 1, height: 1 },
          config: {},
          visible: true,
        },
      ],
      columns: 4,
    },
    refreshInterval: 60,
    timeZone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Setup mocks
    (
      AgencyAnalyticsService.agencyAnalyticsService
        .getAgencyMetrics as jest.Mock
    ).mockResolvedValue(mockMetrics);
    (
      AgencyAnalyticsService.agencyAnalyticsService.getRealTimeKPIs as jest.Mock
    ).mockResolvedValue(mockKPIs);
    (
      AgencyAnalyticsService.agencyAnalyticsService
        .getDashboardConfig as jest.Mock
    ).mockResolvedValue(mockConfig);
  });

  describe('Rendering', () => {
    it('should render dashboard with agency name', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Agency Dashboard')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display KPI cards after loading', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Requests/Hour')).toBeInTheDocument();
        expect(screen.getByText('System Availability')).toBeInTheDocument();
        expect(screen.getByText('User Satisfaction')).toBeInTheDocument();
        expect(screen.getByText('Cost Per Request')).toBeInTheDocument();
      });
    });

    it('should display system health indicator', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText(/System: healthy/i)).toBeInTheDocument();
      });
    });

    it('should show error message on load failure', async () => {
      (
        AgencyAnalyticsService.agencyAnalyticsService
          .getAgencyMetrics as jest.Mock
      ).mockRejectedValue(new Error('Failed to load'));

      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Time Range Controls', () => {
    it('should display time range quick selectors', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('24h')).toBeInTheDocument();
        expect(screen.getByText('7d')).toBeInTheDocument();
        expect(screen.getByText('30d')).toBeInTheDocument();
        expect(screen.getByText('90d')).toBeInTheDocument();
      });
    });

    it('should reload data when time range changes', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Agency Dashboard')).toBeInTheDocument();
      });

      const initialCallCount = (
        AgencyAnalyticsService.agencyAnalyticsService
          .getAgencyMetrics as jest.Mock
      ).mock.calls.length;

      const button24h = screen.getByText('24h');
      fireEvent.click(button24h);

      await waitFor(() => {
        expect(
          AgencyAnalyticsService.agencyAnalyticsService.getAgencyMetrics
        ).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should display export buttons', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('JSON')).toBeInTheDocument();
        expect(screen.getByText('XLSX')).toBeInTheDocument();
      });
    });

    it('should call export service on CSV button click', async () => {
      const exportMock = jest
        .fn()
        .mockResolvedValue(new Blob(['test'], { type: 'text/csv' }));
      (
        AgencyAnalyticsService.agencyAnalyticsService
          .exportAnalytics as jest.Mock
      ).mockImplementation(exportMock);

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Agency Dashboard')).toBeInTheDocument();
      });

      const csvButton = screen.getByText('CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(exportMock).toHaveBeenCalledWith(
          mockAgencyId,
          expect.any(Object),
          'csv'
        );
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should display refresh button', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should reload data when refresh button clicked', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Agency Dashboard')).toBeInTheDocument();
      });

      const initialCallCount = (
        AgencyAnalyticsService.agencyAnalyticsService
          .getAgencyMetrics as jest.Mock
      ).mock.calls.length;

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(
          AgencyAnalyticsService.agencyAnalyticsService.getAgencyMetrics
        ).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe('Charts and Visualizations', () => {
    it('should display chart sections', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Request Volume Trend')).toBeInTheDocument();
        expect(
          screen.getByText('Processing Time Distribution')
        ).toBeInTheDocument();
        expect(screen.getByText('Document Formats')).toBeInTheDocument();
        expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
      });
    });
  });

  describe('Metrics Tables', () => {
    it('should display request status breakdown table', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(
          screen.getByText('Request Status Breakdown')
        ).toBeInTheDocument();
      });
    });

    it('should display system performance metrics table', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('System Performance')).toBeInTheDocument();
      });
    });
  });

  describe('Alerts and Issues', () => {
    it('should display alerts section when no alerts', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('No active alerts')).toBeInTheDocument();
      });
    });

    it('should display issues section when no issues', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Recent Issues')).toBeInTheDocument();
        expect(screen.getByText('No recent issues')).toBeInTheDocument();
      });
    });

    it('should display alerts when present', async () => {
      const metricsWithAlerts = {
        ...mockMetrics,
        systemHealth: {
          ...mockMetrics.systemHealth,
          activeAlerts: [
            {
              id: 'alert-1',
              ruleId: 'rule-1',
              agencyId: mockAgencyId,
              type: 'performance' as const,
              priority: 'medium' as const,
              title: 'High Response Time',
              description: 'Response time exceeded threshold',
              metric: 'response_time',
              currentValue: 250,
              thresholdValue: 200,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              status: 'active' as const,
              metadata: {},
            },
          ],
        },
      };

      (
        AgencyAnalyticsService.agencyAnalyticsService
          .getAgencyMetrics as jest.Mock
      ).mockResolvedValue(metricsWithAlerts);

      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('High Response Time')).toBeInTheDocument();
        expect(
          screen.getByText('Response time exceeded threshold')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh based on config interval', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      const initialCallCount = (
        AgencyAnalyticsService.agencyAnalyticsService
          .getAgencyMetrics as jest.Mock
      ).mock.calls.length;

      // Fast-forward time by refresh interval (60 seconds)
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(
          AgencyAnalyticsService.agencyAnalyticsService.getAgencyMetrics
        ).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe('KPI Values', () => {
    it('should display correct KPI values', async () => {
      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        // requestsPerHour (no unit, rounded to 0 decimals)
        expect(screen.getByText('26')).toBeInTheDocument();
        // systemAvailability (%, 1 decimal)
        expect(screen.getByText('100.0%')).toBeInTheDocument();
        // userSatisfactionScore (/5, rounded to 0 decimals)
        expect(screen.getByText('5/5')).toBeInTheDocument();
        // costPerRequest ($, 2 decimals)
        expect(screen.getByText('$2.45')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render without crashing on mobile viewport', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<AgencyDashboard agencyId={mockAgencyId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Agency Dashboard')).toBeInTheDocument();
      });
    });
  });
});
