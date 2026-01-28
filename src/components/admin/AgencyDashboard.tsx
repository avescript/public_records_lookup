/**
 * Agency Dashboard Component
 * Epic 9 Task 6: Agency Dashboard & Analytics
 * 
 * Real-time dashboard with interactive charts, KPIs, and agency performance metrics
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  agencyAnalyticsService,
  type AgencyMetrics,
  type TimeRange,
  type DashboardConfig,
  type PerformanceKPIs
} from '../../services/agencyAnalyticsService';

interface DashboardProps {
  agencyId: string;
}

const AgencyDashboard: React.FC<DashboardProps> = ({ agencyId }) => {
  // State Management
  const [metrics, setMetrics] = useState<AgencyMetrics | null>(null);
  const [kpis, setKpis] = useState<PerformanceKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    granularity: 'day'
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Data Loading
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, kpisData, configData] = await Promise.all([
        agencyAnalyticsService.getAgencyMetrics(agencyId, timeRange),
        agencyAnalyticsService.getRealTimeKPIs(agencyId),
        agencyAnalyticsService.getDashboardConfig(agencyId)
      ]);

      setMetrics(metricsData);
      setKpis(kpisData);
      setConfig(configData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [agencyId, timeRange]);

  // Setup Auto-refresh
  useEffect(() => {
    loadDashboardData();

    if (config?.refreshInterval) {
      const interval = setInterval(loadDashboardData, config.refreshInterval * 1000);
      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [loadDashboardData, config?.refreshInterval]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  // Time Range Handlers
  const handleTimeRangeChange = (newTimeRange: Partial<TimeRange>) => {
    setTimeRange(prev => ({ ...prev, ...newTimeRange }));
  };

  const handleQuickTimeRange = (range: string) => {
    const now = new Date();
    let startDate: Date;
    let granularity: TimeRange['granularity'] = 'day';

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        granularity = 'hour';
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        granularity = 'day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        granularity = 'day';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        granularity = 'week';
        break;
      default:
        return;
    }

    setTimeRange({
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      granularity
    });
  };

  // Export Handler
  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      const blob = await agencyAnalyticsService.exportAnalytics(agencyId, timeRange, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agency-analytics-${agencyId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  // Computed Values
  const systemHealthStatus = useMemo(() => {
    if (!metrics) return null;
    const health = metrics.systemHealth;
    
    return {
      color: health.overallHealth === 'healthy' ? 'text-green-600' :
             health.overallHealth === 'warning' ? 'text-yellow-600' : 'text-red-600',
      bgColor: health.overallHealth === 'healthy' ? 'bg-green-100' :
               health.overallHealth === 'warning' ? 'bg-yellow-100' : 'bg-red-100',
      status: health.overallHealth.toUpperCase()
    };
  }, [metrics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics || !kpis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.agencyName} Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time analytics and performance metrics
            </p>
          </div>
          
          {/* System Health Indicator */}
          {systemHealthStatus && (
            <div className={`px-4 py-2 rounded-lg ${systemHealthStatus.bgColor}`}>
              <span className={`text-sm font-medium ${systemHealthStatus.color}`}>
                System: {systemHealthStatus.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Time Range Quick Selectors */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">Time Range:</span>
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => handleQuickTimeRange(range)}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">Export:</span>
            {['csv', 'json', 'xlsx'].map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format as any)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md 
                     hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Requests/Hour"
          value={kpis.requestsPerHour}
          unit=""
          trend="up"
          color="blue"
        />
        <KPICard
          title="System Availability"
          value={kpis.systemAvailability}
          unit="%"
          trend="stable"
          color="green"
        />
        <KPICard
          title="User Satisfaction"
          value={kpis.userSatisfactionScore}
          unit="/5"
          trend="up"
          color="purple"
        />
        <KPICard
          title="Cost Per Request"
          value={kpis.costPerRequest}
          unit="$"
          trend="down"
          color="orange"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Request Volume Trend */}
        <ChartCard title="Request Volume Trend">
          <LineChart 
            data={metrics.requestMetrics.requestVolumeTrend}
            title="Requests Over Time"
          />
        </ChartCard>

        {/* Processing Time Distribution */}
        <ChartCard title="Processing Time Distribution">
          <BarChart 
            data={metrics.requestMetrics.processingTimeDistribution}
            title="Processing Time Ranges"
          />
        </ChartCard>

        {/* Document Format Distribution */}
        <ChartCard title="Document Formats">
          <PieChart 
            data={metrics.documentMetrics.formatDistribution}
            title="Document Types Processed"
          />
        </ChartCard>

        {/* Cost Trend */}
        <ChartCard title="Cost Analysis">
          <LineChart 
            data={metrics.costMetrics.costTrend}
            title="Cost Over Time"
            color="#f59e0b"
          />
        </ChartCard>
      </div>

      {/* Detailed Metrics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Request Status Breakdown */}
        <MetricsTable
          title="Request Status Breakdown"
          data={metrics.requestMetrics.statusDistribution.map(item => ({
            label: item.status,
            value: item.count.toString(),
            percentage: `${item.percentage}%`
          }))}
        />

        {/* System Performance Metrics */}
        <MetricsTable
          title="System Performance"
          data={[
            { label: 'CPU Usage', value: `${metrics.systemHealth.cpuUsage}%`, percentage: '' },
            { label: 'Memory Usage', value: `${metrics.systemHealth.memoryUsage}%`, percentage: '' },
            { label: 'Storage Usage', value: `${metrics.systemHealth.storageUsage}%`, percentage: '' },
            { label: 'Response Time', value: `${metrics.systemHealth.responseTime}ms`, percentage: '' },
          ]}
        />
      </div>

      {/* Alerts and Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Alerts */}
        <AlertsList alerts={metrics.systemHealth.activeAlerts} />
        
        {/* Recent Issues */}
        <IssuesList issues={metrics.systemHealth.recentIssues} />
      </div>
    </div>
  );
};

// Supporting Components
const KPICard: React.FC<{
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ title, value, unit, trend, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
  };

  const trendIcon = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} shadow-sm`}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? 
            (unit === '$' ? `$${value.toFixed(2)}` : `${value.toFixed(unit === '%' ? 1 : 0)}${unit}`) : 
            value
          }
        </span>
        <span className="text-lg">{trendIcon[trend]}</span>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ 
  title, 
  children 
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const LineChart: React.FC<{ 
  data: Array<{ timestamp: string; value: number; label?: string }>; 
  title: string;
  color?: string;
}> = ({ data, title, color = '#3b82f6' }) => (
  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
    <div className="text-center">
      <div className="text-gray-400 text-4xl mb-2">📈</div>
      <p className="text-gray-600">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{data.length} data points</p>
    </div>
  </div>
);

const BarChart: React.FC<{ 
  data: Array<{ timeRange: string; count: number; percentage: number }>; 
  title: string;
}> = ({ data, title }) => (
  <div className="h-64">
    <div className="flex items-end justify-between h-full space-x-2 p-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-blue-500 rounded-t-md"
            style={{ height: `${item.percentage * 2}%`, minHeight: '8px' }}
          />
          <span className="text-xs text-gray-600 mt-2 text-center">
            {item.timeRange}
          </span>
          <span className="text-xs text-gray-500">{item.count}</span>
        </div>
      ))}
    </div>
  </div>
);

const PieChart: React.FC<{ 
  data: Array<{ format: string; count: number; percentage: number }>; 
  title: string;
}> = ({ data, title }) => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center">
      <div className="text-gray-400 text-4xl mb-2">🥧</div>
      <p className="text-gray-600">{title}</p>
      <div className="mt-4 space-y-1">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.format}:</span>
            <span className="text-gray-900">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MetricsTable: React.FC<{
  title: string;
  data: Array<{ label: string; value: string; percentage: string }>;
}> = ({ title, data }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
          <span className="text-gray-600">{item.label}</span>
          <div className="text-right">
            <span className="text-gray-900 font-medium">{item.value}</span>
            {item.percentage && (
              <span className="text-gray-500 text-sm ml-2">({item.percentage})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AlertsList: React.FC<{
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    timestamp: string;
  }>;
}> = ({ alerts }) => {
  const severityColors = {
    low: 'bg-blue-50 text-blue-800 border-blue-200',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    high: 'bg-orange-50 text-orange-800 border-orange-200',
    critical: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-500 text-3xl mb-2">✅</div>
          <p className="text-gray-600">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">{alert.title}</span>
                <span className="text-xs uppercase tracking-wide">
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm opacity-90 mb-2">{alert.description}</p>
              <span className="text-xs opacity-75">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IssuesList: React.FC<{
  issues: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    impact: 'low' | 'medium' | 'high';
    resolved: boolean;
    resolutionTime?: number;
  }>;
}> = ({ issues }) => {
  const impactColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Issues</h3>
      {issues.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-500 text-3xl mb-2">🛡️</div>
          <p className="text-gray-600">No recent issues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div 
              key={issue.id}
              className={`p-3 rounded-lg border ${
                issue.resolved ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium flex items-center">
                  {issue.resolved ? '✅' : '⚠️'} {issue.title}
                </span>
                <span className={`text-xs ${impactColors[issue.impact]}`}>
                  {issue.impact} impact
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(issue.timestamp).toLocaleString()}</span>
                {issue.resolved && issue.resolutionTime && (
                  <span>Resolved in {issue.resolutionTime}min</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;