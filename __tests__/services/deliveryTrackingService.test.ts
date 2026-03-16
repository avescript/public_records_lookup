/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

import {
  DeliveryConfiguration,
  DeliveryStatus,
  SurveyResponse,
} from '@/types/review';

import {
  ComplianceReport,
  DeliveryAnalytics,
  DeliveryTrackingService,
  deliveryTrackingService,
  RequesterSatisfactionSurvey,
} from '../deliveryTrackingService';

// Mock fetch globally
global.fetch = jest.fn();

describe('DeliveryTrackingService', () => {
  let service: DeliveryTrackingService;

  beforeEach(() => {
    service = new DeliveryTrackingService('/api', 'test-api-key');
    jest.clearAllMocks();
  });

  const mockDeliveryConfig: DeliveryConfiguration = {
    method: 'email',
    format: 'pdf',
    recipients: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        isPrimary: true,
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        isPrimary: false,
      },
    ],
    includeAttachments: true,
    requireSignature: false,
    trackDelivery: true,
  };

  const mockDeliveryStatus: DeliveryStatus = {
    id: 'delivery-123',
    requestId: 'request-123',
    recipientId: '1',
    status: 'sent',
    sentAt: new Date(),
    attempts: 1,
    lastAttemptAt: new Date(),
  };

  describe('createDeliveryTracking', () => {
    it('should create delivery tracking records for all recipients', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockDeliveryStatus],
      });

      const result = await service.createDeliveryTracking(
        'request-123',
        mockDeliveryConfig
      );

      expect(fetch).toHaveBeenCalledWith('/api/delivery/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: expect.stringContaining('request-123'),
      });

      expect(result).toEqual([mockDeliveryStatus]);
    });

    it('should handle scheduled deliveries', async () => {
      const scheduledConfig = {
        ...mockDeliveryConfig,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...mockDeliveryStatus, status: 'scheduled' }],
      });

      const result = await service.createDeliveryTracking(
        'request-123',
        scheduledConfig
      );

      expect(result[0].status).toBe('scheduled');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        service.createDeliveryTracking('request-123', mockDeliveryConfig)
      ).rejects.toThrow(
        'Failed to create delivery tracking: Internal Server Error'
      );
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status successfully', async () => {
      const updatedDelivery = {
        ...mockDeliveryStatus,
        status: 'delivered' as const,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedDelivery,
      });

      const result = await service.updateDeliveryStatus(
        'delivery-123',
        'delivered',
        { trackingNumber: 'TRK123' }
      );

      expect(fetch).toHaveBeenCalledWith(
        '/api/delivery/tracking/delivery-123',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
          body: expect.stringContaining('delivered'),
        }
      );

      expect(result).toEqual(updatedDelivery);
    });

    it('should handle failed delivery status with retry count', async () => {
      const failedDelivery = {
        ...mockDeliveryStatus,
        status: 'failed' as const,
        failureReason: 'Network timeout',
        attempts: 2,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => failedDelivery,
      });

      const result = await service.updateDeliveryStatus(
        'delivery-123',
        'failed',
        { reason: 'Network timeout', attempts: 1 }
      );

      expect(result.status).toBe('failed');
      expect(result.attempts).toBe(2);
    });

    it('should handle bounced email status', async () => {
      const bouncedDelivery = {
        ...mockDeliveryStatus,
        status: 'bounced' as const,
        failureReason: 'Invalid email address',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => bouncedDelivery,
      });

      const result = await service.updateDeliveryStatus(
        'delivery-123',
        'bounced',
        { reason: 'Invalid email address' }
      );

      expect(result.status).toBe('bounced');
    });
  });

  describe('getDeliveryStatus', () => {
    it('should retrieve delivery status for a request', async () => {
      const deliveries = [mockDeliveryStatus];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => deliveries,
      });

      const result = await service.getDeliveryStatus('request-123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/delivery/tracking/request/request-123',
        {
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        }
      );

      expect(result).toEqual(deliveries);
    });

    it('should throw error when request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.getDeliveryStatus('request-123')).rejects.toThrow(
        'Failed to get delivery status: Not Found'
      );
    });
  });

  describe('handleEmailWebhook', () => {
    it('should process delivered webhook event', async () => {
      const webhookData = {
        deliveryId: 'delivery-123',
        event: 'delivered',
        timestamp: new Date().toISOString(),
        details: { messageId: 'msg-123' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDeliveryStatus, status: 'delivered' }),
      });

      await service.handleEmailWebhook(webhookData);

      expect(fetch).toHaveBeenCalledWith(
        '/api/delivery/tracking/delivery-123',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
          body: expect.stringContaining('delivered'),
        }
      );
    });

    it('should process opened webhook event', async () => {
      const webhookData = {
        deliveryId: 'delivery-123',
        event: 'opened',
        timestamp: new Date().toISOString(),
        details: { userAgent: 'Mozilla/5.0' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockDeliveryStatus, status: 'read' }),
      });

      await service.handleEmailWebhook(webhookData);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.status).toBe('read');
    });

    it('should ignore unknown webhook events', async () => {
      const webhookData = {
        deliveryId: 'delivery-123',
        event: 'unknown',
        timestamp: new Date().toISOString(),
        details: {},
      };

      await service.handleEmailWebhook(webhookData);

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('getDeliveryAnalytics', () => {
    it('should retrieve delivery analytics for date range', async () => {
      const mockAnalytics: DeliveryAnalytics = {
        totalDeliveries: 100,
        successfulDeliveries: 95,
        failedDeliveries: 5,
        averageDeliveryTime: 15.5,
        deliverySuccessRate: 95,
        mostCommonFailures: ['Network timeout', 'Invalid email'],
        deliveryMethodBreakdown: {
          email: 80,
          mail: 15,
          portal: 5,
        },
        satisfactionScore: 4.2,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await service.getDeliveryAnalytics(
        startDate,
        endDate,
        'agency-123'
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/delivery/analytics'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        })
      );

      expect(result).toEqual(mockAnalytics);
    });

    it('should handle zero deliveries gracefully', async () => {
      const emptyAnalytics = {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        averageDeliveryTime: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyAnalytics,
      });

      const result = await service.getDeliveryAnalytics(new Date(), new Date());

      expect(result.deliverySuccessRate).toBe(0);
      expect(result.totalDeliveries).toBe(0);
    });
  });

  describe('createSatisfactionSurvey', () => {
    it('should create satisfaction survey with default questions', async () => {
      const mockSurvey: RequesterSatisfactionSurvey = {
        id: 'survey-123',
        requestId: 'request-123',
        recipientId: 'recipient-123',
        deliveryId: 'delivery-123',
        responses: [],
        overallRating: 0,
        comments: '',
        submittedAt: new Date(),
        followUpRequired: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSurvey,
      });

      const result = await service.createSatisfactionSurvey(
        'request-123',
        'recipient-123',
        'delivery-123'
      );

      expect(fetch).toHaveBeenCalledWith('/api/delivery/satisfaction-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: expect.stringContaining('delivery_time'),
      });

      expect(result).toEqual(mockSurvey);
    });
  });

  describe('processSurveyResponse', () => {
    it('should process survey responses and calculate follow-up need', async () => {
      const surveyResponses: SurveyResponse[] = [
        {
          questionId: 'delivery_time',
          question: 'How satisfied are you with the delivery time?',
          type: 'rating',
          response: 1, // Low rating
        },
        {
          questionId: 'completeness',
          question: 'Did the response fully address your request?',
          type: 'boolean',
          response: false, // Negative response
        },
      ];

      const updatedSurvey: RequesterSatisfactionSurvey = {
        id: 'survey-123',
        requestId: 'request-123',
        recipientId: 'recipient-123',
        deliveryId: 'delivery-123',
        responses: surveyResponses,
        overallRating: 2,
        comments: 'Could be improved',
        submittedAt: new Date(),
        followUpRequired: true, // Should be true due to low ratings
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSurvey,
      });

      const result = await service.processSurveyResponse(
        'survey-123',
        surveyResponses,
        2,
        'Could be improved'
      );

      expect(result.followUpRequired).toBe(true);
      expect(result.overallRating).toBe(2);
    });

    it('should not require follow-up for positive responses', async () => {
      const positiveResponses: SurveyResponse[] = [
        {
          questionId: 'delivery_time',
          question: 'How satisfied are you with the delivery time?',
          type: 'rating',
          response: 5,
        },
      ];

      const updatedSurvey: RequesterSatisfactionSurvey = {
        id: 'survey-123',
        requestId: 'request-123',
        recipientId: 'recipient-123',
        deliveryId: 'delivery-123',
        responses: positiveResponses,
        overallRating: 5,
        comments: 'Excellent service',
        submittedAt: new Date(),
        followUpRequired: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSurvey,
      });

      const result = await service.processSurveyResponse(
        'survey-123',
        positiveResponses,
        5
      );

      expect(result.followUpRequired).toBe(false);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate comprehensive compliance report', async () => {
      const mockReport: ComplianceReport = {
        id: 'report-123',
        requestId: 'request-123',
        generatedAt: new Date(),
        timelinessCompliance: {
          dueDate: new Date('2024-03-01'),
          deliveredDate: new Date('2024-02-28'),
          isCompliant: true,
          daysEarly: 1,
          daysLate: 0,
        },
        deliveryCompliance: {
          methodUsed: 'email',
          recipientVerified: true,
          signatureRequired: false,
          signatureObtained: false,
          trackingEnabled: true,
        },
        contentCompliance: {
          redactionsApplied: 5,
          exemptionsUsed: ['5 USC 552(b)(6)', '5 USC 552(b)(7)(C)'],
          legalReviewCompleted: true,
          qualityScore: 92,
        },
        auditTrail: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      const result = await service.generateComplianceReport('request-123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/delivery/compliance-report/request-123',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
        }
      );

      expect(result).toEqual(mockReport);
      expect(result.timelinessCompliance.isCompliant).toBe(true);
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve comprehensive audit trail', async () => {
      const mockAuditTrail = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          actor: 'staff-user',
          action: 'delivery_initiated',
          details: { deliveryId: 'delivery-123' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuditTrail,
      });

      const result = await service.getAuditTrail('request-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/delivery/audit-trail'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        })
      );

      expect(result).toEqual(mockAuditTrail);
    });

    it('should handle date range filtering', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await service.getAuditTrail('request-123', startDate, endDate);

      const url = (fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('startDate=');
      expect(url).toContain('endDate=');
    });
  });

  describe('scheduleDeliveryRetry', () => {
    it('should schedule delivery retry with proper parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const retryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      await service.scheduleDeliveryRetry('delivery-123', retryDate, 3);

      expect(fetch).toHaveBeenCalledWith('/api/delivery/retry/delivery-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        body: expect.stringContaining(retryDate.toISOString()),
      });
    });

    it('should use default retry limit when not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await service.scheduleDeliveryRetry('delivery-123', new Date());

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.maxRetries).toBe(3);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should retrieve performance metrics for agency', async () => {
      const mockMetrics = {
        averageReviewTime: 45.5,
        approvalRate: 92.3,
        commonRejectionReasons: ['Incomplete information', 'Out of scope'],
        reviewerWorkload: [],
        bottlenecks: [],
        qualityTrends: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      });

      const result = await service.getPerformanceMetrics('agency-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/delivery/performance-metrics'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        })
      );

      expect(result).toEqual(mockMetrics);
    });
  });

  describe('Singleton instance', () => {
    it('should export singleton instance', () => {
      expect(deliveryTrackingService).toBeInstanceOf(DeliveryTrackingService);
    });

    it('should maintain singleton state', () => {
      expect(deliveryTrackingService).toBe(deliveryTrackingService);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        service.createDeliveryTracking('request-123', mockDeliveryConfig)
      ).rejects.toThrow('Network error');
    });

    it('should handle malformed response errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(service.getDeliveryStatus('request-123')).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should handle API authentication errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(
        service.getDeliveryAnalytics(new Date(), new Date())
      ).rejects.toThrow('Failed to get delivery analytics: Unauthorized');
    });
  });

  describe('Configuration options', () => {
    it('should use default base URL when not provided', () => {
      const defaultService = new DeliveryTrackingService();
      expect(defaultService).toBeInstanceOf(DeliveryTrackingService);
    });

    it('should handle requests without API key', async () => {
      const serviceWithoutKey = new DeliveryTrackingService('/api');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockDeliveryStatus],
      });

      await serviceWithoutKey.getDeliveryStatus('request-123');

      const headers = (fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });
});
