/**
 * Alert System Service
 * Epic 9 Task 6: Agency Dashboard & Analytics
 *
 * Comprehensive alert system for performance thresholds, budget overages,
 * and system health monitoring with real-time notifications
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  agencyId: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: AlertThreshold;
  actions: AlertAction[];
  enabled: boolean;
  priority: AlertPriority;
  cooldownPeriod: number; // minutes
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | 'performance'
  | 'cost'
  | 'system_health'
  | 'usage'
  | 'security'
  | 'compliance';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AlertCondition {
  metric: string;
  operator:
    | 'greater_than'
    | 'less_than'
    | 'equals'
    | 'not_equals'
    | 'percentage_change';
  value: number;
  duration?: number; // minutes - how long condition must persist
  comparison?: 'previous_period' | 'baseline' | 'absolute';
}

export interface AlertThreshold {
  warning: number;
  critical: number;
  unit: string;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'dashboard' | 'slack' | 'teams';
  config: AlertActionConfig;
  enabled: boolean;
}

export interface AlertActionConfig {
  recipients?: string[];
  url?: string;
  template?: string;
  subject?: string;
  message?: string;
  channel?: string;
  [key: string]: any;
}

export interface Alert {
  id: string;
  ruleId: string;
  agencyId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  timestamp: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  metadata: Record<string, any>;
}

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

export interface AlertSummary {
  total: number;
  byPriority: Record<AlertPriority, number>;
  byType: Record<AlertType, number>;
  byStatus: Record<AlertStatus, number>;
  recent: Alert[];
}

export interface AlertNotification {
  id: string;
  alertId: string;
  action: AlertAction;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  alertsToday: number;
  averageResolutionTime: number; // minutes
  topAlertTypes: Array<{ type: AlertType; count: number }>;
  alertTrend: Array<{ date: string; count: number }>;
}

/**
 * Alert System Service Class
 */
export class AlertSystemService {
  private alertRules: Map<string, AlertRule[]> = new Map();
  private activeAlerts: Map<string, Alert[]> = new Map();
  private alertHistory: Map<string, Alert[]> = new Map();
  private notifications: Map<string, AlertNotification[]> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Predefined alert templates
  private readonly alertTemplates: Record<string, Partial<AlertRule>> = {
    high_response_time: {
      name: 'High Response Time',
      description: 'Alert when average response time exceeds threshold',
      type: 'performance',
      condition: {
        metric: 'response_time',
        operator: 'greater_than',
        value: 1000,
        duration: 5,
      },
      threshold: {
        warning: 1000,
        critical: 2000,
        unit: 'ms',
      },
      priority: 'high',
    },
    budget_exceeded: {
      name: 'Budget Exceeded',
      description: 'Alert when monthly costs exceed budget',
      type: 'cost',
      condition: {
        metric: 'monthly_cost',
        operator: 'greater_than',
        value: 0,
        comparison: 'baseline',
      },
      priority: 'critical',
    },
    system_downtime: {
      name: 'System Downtime',
      description: 'Alert when system availability drops',
      type: 'system_health',
      condition: {
        metric: 'uptime',
        operator: 'less_than',
        value: 99,
        duration: 1,
      },
      threshold: {
        warning: 99,
        critical: 95,
        unit: '%',
      },
      priority: 'critical',
    },
    usage_spike: {
      name: 'Usage Spike',
      description: 'Alert when request volume increases significantly',
      type: 'usage',
      condition: {
        metric: 'request_volume',
        operator: 'percentage_change',
        value: 150,
        comparison: 'previous_period',
      },
      priority: 'medium',
    },
  };

  /**
   * Initialize alert monitoring for an agency
   */
  async initializeAgencyMonitoring(agencyId: string): Promise<void> {
    // Load existing rules or create defaults
    await this.loadAlertRules(agencyId);

    // Start monitoring
    this.startMonitoring(agencyId);

    console.log(`Alert monitoring initialized for agency: ${agencyId}`);
  }

  /**
   * Create a new alert rule
   */
  async createAlertRule(
    agencyId: string,
    rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AlertRule> {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agencyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store rule
    const rules = this.alertRules.get(agencyId) || [];
    rules.push(newRule);
    this.alertRules.set(agencyId, rules);

    // Restart monitoring to include new rule
    this.restartMonitoring(agencyId);

    return newRule;
  }

  /**
   * Update an alert rule
   */
  async updateAlertRule(
    agencyId: string,
    ruleId: string,
    updates: Partial<AlertRule>
  ): Promise<AlertRule | null> {
    const rules = this.alertRules.get(agencyId) || [];
    const ruleIndex = rules.findIndex(r => r.id === ruleId);

    if (ruleIndex === -1) return null;

    const updatedRule = {
      ...rules[ruleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    rules[ruleIndex] = updatedRule;
    this.alertRules.set(agencyId, rules);

    // Restart monitoring
    this.restartMonitoring(agencyId);

    return updatedRule;
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(agencyId: string, ruleId: string): Promise<boolean> {
    const rules = this.alertRules.get(agencyId) || [];
    const filteredRules = rules.filter(r => r.id !== ruleId);

    if (filteredRules.length === rules.length) return false;

    this.alertRules.set(agencyId, filteredRules);
    this.restartMonitoring(agencyId);

    return true;
  }

  /**
   * Get all alert rules for an agency
   */
  async getAlertRules(agencyId: string): Promise<AlertRule[]> {
    return this.alertRules.get(agencyId) || [];
  }

  /**
   * Get active alerts for an agency
   */
  async getActiveAlerts(agencyId: string): Promise<Alert[]> {
    return this.activeAlerts.get(agencyId) || [];
  }

  /**
   * Get alert history for an agency
   */
  async getAlertHistory(
    agencyId: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<Alert[]> {
    let history = this.alertHistory.get(agencyId) || [];

    // Filter by date range if provided
    if (startDate) {
      history = history.filter(alert => alert.timestamp >= startDate);
    }
    if (endDate) {
      history = history.filter(alert => alert.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit
    if (limit && limit > 0) {
      history = history.slice(0, limit);
    }

    return history;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    agencyId: string,
    alertId: string,
    acknowledgedBy: string,
    note?: string
  ): Promise<boolean> {
    const alerts = this.activeAlerts.get(agencyId) || [];
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    if (note) {
      alert.metadata.acknowledgmentNote = note;
    }

    return true;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    agencyId: string,
    alertId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<boolean> {
    const alerts = this.activeAlerts.get(agencyId) || [];
    const alertIndex = alerts.findIndex(a => a.id === alertId);

    if (alertIndex === -1) return false;

    const alert = alerts[alertIndex];
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolution = resolution;
    alert.metadata.resolvedBy = resolvedBy;

    // Move to history
    const history = this.alertHistory.get(agencyId) || [];
    history.push(alert);
    this.alertHistory.set(agencyId, history);

    // Remove from active alerts
    alerts.splice(alertIndex, 1);
    this.activeAlerts.set(agencyId, alerts);

    return true;
  }

  /**
   * Get alert summary for dashboard
   */
  async getAlertSummary(agencyId: string): Promise<AlertSummary> {
    const activeAlerts = await this.getActiveAlerts(agencyId);
    const recent = await this.getAlertHistory(
      agencyId,
      undefined,
      undefined,
      10
    );

    const summary: AlertSummary = {
      total: activeAlerts.length,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byType: {
        performance: 0,
        cost: 0,
        system_health: 0,
        usage: 0,
        security: 0,
        compliance: 0,
      },
      byStatus: {
        active: 0,
        acknowledged: 0,
        resolved: 0,
        suppressed: 0,
      },
      recent,
    };

    // Count by priority, type, and status
    activeAlerts.forEach(alert => {
      summary.byPriority[alert.priority]++;
      summary.byType[alert.type]++;
      summary.byStatus[alert.status]++;
    });

    return summary;
  }

  /**
   * Get alert metrics for analytics
   */
  async getAlertMetrics(
    agencyId: string,
    timeRange: { startDate: string; endDate: string }
  ): Promise<AlertMetrics> {
    const history = await this.getAlertHistory(
      agencyId,
      timeRange.startDate,
      timeRange.endDate
    );
    const activeAlerts = await this.getActiveAlerts(agencyId);

    // Calculate resolution times
    const resolvedAlerts = history.filter(a => a.resolvedAt);
    const resolutionTimes = resolvedAlerts.map(alert => {
      const start = new Date(alert.timestamp).getTime();
      const end = new Date(alert.resolvedAt!).getTime();
      return (end - start) / (1000 * 60); // minutes
    });

    const averageResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) /
          resolutionTimes.length
        : 0;

    // Count alerts today
    const today = new Date().toISOString().split('T')[0];
    const alertsToday = history.filter(alert =>
      alert.timestamp.startsWith(today)
    ).length;

    // Top alert types
    const typeCounts: Record<string, number> = {};
    history.forEach(alert => {
      typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
    });

    const topAlertTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as AlertType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Alert trend (daily counts)
    const alertTrend = this.generateAlertTrend(history, timeRange);

    return {
      totalAlerts: history.length,
      activeAlerts: activeAlerts.length,
      alertsToday,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      topAlertTypes,
      alertTrend,
    };
  }

  /**
   * Test an alert rule
   */
  async testAlertRule(
    agencyId: string,
    rule: AlertRule
  ): Promise<{
    wouldTrigger: boolean;
    currentValue: number;
    reason: string;
  }> {
    const currentValue = await this.getCurrentMetricValue(
      agencyId,
      rule.condition.metric
    );
    const wouldTrigger = this.evaluateCondition(rule.condition, currentValue);

    let reason = '';
    if (wouldTrigger) {
      reason = `Current ${rule.condition.metric} (${currentValue}) ${rule.condition.operator} threshold (${rule.condition.value})`;
    } else {
      reason = `Current ${rule.condition.metric} (${currentValue}) does not meet condition`;
    }

    return {
      wouldTrigger,
      currentValue,
      reason,
    };
  }

  /**
   * Get available alert templates
   */
  getAlertTemplates(): Record<string, Partial<AlertRule>> {
    return this.alertTemplates;
  }

  /**
   * Create alert from template
   */
  async createAlertFromTemplate(
    agencyId: string,
    templateKey: string,
    customizations?: Partial<AlertRule>
  ): Promise<AlertRule | null> {
    const template = this.alertTemplates[templateKey];
    if (!template) return null;

    const ruleData = {
      ...template,
      ...customizations,
      enabled: true,
      cooldownPeriod: 30,
      actions: customizations?.actions || [
        {
          type: 'dashboard' as const,
          config: {},
          enabled: true,
        },
      ],
    };

    return await this.createAlertRule(
      agencyId,
      ruleData as Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>
    );
  }

  // Private helper methods

  private async loadAlertRules(agencyId: string): Promise<void> {
    // In production, this would load from database
    // For now, create default rules if none exist
    const existingRules = this.alertRules.get(agencyId);
    if (existingRules && existingRules.length > 0) return;

    // Create default rules from templates
    const defaultRules = await Promise.all([
      this.createAlertFromTemplate(agencyId, 'high_response_time'),
      this.createAlertFromTemplate(agencyId, 'budget_exceeded'),
      this.createAlertFromTemplate(agencyId, 'system_downtime'),
      this.createAlertFromTemplate(agencyId, 'usage_spike'),
    ]);

    console.log(
      `Created ${defaultRules.filter(Boolean).length} default alert rules for ${agencyId}`
    );
  }

  private startMonitoring(agencyId: string): void {
    // Clear existing monitoring
    const existingInterval = this.monitoringIntervals.get(agencyId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new monitoring interval (every 60 seconds)
    const interval = setInterval(async () => {
      await this.checkAlertRules(agencyId);
    }, 60000);

    this.monitoringIntervals.set(agencyId, interval);
  }

  private restartMonitoring(agencyId: string): void {
    this.startMonitoring(agencyId);
  }

  private async checkAlertRules(agencyId: string): Promise<void> {
    const rules = this.alertRules.get(agencyId) || [];
    const enabledRules = rules.filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      try {
        // Check cooldown period
        if (rule.lastTriggered) {
          const lastTriggered = new Date(rule.lastTriggered).getTime();
          const now = Date.now();
          const cooldownMs = rule.cooldownPeriod * 60 * 1000;

          if (now - lastTriggered < cooldownMs) {
            continue; // Still in cooldown
          }
        }

        // Get current metric value
        const currentValue = await this.getCurrentMetricValue(
          agencyId,
          rule.condition.metric
        );

        // Evaluate condition
        if (this.evaluateCondition(rule.condition, currentValue)) {
          await this.triggerAlert(rule, currentValue);
        }
      } catch (error) {
        console.error(`Error checking alert rule ${rule.id}:`, error);
      }
    }
  }

  private async getCurrentMetricValue(
    agencyId: string,
    metric: string
  ): Promise<number> {
    // Mock metric values - in production, this would fetch from actual services
    const mockMetrics: Record<string, () => number> = {
      response_time: () => Math.random() * 2000 + 100,
      monthly_cost: () => Math.random() * 5000 + 1000,
      uptime: () => 99.5 + Math.random() * 0.49,
      request_volume: () => Math.random() * 1000 + 100,
      cpu_usage: () => Math.random() * 100,
      memory_usage: () => Math.random() * 100,
      error_rate: () => Math.random() * 5,
      storage_usage: () => Math.random() * 100,
    };

    const generator = mockMetrics[metric];
    return generator ? generator() : 0;
  }

  private evaluateCondition(
    condition: AlertCondition,
    currentValue: number
  ): boolean {
    switch (condition.operator) {
      case 'greater_than':
        return currentValue > condition.value;
      case 'less_than':
        return currentValue < condition.value;
      case 'equals':
        return currentValue === condition.value;
      case 'not_equals':
        return currentValue !== condition.value;
      case 'percentage_change':
        // For percentage change, would need historical data
        return Math.random() > 0.8; // Mock 20% chance
      default:
        return false;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    currentValue: number
  ): Promise<void> {
    // Create alert
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      agencyId: rule.agencyId,
      type: rule.type,
      priority: rule.priority,
      title: rule.name,
      description: rule.description,
      metric: rule.condition.metric,
      currentValue,
      thresholdValue: rule.condition.value,
      unit: rule.threshold.unit,
      timestamp: new Date().toISOString(),
      status: 'active',
      metadata: {
        rule: rule.name,
        condition: rule.condition,
      },
    };

    // Store alert
    const alerts = this.activeAlerts.get(rule.agencyId) || [];
    alerts.push(alert);
    this.activeAlerts.set(rule.agencyId, alerts);

    // Update rule last triggered
    rule.lastTriggered = new Date().toISOString();

    // Execute actions
    await this.executeAlertActions(alert, rule.actions);

    console.log(`Alert triggered: ${alert.title} for agency ${rule.agencyId}`);
  }

  private async executeAlertActions(
    alert: Alert,
    actions: AlertAction[]
  ): Promise<void> {
    for (const action of actions.filter(a => a.enabled)) {
      try {
        await this.executeAlertAction(alert, action);
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  private async executeAlertAction(
    alert: Alert,
    action: AlertAction
  ): Promise<void> {
    const notification: AlertNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: alert.id,
      action,
      status: 'pending',
      attempts: 0,
    };

    try {
      switch (action.type) {
        case 'email':
          await this.sendEmailNotification(alert, action);
          break;
        case 'sms':
          await this.sendSMSNotification(alert, action);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, action);
          break;
        case 'dashboard':
          // Dashboard notifications are handled by the UI polling for active alerts
          break;
        case 'slack':
          await this.sendSlackNotification(alert, action);
          break;
        case 'teams':
          await this.sendTeamsNotification(alert, action);
          break;
      }

      notification.status = 'sent';
    } catch (error) {
      notification.status = 'failed';
      notification.error =
        error instanceof Error ? error.message : 'Unknown error';
    } finally {
      notification.attempts++;
      notification.lastAttempt = new Date().toISOString();

      // Store notification
      const notifications = this.notifications.get(alert.agencyId) || [];
      notifications.push(notification);
      this.notifications.set(alert.agencyId, notifications);
    }
  }

  private async sendEmailNotification(
    alert: Alert,
    action: AlertAction
  ): Promise<void> {
    // Mock email implementation
    console.log(`Sending email notification for alert ${alert.id}`, {
      recipients: action.config.recipients,
      subject: action.config.subject || `Alert: ${alert.title}`,
      message: this.formatAlertMessage(alert, action.config.template),
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSMSNotification(
    alert: Alert,
    action: AlertAction
  ): Promise<void> {
    // Mock SMS implementation
    console.log(`Sending SMS notification for alert ${alert.id}`, {
      recipients: action.config.recipients,
      message: this.formatAlertMessage(alert, action.config.template, true),
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWebhookNotification(
    alert: Alert,
    action: AlertAction
  ): Promise<void> {
    // Mock webhook implementation
    console.log(`Sending webhook notification for alert ${alert.id}`, {
      url: action.config.url,
      payload: {
        alert,
        timestamp: new Date().toISOString(),
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSlackNotification(
    alert: Alert,
    action: AlertAction
  ): Promise<void> {
    // Mock Slack implementation
    console.log(`Sending Slack notification for alert ${alert.id}`, {
      channel: action.config.channel,
      message: this.formatAlertMessage(alert, action.config.template),
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendTeamsNotification(
    alert: Alert,
    action: AlertAction
  ): Promise<void> {
    // Mock Teams implementation
    console.log(`Sending Teams notification for alert ${alert.id}`, {
      channel: action.config.channel,
      message: this.formatAlertMessage(alert, action.config.template),
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private formatAlertMessage(
    alert: Alert,
    template?: string,
    short = false
  ): string {
    if (template) {
      return template
        .replace('{{title}}', alert.title)
        .replace('{{description}}', alert.description)
        .replace('{{currentValue}}', alert.currentValue.toString())
        .replace('{{thresholdValue}}', alert.thresholdValue.toString())
        .replace('{{timestamp}}', alert.timestamp);
    }

    if (short) {
      return `Alert: ${alert.title} - ${alert.currentValue}${alert.unit} (threshold: ${alert.thresholdValue}${alert.unit})`;
    }

    return `
Alert: ${alert.title}
Description: ${alert.description}
Current Value: ${alert.currentValue}${alert.unit}
Threshold: ${alert.thresholdValue}${alert.unit}
Priority: ${alert.priority.toUpperCase()}
Time: ${new Date(alert.timestamp).toLocaleString()}
    `.trim();
  }

  private generateAlertTrend(
    alerts: Alert[],
    timeRange: { startDate: string; endDate: string }
  ): Array<{ date: string; count: number }> {
    const trend: Array<{ date: string; count: number }> = [];
    const start = new Date(timeRange.startDate);
    const end = new Date(timeRange.endDate);

    // Generate daily counts
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const count = alerts.filter(alert =>
        alert.timestamp.startsWith(dateStr)
      ).length;

      trend.push({ date: dateStr, count });
      current.setDate(current.getDate() + 1);
    }

    return trend;
  }

  /**
   * Cleanup method to stop all monitoring
   */
  cleanup(): void {
    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals.clear();
  }
}

// Export singleton instance
export const alertSystemService = new AlertSystemService();
export default alertSystemService;
