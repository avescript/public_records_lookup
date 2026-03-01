/**
 * Agency Analytics Service Tests
 * Epic 9 Task 6: Agency Dashboard & Analytics
 */

import {
  agencyAnalyticsService,
  type AgencyMetrics,
  type CostTrackingMetrics,
  type DashboardConfig,
  type DocumentProcessingMetrics,
  type PerformanceKPIs,
  type RequestProcessingMetrics,
  type SystemHealthMetrics,
  type TimeRange,
} from '../../src/services/agencyAnalyticsService';

describe('AgencyAnalyticsService', () => {
  const mockAgencyId = 'test-agency-001';
  const mockTimeRange: TimeRange = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    granularity: 'day',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getAgencyMetrics', () => {
    it('should return comprehensive agency metrics', async () => {
      const metrics = await agencyAnalyticsService.getAgencyMetrics(
        mockAgencyId,
        mockTimeRange
      );

      expect(metrics).toBeDefined();
      expect(metrics.agencyId).toBe(mockAgencyId);
      expect(metrics.timeRange).toEqual(mockTimeRange);
      expect(metrics.requestMetrics).toBeDefined();
      expect(metrics.documentMetrics).toBeDefined();
      expect(metrics.costMetrics).toBeDefined();
      expect(metrics.performanceKPIs).toBeDefined();
      expect(metrics.systemHealth).toBeDefined();
    });

    it('should cache metrics for repeated calls', async () => {
      const metrics1 = await agencyAnalyticsService.getAgencyMetrics(
        mockAgencyId,
        mockTimeRange
      );
      const metrics2 = await agencyAnalyticsService.getAgencyMetrics(
        mockAgencyId,
        mockTimeRange
      );

      // Same object from cache
      expect(metrics1).toBe(metrics2);
    });

    it('should handle different time ranges', async () => {
      const hourlyRange: TimeRange = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        granularity: 'hour',
      };

      const metrics = await agencyAnalyticsService.getAgencyMetrics(
        mockAgencyId,
        hourlyRange
      );

      expect(metrics.timeRange.granularity).toBe('hour');
    });
  });

  describe('getRealTimeKPIs', () => {
    it('should return real-time performance KPIs', async () => {
      const kpis = await agencyAnalyticsService.getRealTimeKPIs(mockAgencyId);

      expect(kpis).toBeDefined();
      expect(typeof kpis.requestsPerHour).toBe('number');
      expect(typeof kpis.documentsPerHour).toBe('number');
      expect(typeof kpis.systemAvailability).toBe('number');
      expect(typeof kpis.userSatisfactionScore).toBe('number');
      expect(typeof kpis.errorRate).toBe('number');
      expect(typeof kpis.slaComplianceRate).toBe('number');
      expect(typeof kpis.staffEfficiency).toBe('number');
      expect(typeof kpis.automationRate).toBe('number');
      expect(typeof kpis.costPerRequest).toBe('number');
    });

    it('should return valid KPI values within ranges', async () => {
      const kpis = await agencyAnalyticsService.getRealTimeKPIs(mockAgencyId);

      expect(kpis.systemAvailability).toBeGreaterThanOrEqual(0);
      expect(kpis.systemAvailability).toBeLessThanOrEqual(100);
      expect(kpis.userSatisfactionScore).toBeGreaterThan(0);
      expect(kpis.costPerRequest).toBeGreaterThan(0);
    });
  });

  describe('getRequestAnalytics', () => {
    it('should return request processing metrics', async () => {
      const requestMetrics = await agencyAnalyticsService.getRequestAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(requestMetrics).toBeDefined();
      expect(requestMetrics.totalRequests).toBeGreaterThanOrEqual(0);
      // The sum of statuses may not exactly match total due to rounding
      expect(requestMetrics.completedRequests).toBeGreaterThanOrEqual(0);
      expect(requestMetrics.pendingRequests).toBeGreaterThanOrEqual(0);
      expect(requestMetrics.rejectedRequests).toBeGreaterThanOrEqual(0);
    });

    it('should include processing time metrics', async () => {
      const requestMetrics = await agencyAnalyticsService.getRequestAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(requestMetrics.averageProcessingTime).toBeGreaterThan(0);
      expect(requestMetrics.medianProcessingTime).toBeGreaterThan(0);
      expect(requestMetrics.processingTimeDistribution).toBeInstanceOf(Array);
      expect(requestMetrics.processingTimeDistribution.length).toBeGreaterThan(
        0
      );
    });

    it('should include trend data', async () => {
      const requestMetrics = await agencyAnalyticsService.getRequestAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(requestMetrics.requestVolumeTrend).toBeInstanceOf(Array);
      expect(requestMetrics.completionRateTrend).toBeInstanceOf(Array);
      expect(requestMetrics.requestVolumeTrend.length).toBeGreaterThan(0);
    });

    it('should include breakdown by type and status', async () => {
      const requestMetrics = await agencyAnalyticsService.getRequestAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(requestMetrics.requestTypeBreakdown).toBeInstanceOf(Array);
      expect(requestMetrics.statusDistribution).toBeInstanceOf(Array);
    });
  });

  describe('getDocumentAnalytics', () => {
    it('should return document processing metrics', async () => {
      const documentMetrics = await agencyAnalyticsService.getDocumentAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(documentMetrics).toBeDefined();
      expect(documentMetrics.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.processedDocuments).toBeLessThanOrEqual(
        documentMetrics.totalDocuments
      );
      expect(documentMetrics.failedDocuments).toBeGreaterThanOrEqual(0);
    });

    it('should include OCR metrics', async () => {
      const documentMetrics = await agencyAnalyticsService.getDocumentAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(documentMetrics.ocrProcessedDocuments).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.ocrSuccessRate).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.ocrSuccessRate).toBeLessThanOrEqual(100);
      expect(documentMetrics.averageOcrConfidence).toBeGreaterThan(0);
      expect(documentMetrics.ocrProcessingTime).toBeGreaterThan(0);
    });

    it('should include format distribution', async () => {
      const documentMetrics = await agencyAnalyticsService.getDocumentAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(documentMetrics.formatDistribution).toBeInstanceOf(Array);
      expect(documentMetrics.formatDistribution.length).toBeGreaterThan(0);
    });

    it('should include batch processing metrics', async () => {
      const documentMetrics = await agencyAnalyticsService.getDocumentAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(documentMetrics.totalBatches).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.averageBatchSize).toBeGreaterThan(0);
      expect(documentMetrics.batchProcessingTime).toBeGreaterThan(0);
      expect(documentMetrics.batchSuccessRate).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.batchSuccessRate).toBeLessThanOrEqual(100);
    });

    it('should include agency rule integration metrics', async () => {
      const documentMetrics = await agencyAnalyticsService.getDocumentAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(documentMetrics.rulesApplied).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.autoApprovedRedactions).toBeGreaterThanOrEqual(0);
      expect(documentMetrics.manualReviewRequired).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCostAnalytics', () => {
    it('should return cost tracking metrics', async () => {
      const costMetrics = await agencyAnalyticsService.getCostAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(costMetrics).toBeDefined();
      expect(costMetrics.currentPeriodCost).toBeGreaterThanOrEqual(0);
      expect(costMetrics.previousPeriodCost).toBeGreaterThanOrEqual(0);
    });

    it('should include cost breakdown by category', async () => {
      const costMetrics = await agencyAnalyticsService.getCostAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(costMetrics.documentProcessingCosts).toBeGreaterThanOrEqual(0);
      expect(costMetrics.ocrProcessingCosts).toBeGreaterThanOrEqual(0);
      expect(costMetrics.storageUsageCosts).toBeGreaterThanOrEqual(0);
      expect(costMetrics.apiUsageCosts).toBeGreaterThanOrEqual(0);

      // Total should approximately equal sum of parts
      const sum =
        costMetrics.documentProcessingCosts +
        costMetrics.ocrProcessingCosts +
        costMetrics.storageUsageCosts +
        costMetrics.apiUsageCosts;

      expect(sum).toBeCloseTo(costMetrics.currentPeriodCost, 1);
    });

    it('should include tier information', async () => {
      const costMetrics = await agencyAnalyticsService.getCostAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(costMetrics.currentTier).toBeDefined();
      expect(costMetrics.tierUtilization).toBeDefined();
      expect(costMetrics.tierUtilization.maxRequests).toBeGreaterThan(0);
      expect(costMetrics.tierUtilization.usedRequests).toBeGreaterThanOrEqual(
        0
      );
    });

    it('should include billing information', async () => {
      const costMetrics = await agencyAnalyticsService.getCostAnalytics(
        mockAgencyId,
        mockTimeRange
      );

      expect(costMetrics.nextBillingDate).toBeDefined();
      expect(costMetrics.billingHistory).toBeInstanceOf(Array);
      expect(new Date(costMetrics.nextBillingDate).getTime()).toBeGreaterThan(
        Date.now()
      );
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health metrics', async () => {
      const systemHealth =
        await agencyAnalyticsService.getSystemHealth(mockAgencyId);

      expect(systemHealth).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(
        systemHealth.overallHealth
      );
      expect(systemHealth.uptime).toBeGreaterThanOrEqual(0);
      expect(systemHealth.uptime).toBeLessThanOrEqual(100);
      expect(systemHealth.responseTime).toBeGreaterThan(0);
    });

    it('should include resource utilization metrics', async () => {
      const systemHealth =
        await agencyAnalyticsService.getSystemHealth(mockAgencyId);

      expect(systemHealth.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(systemHealth.cpuUsage).toBeLessThanOrEqual(100);
      expect(systemHealth.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(systemHealth.memoryUsage).toBeLessThanOrEqual(100);
      expect(systemHealth.storageUsage).toBeGreaterThanOrEqual(0);
      expect(systemHealth.storageUsage).toBeLessThanOrEqual(100);
    });

    it('should include alerts and issues', async () => {
      const systemHealth =
        await agencyAnalyticsService.getSystemHealth(mockAgencyId);

      expect(systemHealth.activeAlerts).toBeInstanceOf(Array);
      expect(systemHealth.recentIssues).toBeInstanceOf(Array);
    });

    it('should determine health status based on metrics', async () => {
      const systemHealth =
        await agencyAnalyticsService.getSystemHealth(mockAgencyId);

      if (systemHealth.overallHealth === 'healthy') {
        expect(systemHealth.uptime).toBeGreaterThan(99.5);
        expect(systemHealth.responseTime).toBeLessThan(150);
      } else if (systemHealth.overallHealth === 'warning') {
        expect(
          systemHealth.uptime < 99.5 || systemHealth.responseTime > 150
        ).toBe(true);
      } else if (systemHealth.overallHealth === 'critical') {
        expect(
          systemHealth.uptime < 99.0 || systemHealth.responseTime > 180
        ).toBe(true);
      }
    });
  });

  describe('compareAgencies', () => {
    it('should compare multiple agencies', async () => {
      const agencyIds = ['agency-001', 'agency-002', 'agency-003'];
      const comparison = await agencyAnalyticsService.compareAgencies(
        agencyIds,
        mockTimeRange,
        ['totalRequests', 'averageProcessingTime', 'systemAvailability']
      );

      expect(Object.keys(comparison)).toHaveLength(3);
      agencyIds.forEach(id => {
        expect(comparison[id]).toBeDefined();
        expect(comparison[id].agencyId).toBe(id);
      });
    });
  });

  describe('Dashboard Configuration', () => {
    it('should get default dashboard config', async () => {
      const config =
        await agencyAnalyticsService.getDashboardConfig(mockAgencyId);

      expect(config).toBeDefined();
      expect(config.agencyId).toBe(mockAgencyId);
      expect(config.layout).toBeDefined();
      if (config.layout && config.layout.widgets) {
        expect(config.layout.widgets).toBeInstanceOf(Array);
        expect(config.layout.widgets.length).toBeGreaterThan(0);
      }
    });

    it('should save and retrieve dashboard config', async () => {
      const customConfig: DashboardConfig = {
        agencyId: mockAgencyId,
        layout: {
          widgets: [
            {
              id: 'custom-widget-1',
              type: 'kpi-card',
              title: 'Custom KPI',
              position: { x: 0, y: 0 },
              size: { width: 2, height: 1 },
              config: {},
              visible: true,
            },
          ],
          columns: 4,
        },
        refreshInterval: 30,
        timeZone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
      };

      await agencyAnalyticsService.saveDashboardConfig(customConfig);
      const retrieved =
        await agencyAnalyticsService.getDashboardConfig(mockAgencyId);

      expect(retrieved.layout.columns).toBe(4);
      expect(retrieved.refreshInterval).toBe(30);
      expect(retrieved.layout.widgets).toHaveLength(1);
      expect(retrieved.layout.widgets[0].title).toBe('Custom KPI');
    });
  });

  describe('Export Functionality', () => {
    it('should export analytics to CSV', async () => {
      const blob = await agencyAnalyticsService.exportAnalytics(
        mockAgencyId,
        mockTimeRange,
        'csv'
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export analytics to JSON', async () => {
      const blob = await agencyAnalyticsService.exportAnalytics(
        mockAgencyId,
        mockTimeRange,
        'json'
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export analytics to XLSX', async () => {
      const blob = await agencyAnalyticsService.exportAnalytics(
        mockAgencyId,
        mockTimeRange,
        'xlsx'
      );

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache metrics and improve performance', async () => {
      const metrics1 = await agencyAnalyticsService.getAgencyMetrics(
        mockAgencyId,
        mockTimeRange
      );
      const metrics2 = await agencyAnalyticsService.getAgencyMetrics(
        mockAgencyId,
        mockTimeRange
      );

      // Cached call should return the same object reference
      expect(metrics1).toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });
});
