/**
 * DeliveryTrackingService - Comprehensive delivery monitoring and analytics
 * Part of Review & Send system (Step 4) - V2 Workflow
 */

import {
  DeliveryConfiguration,
  DeliveryRecipient,
  DeliveryStatus,
  QualityTrend,
  ReviewMetrics,
} from '@/types/review';

export interface DeliveryAnalytics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number; // minutes
  deliverySuccessRate: number; // percentage
  mostCommonFailures: string[];
  deliveryMethodBreakdown: Record<string, number>;
  satisfactionScore: number; // 0-100
}

export interface RequesterSatisfactionSurvey {
  id: string;
  requestId: string;
  recipientId: string;
  deliveryId: string;
  responses: SurveyResponse[];
  overallRating: number; // 1-5 stars
  comments: string;
  submittedAt: Date;
  followUpRequired: boolean;
}

export interface SurveyResponse {
  questionId: string;
  question: string;
  type: 'rating' | 'text' | 'boolean' | 'multiple_choice';
  response: any;
}

export interface DeliveryNotification {
  id: string;
  deliveryId: string;
  type: 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';
  timestamp: Date;
  details: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  requestId: string;
  generatedAt: Date;
  timelinessCompliance: {
    dueDate: Date;
    deliveredDate: Date;
    isCompliant: boolean;
    daysEarly: number;
    daysLate: number;
  };
  deliveryCompliance: {
    methodUsed: string;
    recipientVerified: boolean;
    signatureRequired: boolean;
    signatureObtained: boolean;
    trackingEnabled: boolean;
  };
  contentCompliance: {
    redactionsApplied: number;
    exemptionsUsed: string[];
    legalReviewCompleted: boolean;
    qualityScore: number;
  };
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  actor: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class DeliveryTrackingService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string = '/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || '';
  }

  /**
   * Create a new delivery tracking record
   */
  async createDeliveryTracking(
    requestId: string,
    config: DeliveryConfiguration
  ): Promise<DeliveryStatus[]> {
    try {
      const deliveries: DeliveryStatus[] = [];

      for (const recipient of config.recipients) {
        const delivery: DeliveryStatus = {
          id: `delivery-${Date.now()}-${recipient.id}`,
          requestId,
          recipientId: recipient.id,
          status:
            config.scheduledDate && config.scheduledDate > new Date()
              ? 'scheduled'
              : 'sent',
          sentAt: config.scheduledDate || new Date(),
          attempts: 0,
          lastAttemptAt: new Date(),
        };

        deliveries.push(delivery);
      }

      const response = await fetch(`${this.baseUrl}/delivery/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({ deliveries }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create delivery tracking: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating delivery tracking:', error);
      throw error;
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus['status'],
    details?: Record<string, any>
  ): Promise<DeliveryStatus> {
    try {
      const updateData = {
        status,
        [`${status}At`]: new Date(),
        ...(details && { details }),
      };

      // Handle specific status updates
      switch (status) {
        case 'delivered':
          updateData.deliveredAt = new Date();
          break;
        case 'read':
          updateData.readAt = new Date();
          break;
        case 'failed':
        case 'bounced':
          updateData.failureReason = details?.reason || 'Unknown error';
          updateData.attempts = (details?.attempts || 0) + 1;
          break;
      }

      const response = await fetch(
        `${this.baseUrl}/delivery/tracking/${deliveryId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update delivery status: ${response.statusText}`
        );
      }

      const updatedDelivery = await response.json();

      // Create notification
      await this.createDeliveryNotification(deliveryId, status, details);

      // Send real-time updates if configured
      await this.sendRealtimeUpdate(updatedDelivery);

      return updatedDelivery;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  /**
   * Get delivery status for a request
   */
  async getDeliveryStatus(requestId: string): Promise<DeliveryStatus[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/delivery/tracking/request/${requestId}`,
        {
          headers: {
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get delivery status: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting delivery status:', error);
      throw error;
    }
  }

  /**
   * Track email delivery via webhook
   */
  async handleEmailWebhook(webhookData: any): Promise<void> {
    try {
      const { deliveryId, event, timestamp, details } = webhookData;

      let status: DeliveryStatus['status'];
      switch (event) {
        case 'delivered':
          status = 'delivered';
          break;
        case 'opened':
          status = 'read';
          break;
        case 'bounced':
          status = 'bounced';
          break;
        case 'failed':
          status = 'failed';
          break;
        default:
          return; // Ignore unknown events
      }

      await this.updateDeliveryStatus(deliveryId, status, {
        ...details,
        webhookTimestamp: timestamp,
      });
    } catch (error) {
      console.error('Error handling email webhook:', error);
      throw error;
    }
  }

  /**
   * Generate delivery analytics
   */
  async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    agencyId?: string
  ): Promise<DeliveryAnalytics> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(agencyId && { agencyId }),
      });

      const response = await fetch(
        `${this.baseUrl}/delivery/analytics?${params}`,
        {
          headers: {
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get delivery analytics: ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        totalDeliveries: data.totalDeliveries || 0,
        successfulDeliveries: data.successfulDeliveries || 0,
        failedDeliveries: data.failedDeliveries || 0,
        averageDeliveryTime: data.averageDeliveryTime || 0,
        deliverySuccessRate:
          data.totalDeliveries > 0
            ? Math.round(
                (data.successfulDeliveries / data.totalDeliveries) * 100
              )
            : 0,
        mostCommonFailures: data.mostCommonFailures || [],
        deliveryMethodBreakdown: data.deliveryMethodBreakdown || {},
        satisfactionScore: data.satisfactionScore || 0,
      };
    } catch (error) {
      console.error('Error getting delivery analytics:', error);
      throw error;
    }
  }

  /**
   * Create requester satisfaction survey
   */
  async createSatisfactionSurvey(
    requestId: string,
    recipientId: string,
    deliveryId: string
  ): Promise<RequesterSatisfactionSurvey> {
    try {
      const surveyQuestions = [
        {
          questionId: 'delivery_time',
          question: 'How satisfied are you with the delivery time?',
          type: 'rating' as const,
        },
        {
          questionId: 'response_quality',
          question: 'How would you rate the quality of the response?',
          type: 'rating' as const,
        },
        {
          questionId: 'completeness',
          question: 'Did the response fully address your request?',
          type: 'boolean' as const,
        },
        {
          questionId: 'format_preference',
          question: 'Was the delivery format convenient for you?',
          type: 'rating' as const,
        },
        {
          questionId: 'overall_experience',
          question: 'How would you rate your overall experience?',
          type: 'rating' as const,
        },
        {
          questionId: 'additional_comments',
          question: 'Any additional comments or suggestions?',
          type: 'text' as const,
        },
      ];

      const survey: RequesterSatisfactionSurvey = {
        id: `survey-${Date.now()}`,
        requestId,
        recipientId,
        deliveryId,
        responses: surveyQuestions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          type: q.type,
          response: null,
        })),
        overallRating: 0,
        comments: '',
        submittedAt: new Date(),
        followUpRequired: false,
      };

      const response = await fetch(
        `${this.baseUrl}/delivery/satisfaction-survey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify(survey),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create satisfaction survey: ${response.statusText}`
        );
      }

      // Send survey link to requester
      await this.sendSurveyInvitation(survey);

      return await response.json();
    } catch (error) {
      console.error('Error creating satisfaction survey:', error);
      throw error;
    }
  }

  /**
   * Process satisfaction survey response
   */
  async processSurveyResponse(
    surveyId: string,
    responses: SurveyResponse[],
    overallRating: number,
    comments?: string
  ): Promise<RequesterSatisfactionSurvey> {
    try {
      const updateData = {
        responses,
        overallRating,
        comments: comments || '',
        submittedAt: new Date(),
        followUpRequired:
          overallRating <= 2 || responses.some(r => r.response === false),
      };

      const response = await fetch(
        `${this.baseUrl}/delivery/satisfaction-survey/${surveyId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to process survey response: ${response.statusText}`
        );
      }

      const updatedSurvey = await response.json();

      // Trigger follow-up actions if needed
      if (updatedSurvey.followUpRequired) {
        await this.triggerFollowUpActions(updatedSurvey);
      }

      return updatedSurvey;
    } catch (error) {
      console.error('Error processing survey response:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(requestId: string): Promise<ComplianceReport> {
    try {
      const response = await fetch(
        `${this.baseUrl}/delivery/compliance-report/${requestId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate compliance report: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive audit trail
   */
  async getAuditTrail(
    requestId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditEntry[]> {
    try {
      const params = new URLSearchParams({ requestId });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(
        `${this.baseUrl}/delivery/audit-trail?${params}`,
        {
          headers: {
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get audit trail: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting audit trail:', error);
      throw error;
    }
  }

  /**
   * Schedule delivery retry
   */
  async scheduleDeliveryRetry(
    deliveryId: string,
    retryDate: Date,
    maxRetries: number = 3
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/delivery/retry/${deliveryId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify({
            retryDate: retryDate.toISOString(),
            maxRetries,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to schedule delivery retry: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Error scheduling delivery retry:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics dashboard data
   */
  async getPerformanceMetrics(agencyId?: string): Promise<ReviewMetrics> {
    try {
      const params = new URLSearchParams();
      if (agencyId) params.append('agencyId', agencyId);

      const response = await fetch(
        `${this.baseUrl}/delivery/performance-metrics?${params}`,
        {
          headers: {
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get performance metrics: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async createDeliveryNotification(
    deliveryId: string,
    type: DeliveryNotification['type'],
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const notification: DeliveryNotification = {
        id: `notification-${Date.now()}`,
        deliveryId,
        type,
        timestamp: new Date(),
        details: details || {},
      };

      await fetch(`${this.baseUrl}/delivery/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(notification),
      });
    } catch (error) {
      console.error('Error creating delivery notification:', error);
      // Don't throw - notifications are not critical
    }
  }

  private async sendRealtimeUpdate(delivery: DeliveryStatus): Promise<void> {
    try {
      // Send via WebSocket or Server-Sent Events
      if (typeof window !== 'undefined' && (window as any).deliverySocket) {
        (window as any).deliverySocket.emit('delivery-update', delivery);
      }
    } catch (error) {
      console.error('Error sending realtime update:', error);
      // Don't throw - realtime updates are not critical
    }
  }

  private async sendSurveyInvitation(
    survey: RequesterSatisfactionSurvey
  ): Promise<void> {
    try {
      const surveyUrl = `${window.location.origin}/survey/${survey.id}`;

      await fetch(`${this.baseUrl}/delivery/send-survey-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          surveyId: survey.id,
          recipientId: survey.recipientId,
          surveyUrl,
        }),
      });
    } catch (error) {
      console.error('Error sending survey invitation:', error);
      // Don't throw - survey invitations are not critical
    }
  }

  private async triggerFollowUpActions(
    survey: RequesterSatisfactionSurvey
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/delivery/follow-up-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          surveyId: survey.id,
          requestId: survey.requestId,
          issues: survey.responses.filter(
            r =>
              r.type === 'rating' &&
              typeof r.response === 'number' &&
              r.response <= 2
          ),
        }),
      });
    } catch (error) {
      console.error('Error triggering follow-up actions:', error);
      // Don't throw - follow-up actions are not critical
    }
  }
}

// Export singleton instance
export const deliveryTrackingService = new DeliveryTrackingService();
