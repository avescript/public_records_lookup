/**
 * BigQuery Export Service for Public Records AI Assistant
 * 
 * Provides export functionality for audit data, events, deliveries, and errors
 * with BigQuery-compatible schema and mock exporter functionality.
 */

import { auditService, AuditEvent, AuditFilter } from './auditService';

// BigQuery Schema Definitions
export interface BigQueryEvent {
  event_id: string;
  timestamp: string;
  service: string;
  action: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  actor_session_id?: string;
  subject_type: string;
  subject_id: string;
  subject_metadata: string; // JSON string
  context_request_id?: string;
  context_record_id?: string;
  context_package_id?: string;
  context_file_name?: string;
  context_client_info: string; // JSON string
  details: string; // JSON string
  severity: string;
  category: string;
  date_partition: string; // YYYY-MM-DD for partitioning
}

export interface BigQueryDelivery {
  delivery_id: string;
  request_id: string;
  package_id: string;
  recipient_email: string;
  delivery_method: 'email' | 'portal' | 'mail';
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_timestamp?: string;
  delivered_timestamp?: string;
  failed_timestamp?: string;
  failure_reason?: string;
  file_count: number;
  total_size_bytes: number;
  tracking_number?: string;
  date_partition: string;
}

export interface BigQueryError {
  error_id: string;
  timestamp: string;
  service: string;
  error_type: 'validation' | 'processing' | 'delivery' | 'system' | 'security';
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  request_id?: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  user_agent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_timestamp?: string;
  date_partition: string;
}

export interface BigQueryMetrics {
  metric_id: string;
  timestamp: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  dimensions: string; // JSON string of key-value pairs
  request_id?: string;
  service: string;
  date_partition: string;
}

export interface ExportSummary {
  export_id: string;
  timestamp: string;
  dataset_name: string;
  tables_exported: string[];
  events_count: number;
  deliveries_count: number;
  errors_count: number;
  metrics_count: number;
  time_range: {
    start: string;
    end: string;
  };
  export_size_bytes: number;
  export_format: 'json' | 'csv' | 'newline_delimited_json';
}

class BigQueryExportService {
  private readonly DATASET_NAME = 'pr_ai_audit_us_west';
  private readonly EXPORT_STORAGE_KEY = 'bigquery_exports';

  /**
   * Export audit events to BigQuery format
   */
  async exportEvents(filter: AuditFilter = {}): Promise<BigQueryEvent[]> {
    try {
      const events = await auditService.getEvents({
        ...filter,
        limit: 50000, // Large export limit
      });

      return events.map(event => this.convertEventToBigQuery(event));
    } catch (error) {
      console.error('Failed to export events:', error);
      throw new Error('Failed to export events for BigQuery');
    }
  }

  /**
   * Export delivery data to BigQuery format
   */
  async exportDeliveries(filter: { 
    startDate?: string;
    endDate?: string;
    status?: string[];
  } = {}): Promise<BigQueryDelivery[]> {
    try {
      // Mock delivery data - in production this would come from delivery service
      const deliveries = this.generateMockDeliveries(filter);
      return deliveries.map(delivery => this.convertDeliveryToBigQuery(delivery));
    } catch (error) {
      console.error('Failed to export deliveries:', error);
      throw new Error('Failed to export deliveries for BigQuery');
    }
  }

  /**
   * Export error data to BigQuery format
   */
  async exportErrors(filter: {
    startDate?: string;
    endDate?: string;
    severity?: string[];
    resolved?: boolean;
  } = {}): Promise<BigQueryError[]> {
    try {
      // Mock error data - in production this would come from error tracking service
      const errors = this.generateMockErrors(filter);
      return errors.map(error => this.convertErrorToBigQuery(error));
    } catch (error) {
      console.error('Failed to export errors:', error);
      throw new Error('Failed to export errors for BigQuery');
    }
  }

  /**
   * Export performance metrics to BigQuery format
   */
  async exportMetrics(filter: {
    startDate?: string;
    endDate?: string;
    services?: string[];
  } = {}): Promise<BigQueryMetrics[]> {
    try {
      // Mock metrics data - in production this would come from monitoring service
      const metrics = this.generateMockMetrics(filter);
      return metrics.map(metric => this.convertMetricToBigQuery(metric));
    } catch (error) {
      console.error('Failed to export metrics:', error);
      throw new Error('Failed to export metrics for BigQuery');
    }
  }

  /**
   * Create a complete export of all data types
   */
  async createFullExport(filter: {
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'csv' | 'newline_delimited_json';
  } = {}): Promise<ExportSummary> {
    try {
      const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const format = filter.format || 'json';

      // Export all data types
      const [events, deliveries, errors, metrics] = await Promise.all([
        this.exportEvents({
          startDate: filter.startDate,
          endDate: filter.endDate,
        }),
        this.exportDeliveries({
          startDate: filter.startDate,
          endDate: filter.endDate,
        }),
        this.exportErrors({
          startDate: filter.startDate,
          endDate: filter.endDate,
        }),
        this.exportMetrics({
          startDate: filter.startDate,
          endDate: filter.endDate,
        }),
      ]);

      // Create export summary
      const summary: ExportSummary = {
        export_id: exportId,
        timestamp: new Date().toISOString(),
        dataset_name: this.DATASET_NAME,
        tables_exported: ['events', 'deliveries', 'errors', 'metrics'],
        events_count: events.length,
        deliveries_count: deliveries.length,
        errors_count: errors.length,
        metrics_count: metrics.length,
        time_range: {
          start: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: filter.endDate || new Date().toISOString(),
        },
        export_size_bytes: this.calculateExportSize({ events, deliveries, errors, metrics }),
        export_format: format,
      };

      // Save export record
      await this.saveExportRecord(summary);

      // In production, this would upload to BigQuery
      console.log('📊 BigQuery Export Summary:', summary);

      return summary;
    } catch (error) {
      console.error('Failed to create full export:', error);
      throw new Error('Failed to create full export');
    }
  }

  /**
   * Download export data as files
   */
  async downloadExport(
    exportId: string,
    format: 'json' | 'csv' | 'newline_delimited_json' = 'json'
  ): Promise<void> {
    try {
      // Get fresh data for download
      const [events, deliveries, errors, metrics] = await Promise.all([
        this.exportEvents(),
        this.exportDeliveries(),
        this.exportErrors(),
        this.exportMetrics(),
      ]);

      // Create download files
      if (format === 'json') {
        this.downloadAsJSON({
          events,
          deliveries,
          errors,
          metrics,
          export_metadata: {
            export_id: exportId,
            timestamp: new Date().toISOString(),
            dataset_name: this.DATASET_NAME,
          },
        }, `bigquery-export-${exportId}.json`);
      } else if (format === 'csv') {
        // Download separate CSV files for each table
        this.downloadAsCSV(events, `events-${exportId}.csv`);
        this.downloadAsCSV(deliveries, `deliveries-${exportId}.csv`);
        this.downloadAsCSV(errors, `errors-${exportId}.csv`);
        this.downloadAsCSV(metrics, `metrics-${exportId}.csv`);
      } else if (format === 'newline_delimited_json') {
        this.downloadAsNDJSON(events, `events-${exportId}.ndjson`);
        this.downloadAsNDJSON(deliveries, `deliveries-${exportId}.ndjson`);
        this.downloadAsNDJSON(errors, `errors-${exportId}.ndjson`);
        this.downloadAsNDJSON(metrics, `metrics-${exportId}.ndjson`);
      }
    } catch (error) {
      console.error('Failed to download export:', error);
      throw new Error('Failed to download export');
    }
  }

  /**
   * Get BigQuery schema definitions
   */
  getBigQuerySchemas() {
    return {
      events: {
        fields: [
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'service', type: 'STRING', mode: 'REQUIRED' },
          { name: 'action', type: 'STRING', mode: 'REQUIRED' },
          { name: 'actor_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'actor_name', type: 'STRING', mode: 'NULLABLE' },
          { name: 'actor_role', type: 'STRING', mode: 'REQUIRED' },
          { name: 'actor_session_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'subject_type', type: 'STRING', mode: 'REQUIRED' },
          { name: 'subject_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'subject_metadata', type: 'JSON', mode: 'NULLABLE' },
          { name: 'context_request_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'context_record_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'context_package_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'context_file_name', type: 'STRING', mode: 'NULLABLE' },
          { name: 'context_client_info', type: 'JSON', mode: 'NULLABLE' },
          { name: 'details', type: 'JSON', mode: 'NULLABLE' },
          { name: 'severity', type: 'STRING', mode: 'REQUIRED' },
          { name: 'category', type: 'STRING', mode: 'REQUIRED' },
          { name: 'date_partition', type: 'DATE', mode: 'REQUIRED' },
        ],
        partitioning: {
          type: 'DAY',
          field: 'date_partition',
        },
        clustering: ['service', 'action', 'severity'],
      },
      deliveries: {
        fields: [
          { name: 'delivery_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'request_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'package_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'recipient_email', type: 'STRING', mode: 'REQUIRED' },
          { name: 'delivery_method', type: 'STRING', mode: 'REQUIRED' },
          { name: 'delivery_status', type: 'STRING', mode: 'REQUIRED' },
          { name: 'sent_timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'delivered_timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'failed_timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'failure_reason', type: 'STRING', mode: 'NULLABLE' },
          { name: 'file_count', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'total_size_bytes', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'tracking_number', type: 'STRING', mode: 'NULLABLE' },
          { name: 'date_partition', type: 'DATE', mode: 'REQUIRED' },
        ],
        partitioning: {
          type: 'DAY',
          field: 'date_partition',
        },
        clustering: ['delivery_status', 'delivery_method'],
      },
      errors: {
        fields: [
          { name: 'error_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'service', type: 'STRING', mode: 'REQUIRED' },
          { name: 'error_type', type: 'STRING', mode: 'REQUIRED' },
          { name: 'error_code', type: 'STRING', mode: 'NULLABLE' },
          { name: 'error_message', type: 'STRING', mode: 'REQUIRED' },
          { name: 'stack_trace', type: 'STRING', mode: 'NULLABLE' },
          { name: 'request_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'session_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'url', type: 'STRING', mode: 'NULLABLE' },
          { name: 'user_agent', type: 'STRING', mode: 'NULLABLE' },
          { name: 'severity', type: 'STRING', mode: 'REQUIRED' },
          { name: 'resolved', type: 'BOOLEAN', mode: 'REQUIRED' },
          { name: 'resolved_timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'date_partition', type: 'DATE', mode: 'REQUIRED' },
        ],
        partitioning: {
          type: 'DAY',
          field: 'date_partition',
        },
        clustering: ['error_type', 'severity', 'resolved'],
      },
      metrics: {
        fields: [
          { name: 'metric_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'metric_name', type: 'STRING', mode: 'REQUIRED' },
          { name: 'metric_value', type: 'FLOAT', mode: 'REQUIRED' },
          { name: 'metric_unit', type: 'STRING', mode: 'REQUIRED' },
          { name: 'dimensions', type: 'JSON', mode: 'NULLABLE' },
          { name: 'request_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'service', type: 'STRING', mode: 'REQUIRED' },
          { name: 'date_partition', type: 'DATE', mode: 'REQUIRED' },
        ],
        partitioning: {
          type: 'DAY',
          field: 'date_partition',
        },
        clustering: ['metric_name', 'service'],
      },
    };
  }

  /**
   * Get example Looker Studio SQL queries
   */
  getLookerStudioQueries() {
    return {
      request_turnaround_time: `
        SELECT 
          DATE(timestamp) as date,
          AVG(CAST(JSON_EXTRACT_SCALAR(details, '$.processing_time_hours') AS FLOAT64)) as avg_turnaround_hours,
          COUNT(*) as total_requests
        FROM \`${this.DATASET_NAME}.events\`
        WHERE action = 'request_completed'
          AND date_partition >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY date
        ORDER BY date DESC
      `,
      
      backlog_trend: `
        SELECT 
          DATE(timestamp) as date,
          service,
          COUNT(*) as events_count,
          COUNTIF(category = 'error') as error_count
        FROM \`${this.DATASET_NAME}.events\`
        WHERE date_partition >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        GROUP BY date, service
        ORDER BY date DESC, service
      `,
      
      sla_breaches: `
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as total_requests,
          COUNTIF(CAST(JSON_EXTRACT_SCALAR(details, '$.sla_breached') AS BOOL)) as breached_requests,
          SAFE_DIVIDE(
            COUNTIF(CAST(JSON_EXTRACT_SCALAR(details, '$.sla_breached') AS BOOL)),
            COUNT(*)
          ) * 100 as breach_percentage
        FROM \`${this.DATASET_NAME}.events\`
        WHERE action = 'request_completed'
          AND date_partition >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY date
        ORDER BY date DESC
      `,
      
      delivery_success_rate: `
        SELECT 
          DATE(sent_timestamp) as date,
          delivery_method,
          COUNT(*) as total_deliveries,
          COUNTIF(delivery_status = 'delivered') as successful_deliveries,
          SAFE_DIVIDE(
            COUNTIF(delivery_status = 'delivered'), 
            COUNT(*)
          ) * 100 as success_rate_percent
        FROM \`${this.DATASET_NAME}.deliveries\`
        WHERE date_partition >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY date, delivery_method
        ORDER BY date DESC, delivery_method
      `,
      
      error_analysis: `
        SELECT 
          DATE(timestamp) as date,
          service,
          error_type,
          severity,
          COUNT(*) as error_count,
          COUNTIF(resolved) as resolved_count,
          SAFE_DIVIDE(COUNTIF(resolved), COUNT(*)) * 100 as resolution_rate_percent
        FROM \`${this.DATASET_NAME}.errors\`
        WHERE date_partition >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        GROUP BY date, service, error_type, severity
        ORDER BY date DESC, error_count DESC
      `,
    };
  }

  // Private helper methods

  private convertEventToBigQuery(event: AuditEvent): BigQueryEvent {
    return {
      event_id: event.id,
      timestamp: event.timestamp,
      service: event.service,
      action: event.action,
      actor_id: event.actor.id,
      actor_name: event.actor.name,
      actor_role: event.actor.role,
      actor_session_id: event.actor.sessionId,
      subject_type: event.subject.type,
      subject_id: event.subject.id,
      subject_metadata: JSON.stringify(event.subject.metadata || {}),
      context_request_id: event.context.requestId,
      context_record_id: event.context.recordId,
      context_package_id: event.context.packageId,
      context_file_name: event.context.fileName,
      context_client_info: JSON.stringify(event.context.clientInfo || {}),
      details: JSON.stringify(event.details),
      severity: event.severity,
      category: event.category,
      date_partition: event.timestamp.split('T')[0], // Extract YYYY-MM-DD
    };
  }

  private convertDeliveryToBigQuery(delivery: any): BigQueryDelivery {
    return {
      delivery_id: delivery.id,
      request_id: delivery.requestId,
      package_id: delivery.packageId,
      recipient_email: delivery.recipientEmail,
      delivery_method: delivery.method,
      delivery_status: delivery.status,
      sent_timestamp: delivery.sentAt,
      delivered_timestamp: delivery.deliveredAt,
      failed_timestamp: delivery.failedAt,
      failure_reason: delivery.failureReason,
      file_count: delivery.fileCount,
      total_size_bytes: delivery.sizeBytes,
      tracking_number: delivery.trackingNumber,
      date_partition: (delivery.sentAt || delivery.createdAt).split('T')[0],
    };
  }

  private convertErrorToBigQuery(error: any): BigQueryError {
    return {
      error_id: error.id,
      timestamp: error.timestamp,
      service: error.service,
      error_type: error.type,
      error_code: error.code,
      error_message: error.message,
      stack_trace: error.stackTrace,
      request_id: error.requestId,
      user_id: error.userId,
      session_id: error.sessionId,
      url: error.url,
      user_agent: error.userAgent,
      severity: error.severity,
      resolved: error.resolved,
      resolved_timestamp: error.resolvedAt,
      date_partition: error.timestamp.split('T')[0],
    };
  }

  private convertMetricToBigQuery(metric: any): BigQueryMetrics {
    return {
      metric_id: metric.id,
      timestamp: metric.timestamp,
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit,
      dimensions: JSON.stringify(metric.dimensions || {}),
      request_id: metric.requestId,
      service: metric.service,
      date_partition: metric.timestamp.split('T')[0],
    };
  }

  private generateMockDeliveries(filter: any): any[] {
    // Generate mock delivery data
    const deliveries = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const createdAt = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const sentAt = new Date(createdAt.getTime() + (2 * 60 * 60 * 1000));
      const deliveredAt = Math.random() > 0.1 ? new Date(sentAt.getTime() + (30 * 60 * 1000)) : null;
      
      deliveries.push({
        id: `delivery_${i + 1}`,
        requestId: `req_${i + 1}`,
        packageId: `pkg_${i + 1}`,
        recipientEmail: `user${i + 1}@example.com`,
        method: Math.random() > 0.5 ? 'email' : 'portal',
        status: deliveredAt ? 'delivered' : (Math.random() > 0.8 ? 'failed' : 'sent'),
        createdAt: createdAt.toISOString(),
        sentAt: sentAt.toISOString(),
        deliveredAt: deliveredAt?.toISOString(),
        failedAt: !deliveredAt && Math.random() > 0.8 ? sentAt.toISOString() : null,
        failureReason: !deliveredAt && Math.random() > 0.8 ? 'Email bounced' : null,
        fileCount: Math.floor(Math.random() * 10) + 1,
        sizeBytes: Math.floor(Math.random() * 50000000) + 1000000, // 1MB to 50MB
        trackingNumber: `TRK${String(i + 1).padStart(6, '0')}`,
      });
    }
    
    return deliveries;
  }

  private generateMockErrors(filter: any): any[] {
    // Generate mock error data
    const errors = [];
    const now = new Date();
    const errorTypes = ['validation', 'processing', 'delivery', 'system', 'security'];
    const services = ['RequestService', 'AIMatchingService', 'PackageService', 'DeliveryService'];
    
    for (let i = 0; i < 25; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const resolved = Math.random() > 0.3;
      
      errors.push({
        id: `error_${i + 1}`,
        timestamp: timestamp.toISOString(),
        service: services[Math.floor(Math.random() * services.length)],
        type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
        code: `E${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        message: `Sample error message ${i + 1}`,
        stackTrace: Math.random() > 0.5 ? `Error stack trace ${i + 1}` : null,
        requestId: Math.random() > 0.3 ? `req_${i + 1}` : null,
        userId: Math.random() > 0.5 ? `user_${i + 1}` : null,
        sessionId: `session_${i + 1}`,
        url: `/api/endpoint${i + 1}`,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        resolved,
        resolvedAt: resolved ? new Date(timestamp.getTime() + (60 * 60 * 1000)).toISOString() : null,
      });
    }
    
    return errors;
  }

  private generateMockMetrics(filter: any): any[] {
    // Generate mock metrics data
    const metrics = [];
    const now = new Date();
    const metricNames = [
      'request_processing_time_ms',
      'ai_matching_accuracy',
      'redaction_processing_time_ms',
      'package_build_time_ms',
      'delivery_success_rate',
      'user_satisfaction_score',
    ];
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)); // Every 30 minutes
      
      metrics.push({
        id: `metric_${i + 1}`,
        timestamp: timestamp.toISOString(),
        name: metricNames[Math.floor(Math.random() * metricNames.length)],
        value: Math.random() * 1000,
        unit: 'milliseconds',
        dimensions: {
          service: 'RequestService',
          environment: 'production',
          region: 'us-west',
        },
        requestId: Math.random() > 0.7 ? `req_${i + 1}` : null,
        service: 'MetricsService',
      });
    }
    
    return metrics;
  }

  private calculateExportSize(data: {
    events: BigQueryEvent[];
    deliveries: BigQueryDelivery[];
    errors: BigQueryError[];
    metrics: BigQueryMetrics[];
  }): number {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  private async saveExportRecord(summary: ExportSummary): Promise<void> {
    try {
      const stored = localStorage.getItem(this.EXPORT_STORAGE_KEY);
      const exports = stored ? JSON.parse(stored) : [];
      exports.push(summary);
      
      // Keep only last 100 exports
      if (exports.length > 100) {
        exports.splice(0, exports.length - 100);
      }
      
      localStorage.setItem(this.EXPORT_STORAGE_KEY, JSON.stringify(exports));
    } catch (error) {
      console.warn('Failed to save export record:', error);
    }
  }

  private downloadAsJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    this.downloadBlob(blob, filename);
  }

  private downloadAsCSV(data: any[], filename: string): void {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      ),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    this.downloadBlob(blob, filename);
  }

  private downloadAsNDJSON(data: any[], filename: string): void {
    const ndjsonContent = data.map(item => JSON.stringify(item)).join('\n');
    const blob = new Blob([ndjsonContent], { type: 'application/x-ndjson' });
    this.downloadBlob(blob, filename);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const bigQueryExportService = new BigQueryExportService();
export default bigQueryExportService;