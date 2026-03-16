/**
 * Agency Analytics Service
 * Epic 9 Task 6: Agency Dashboard & Analytics
 *
 * Provides comprehensive analytics and performance metrics for agency operations
 * including request processing, document processing, cost tracking, and KPIs.
 */

export interface AgencyMetrics {
  agencyId: string;
  agencyName: string;
  timeRange: TimeRange;

  // Request Processing Metrics
  requestMetrics: RequestProcessingMetrics;

  // Document Processing Metrics (from Task 5)
  documentMetrics: DocumentProcessingMetrics;

  // Cost & Billing Metrics
  costMetrics: CostTrackingMetrics;

  // Performance KPIs
  performanceKPIs: PerformanceKPIs;

  // System Health
  systemHealth: SystemHealthMetrics;
}

export interface TimeRange {
  startDate: string;
  endDate: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface RequestProcessingMetrics {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;

  // Performance Metrics
  averageProcessingTime: number; // in minutes
  medianProcessingTime: number;
  processingTimeDistribution: ProcessingTimeDistribution[];

  // Volume Trends
  requestVolumeTrend: DataPoint[];
  completionRateTrend: DataPoint[];

  // Request Types
  requestTypeBreakdown: RequestTypeMetric[];

  // Status Distribution
  statusDistribution: StatusMetric[];
}

export interface DocumentProcessingMetrics {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;

  // OCR Metrics
  ocrProcessedDocuments: number;
  ocrSuccessRate: number;
  averageOcrConfidence: number;
  ocrProcessingTime: number;

  // Format Distribution
  formatDistribution: FormatMetric[];

  // Batch Processing
  totalBatches: number;
  averageBatchSize: number;
  batchProcessingTime: number;
  batchSuccessRate: number;

  // Agency Integration
  rulesApplied: number;
  autoApprovedRedactions: number;
  manualReviewRequired: number;
}

export interface CostTrackingMetrics {
  currentPeriodCost: number;
  previousPeriodCost: number;
  costTrend: DataPoint[];

  // Usage-based Costs
  documentProcessingCosts: number;
  ocrProcessingCosts: number;
  storageUsageCosts: number;
  apiUsageCosts: number;

  // Tier Information
  currentTier: AgencyTier;
  tierUtilization: TierUtilization;

  // Billing Information
  nextBillingDate: string;
  billingHistory: BillingRecord[];
}

export interface PerformanceKPIs {
  // Efficiency KPIs
  requestsPerHour: number;
  documentsPerHour: number;
  systemAvailability: number; // percentage

  // Quality KPIs
  userSatisfactionScore: number;
  errorRate: number;
  slaComplianceRate: number;

  // Productivity KPIs
  staffEfficiency: number;
  automationRate: number;
  costPerRequest: number;

  // Comparison to Benchmarks
  performanceVsBenchmark: BenchmarkComparison[];
}

export interface SystemHealthMetrics {
  overallHealth: 'healthy' | 'warning' | 'critical';
  uptime: number; // percentage
  responseTime: number; // average in ms

  // Resource Utilization
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;

  // Active Alerts
  activeAlerts: Alert[];

  // Recent Issues
  recentIssues: SystemIssue[];
}

// Supporting Interfaces
export interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ProcessingTimeDistribution {
  timeRange: string; // e.g., "0-15 min", "15-30 min"
  count: number;
  percentage: number;
}

export interface RequestTypeMetric {
  type: string;
  count: number;
  percentage: number;
  averageProcessingTime: number;
}

export interface StatusMetric {
  status: string;
  count: number;
  percentage: number;
}

export interface FormatMetric {
  format: string;
  count: number;
  percentage: number;
  averageProcessingTime: number;
  ocrRequired: boolean;
}

export interface TierUtilization {
  maxRequests: number;
  usedRequests: number;
  maxStorage: number;
  usedStorage: number;
  maxDocuments: number;
  usedDocuments: number;
}

export interface BillingRecord {
  date: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface BenchmarkComparison {
  metric: string;
  agencyValue: number;
  benchmarkValue: number;
  percentageDifference: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface SystemIssue {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  impact: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolutionTime?: number; // minutes
}

export type AgencyTier = 'basic' | 'premium' | 'enterprise';

// Dashboard Configuration
export interface DashboardConfig {
  agencyId: string;
  layout: DashboardLayout;
  refreshInterval: number; // in seconds
  timeZone: string;
  dateFormat: string;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  config: WidgetConfig;
  visible: boolean;
}

export type WidgetType =
  | 'kpi-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'area-chart'
  | 'table'
  | 'alert-list'
  | 'status-indicator'
  | 'progress-bar';

export interface WidgetSize {
  width: number; // grid units
  height: number; // grid units
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetConfig {
  metric?: string;
  timeRange?: string;
  aggregation?: 'sum' | 'average' | 'count' | 'max' | 'min';
  chartType?: string;
  showTrend?: boolean;
  compareToBaseline?: boolean;
  [key: string]: any;
}

/**
 * Agency Analytics Service Class
 */
export class AgencyAnalyticsService {
  private metricsCache: Map<string, AgencyMetrics> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get comprehensive analytics for an agency
   */
  async getAgencyMetrics(
    agencyId: string,
    timeRange: TimeRange
  ): Promise<AgencyMetrics> {
    const cacheKey = `${agencyId}_${JSON.stringify(timeRange)}`;

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      const cached = this.metricsCache.get(cacheKey);
      if (cached) return cached;
    }

    // Generate metrics
    const metrics = await this.generateAgencyMetrics(agencyId, timeRange);

    // Cache results
    this.metricsCache.set(cacheKey, metrics);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    return metrics;
  }

  /**
   * Get real-time KPIs for dashboard
   */
  async getRealTimeKPIs(agencyId: string): Promise<PerformanceKPIs> {
    const timeRange: TimeRange = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      granularity: 'hour',
    };

    const metrics = await this.getAgencyMetrics(agencyId, timeRange);
    return metrics.performanceKPIs;
  }

  /**
   * Get request processing analytics
   */
  async getRequestAnalytics(
    agencyId: string,
    timeRange: TimeRange
  ): Promise<RequestProcessingMetrics> {
    // Simulate request processing data
    return {
      totalRequests: this.generateRandomCount(50, 500),
      completedRequests: this.generateRandomCount(40, 450),
      pendingRequests: this.generateRandomCount(5, 30),
      rejectedRequests: this.generateRandomCount(1, 20),

      averageProcessingTime: this.generateRandomFloat(15, 120),
      medianProcessingTime: this.generateRandomFloat(10, 90),
      processingTimeDistribution: this.generateProcessingTimeDistribution(),

      requestVolumeTrend: this.generateTrendData(timeRange, 'requests'),
      completionRateTrend: this.generateTrendData(timeRange, 'completion'),

      requestTypeBreakdown: this.generateRequestTypeBreakdown(),
      statusDistribution: this.generateStatusDistribution(),
    };
  }

  /**
   * Get document processing analytics
   */
  async getDocumentAnalytics(
    agencyId: string,
    timeRange: TimeRange
  ): Promise<DocumentProcessingMetrics> {
    const totalDocs = this.generateRandomCount(100, 1000);
    const processedDocs = Math.floor(totalDocs * 0.85);
    const failedDocs = totalDocs - processedDocs;
    const ocrDocs = Math.floor(processedDocs * 0.6);

    return {
      totalDocuments: totalDocs,
      processedDocuments: processedDocs,
      failedDocuments: failedDocs,

      ocrProcessedDocuments: ocrDocs,
      ocrSuccessRate: this.generateRandomFloat(85, 98),
      averageOcrConfidence: this.generateRandomFloat(0.8, 0.95),
      ocrProcessingTime: this.generateRandomFloat(1.5, 8.0),

      formatDistribution: this.generateFormatDistribution(),

      totalBatches: this.generateRandomCount(10, 50),
      averageBatchSize: this.generateRandomFloat(8, 25),
      batchProcessingTime: this.generateRandomFloat(45, 180),
      batchSuccessRate: this.generateRandomFloat(88, 99),

      rulesApplied: this.generateRandomCount(200, 800),
      autoApprovedRedactions: this.generateRandomCount(150, 600),
      manualReviewRequired: this.generateRandomCount(20, 150),
    };
  }

  /**
   * Get cost tracking analytics
   */
  async getCostAnalytics(
    agencyId: string,
    timeRange: TimeRange
  ): Promise<CostTrackingMetrics> {
    const currentCost = this.generateRandomFloat(500, 5000);
    const previousCost = this.generateRandomFloat(450, 4500);

    return {
      currentPeriodCost: currentCost,
      previousPeriodCost: previousCost,
      costTrend: this.generateTrendData(timeRange, 'cost'),

      documentProcessingCosts: currentCost * 0.4,
      ocrProcessingCosts: currentCost * 0.25,
      storageUsageCosts: currentCost * 0.2,
      apiUsageCosts: currentCost * 0.15,

      currentTier: this.getAgencyTier(agencyId),
      tierUtilization: this.generateTierUtilization(),

      nextBillingDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      billingHistory: this.generateBillingHistory(),
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(agencyId: string): Promise<SystemHealthMetrics> {
    const responseTime = this.generateRandomFloat(50, 200);
    const uptime = this.generateRandomFloat(99.0, 99.99);

    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (responseTime > 150 || uptime < 99.5) {
      overallHealth = 'warning';
    }
    if (responseTime > 180 || uptime < 99.0) {
      overallHealth = 'critical';
    }

    return {
      overallHealth,
      uptime,
      responseTime,

      cpuUsage: this.generateRandomFloat(20, 80),
      memoryUsage: this.generateRandomFloat(30, 85),
      storageUsage: this.generateRandomFloat(40, 90),

      activeAlerts: this.generateActiveAlerts(),
      recentIssues: this.generateRecentIssues(),
    };
  }

  /**
   * Compare agencies performance
   */
  async compareAgencies(
    agencyIds: string[],
    timeRange: TimeRange,
    metrics: string[]
  ): Promise<Record<string, AgencyMetrics>> {
    const results: Record<string, AgencyMetrics> = {};

    for (const agencyId of agencyIds) {
      results[agencyId] = await this.getAgencyMetrics(agencyId, timeRange);
    }

    return results;
  }

  /**
   * Get dashboard configuration
   */
  async getDashboardConfig(agencyId: string): Promise<DashboardConfig> {
    // Load from localStorage or return default
    const saved = localStorage.getItem(`dashboard_config_${agencyId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved dashboard config:', error);
      }
    }

    return this.getDefaultDashboardConfig(agencyId);
  }

  /**
   * Save dashboard configuration
   */
  async saveDashboardConfig(config: DashboardConfig): Promise<void> {
    localStorage.setItem(
      `dashboard_config_${config.agencyId}`,
      JSON.stringify(config)
    );
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    agencyId: string,
    timeRange: TimeRange,
    format: 'csv' | 'json' | 'xlsx'
  ): Promise<Blob> {
    const metrics = await this.getAgencyMetrics(agencyId, timeRange);

    switch (format) {
      case 'csv':
        return this.exportToCSV(metrics);
      case 'json':
        return this.exportToJSON(metrics);
      case 'xlsx':
        return this.exportToXLSX(metrics);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods
  private async generateAgencyMetrics(
    agencyId: string,
    timeRange: TimeRange
  ): Promise<AgencyMetrics> {
    const [
      requestMetrics,
      documentMetrics,
      costMetrics,
      performanceKPIs,
      systemHealth,
    ] = await Promise.all([
      this.getRequestAnalytics(agencyId, timeRange),
      this.getDocumentAnalytics(agencyId, timeRange),
      this.getCostAnalytics(agencyId, timeRange),
      this.generatePerformanceKPIs(agencyId),
      this.getSystemHealth(agencyId),
    ]);

    return {
      agencyId,
      agencyName: this.getAgencyName(agencyId),
      timeRange,
      requestMetrics,
      documentMetrics,
      costMetrics,
      performanceKPIs,
      systemHealth,
    };
  }

  private async generatePerformanceKPIs(
    agencyId: string
  ): Promise<PerformanceKPIs> {
    return {
      requestsPerHour: this.generateRandomFloat(5, 50),
      documentsPerHour: this.generateRandomFloat(10, 100),
      systemAvailability: this.generateRandomFloat(98, 99.99),

      userSatisfactionScore: this.generateRandomFloat(4.2, 4.9),
      errorRate: this.generateRandomFloat(0.1, 2.5),
      slaComplianceRate: this.generateRandomFloat(95, 99.8),

      staffEfficiency: this.generateRandomFloat(75, 95),
      automationRate: this.generateRandomFloat(60, 85),
      costPerRequest: this.generateRandomFloat(2.5, 15.0),

      performanceVsBenchmark: this.generateBenchmarkComparisons(),
    };
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private generateRandomCount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateRandomFloat(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  private generateTrendData(timeRange: TimeRange, type: string): DataPoint[] {
    const points: DataPoint[] = [];
    const now = new Date();
    const start = new Date(timeRange.startDate);
    const granularityMs = this.getGranularityMs(timeRange.granularity);

    let current = start;
    while (current <= now) {
      let value: number;
      switch (type) {
        case 'requests':
          value = this.generateRandomCount(5, 50);
          break;
        case 'completion':
          value = this.generateRandomFloat(85, 98);
          break;
        case 'cost':
          value = this.generateRandomFloat(100, 1000);
          break;
        default:
          value = this.generateRandomFloat(0, 100);
      }

      points.push({
        timestamp: current.toISOString(),
        value,
        label: current.toLocaleDateString(),
      });

      current = new Date(current.getTime() + granularityMs);
    }

    return points;
  }

  private getGranularityMs(granularity: string): number {
    switch (granularity) {
      case 'hour':
        return 60 * 60 * 1000;
      case 'day':
        return 24 * 60 * 60 * 1000;
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private generateProcessingTimeDistribution(): ProcessingTimeDistribution[] {
    const ranges = [
      '0-15 min',
      '15-30 min',
      '30-60 min',
      '60-120 min',
      '120+ min',
    ];
    const total = 100;
    const distribution = [40, 30, 20, 8, 2]; // typical distribution

    return ranges.map((range, index) => ({
      timeRange: range,
      count: Math.floor((distribution[index] * total) / 100),
      percentage: distribution[index],
    }));
  }

  private generateRequestTypeBreakdown(): RequestTypeMetric[] {
    const types = [
      'FOIA Request',
      'Police Report',
      'Court Record',
      'Property Record',
      'Other',
    ];
    const total = this.generateRandomCount(100, 500);

    return types.map(type => {
      const count = this.generateRandomCount(5, total / types.length);
      return {
        type,
        count,
        percentage: Math.round((count / total) * 100),
        averageProcessingTime: this.generateRandomFloat(30, 180),
      };
    });
  }

  private generateStatusDistribution(): StatusMetric[] {
    const statuses = [
      'Completed',
      'In Progress',
      'Under Review',
      'Rejected',
      'On Hold',
    ];
    const counts = [120, 45, 25, 8, 12];
    const total = counts.reduce((sum, count) => sum + count, 0);

    return statuses.map((status, index) => ({
      status,
      count: counts[index],
      percentage: Math.round((counts[index] / total) * 100),
    }));
  }

  private generateFormatDistribution(): FormatMetric[] {
    const formats = [
      { format: 'PDF', ocrRequired: false },
      { format: 'PNG', ocrRequired: true },
      { format: 'JPEG', ocrRequired: true },
      { format: 'DOC', ocrRequired: false },
      { format: 'TXT', ocrRequired: false },
    ];

    return formats.map(({ format, ocrRequired }) => ({
      format,
      count: this.generateRandomCount(10, 200),
      percentage: this.generateRandomFloat(5, 35),
      averageProcessingTime: this.generateRandomFloat(
        ocrRequired ? 5 : 1,
        ocrRequired ? 15 : 5
      ),
      ocrRequired,
    }));
  }

  private getAgencyTier(agencyId: string): AgencyTier {
    // Simple tier assignment based on agency ID
    switch (agencyId) {
      case 'police':
      case 'fire':
        return 'enterprise';
      case 'parks':
      case 'health':
        return 'premium';
      default:
        return 'basic';
    }
  }

  private generateTierUtilization(): TierUtilization {
    const maxRequests = 1000;
    const maxStorage = 10000; // MB
    const maxDocuments = 5000;

    return {
      maxRequests,
      usedRequests: this.generateRandomCount(200, 800),
      maxStorage,
      usedStorage: this.generateRandomCount(2000, 8000),
      maxDocuments,
      usedDocuments: this.generateRandomCount(500, 4000),
    };
  }

  private generateBillingHistory(): BillingRecord[] {
    const records: BillingRecord[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
      records.push({
        date: date.toISOString(),
        amount: this.generateRandomFloat(500, 2000),
        description: `Monthly subscription - ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        status: i === 0 ? 'pending' : 'paid',
      });
    }

    return records;
  }

  private generateBenchmarkComparisons(): BenchmarkComparison[] {
    const metrics = [
      'Response Time',
      'Completion Rate',
      'User Satisfaction',
      'Cost Efficiency',
    ];

    return metrics.map(metric => {
      const agencyValue = this.generateRandomFloat(70, 95);
      const benchmarkValue = this.generateRandomFloat(75, 90);
      const diff = ((agencyValue - benchmarkValue) / benchmarkValue) * 100;

      return {
        metric,
        agencyValue,
        benchmarkValue,
        percentageDifference: Math.round(diff * 100) / 100,
        trend: diff > 0 ? 'improving' : diff < -5 ? 'declining' : 'stable',
      };
    });
  }

  private generateActiveAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const alertTypes = [
      {
        severity: 'high' as const,
        title: 'High Response Time',
        description: 'Average response time exceeds 150ms',
      },
      {
        severity: 'medium' as const,
        title: 'Storage Usage',
        description: 'Storage usage above 80% threshold',
      },
      {
        severity: 'low' as const,
        title: 'Pending Reviews',
        description: '15 documents awaiting manual review',
      },
    ];

    // Randomly include some alerts
    alertTypes.forEach((alert, index) => {
      if (Math.random() > 0.7) {
        alerts.push({
          id: `alert_${index}`,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          timestamp: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000
          ).toISOString(),
          resolved: false,
        });
      }
    });

    return alerts;
  }

  private generateRecentIssues(): SystemIssue[] {
    const issues: SystemIssue[] = [];
    const issueTypes = [
      {
        title: 'OCR Service Timeout',
        impact: 'medium' as const,
        resolved: true,
      },
      {
        title: 'Database Connection Slow',
        impact: 'low' as const,
        resolved: true,
      },
      { title: 'File Upload Error', impact: 'high' as const, resolved: false },
    ];

    issueTypes.forEach((issue, index) => {
      if (Math.random() > 0.5) {
        issues.push({
          id: `issue_${index}`,
          title: issue.title,
          description: `System issue detected: ${issue.title}`,
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          impact: issue.impact,
          resolved: issue.resolved,
          resolutionTime: issue.resolved
            ? this.generateRandomCount(15, 240)
            : undefined,
        });
      }
    });

    return issues;
  }

  private getAgencyName(agencyId: string): string {
    const agencyNames: Record<string, string> = {
      police: 'Police Department',
      fire: 'Fire Department',
      finance: 'Finance Department',
      parks: 'Parks & Recreation',
      health: 'Health Department',
      basic: 'Basic Agency',
    };

    return agencyNames[agencyId] || 'Unknown Agency';
  }

  private getDefaultDashboardConfig(agencyId: string): DashboardConfig {
    return {
      agencyId,
      refreshInterval: 30, // 30 seconds
      timeZone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
      layout: {
        columns: 4,
        widgets: [
          {
            id: 'requests-kpi',
            type: 'kpi-card',
            title: 'Total Requests',
            size: { width: 1, height: 1 },
            position: { x: 0, y: 0 },
            config: { metric: 'totalRequests' },
            visible: true,
          },
          {
            id: 'completion-rate',
            type: 'kpi-card',
            title: 'Completion Rate',
            size: { width: 1, height: 1 },
            position: { x: 1, y: 0 },
            config: { metric: 'completionRate' },
            visible: true,
          },
          {
            id: 'processing-time',
            type: 'line-chart',
            title: 'Processing Time Trend',
            size: { width: 2, height: 2 },
            position: { x: 0, y: 1 },
            config: { metric: 'processingTime', showTrend: true },
            visible: true,
          },
          {
            id: 'document-formats',
            type: 'pie-chart',
            title: 'Document Formats',
            size: { width: 2, height: 2 },
            position: { x: 2, y: 1 },
            config: { metric: 'formatDistribution' },
            visible: true,
          },
        ],
      },
    };
  }

  private exportToCSV(metrics: AgencyMetrics): Blob {
    const csvData = this.metricsToCSV(metrics);
    return new Blob([csvData], { type: 'text/csv' });
  }

  private exportToJSON(metrics: AgencyMetrics): Blob {
    const jsonData = JSON.stringify(metrics, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  private exportToXLSX(metrics: AgencyMetrics): Blob {
    // Simplified XLSX export (would use a library like xlsx in production)
    const csvData = this.metricsToCSV(metrics);
    return new Blob([csvData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  private metricsToCSV(metrics: AgencyMetrics): string {
    const rows = [
      'Metric,Value,Unit',
      `Total Requests,${metrics.requestMetrics.totalRequests},count`,
      `Completed Requests,${metrics.requestMetrics.completedRequests},count`,
      `Average Processing Time,${metrics.requestMetrics.averageProcessingTime},minutes`,
      `Total Documents,${metrics.documentMetrics.totalDocuments},count`,
      `OCR Success Rate,${metrics.documentMetrics.ocrSuccessRate},%`,
      `Current Period Cost,${metrics.costMetrics.currentPeriodCost},USD`,
      `System Uptime,${metrics.systemHealth.uptime},%`,
      `Response Time,${metrics.systemHealth.responseTime},ms`,
    ];

    return rows.join('\n');
  }
}

// Export singleton instance
export const agencyAnalyticsService = new AgencyAnalyticsService();
export default agencyAnalyticsService;
