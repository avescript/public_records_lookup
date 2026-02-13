/**
 * @jest-environment jsdom
 */
import {
  PublicRecordRequest,
  RequestStatus,
  WorkflowStep,
} from '@/types/request';
import {
  DeliveryConfiguration,
  ReviewWorkflowIntegration,
  WorkflowContext,
  WorkflowValidation,
} from '@/types/review';

import { aiResponseService } from '../aiResponseService';
import { deliveryTrackingService } from '../deliveryTrackingService';
import {
  V2WorkflowOrchestrator,
  v2WorkflowOrchestrator,
} from '../v2WorkflowOrchestrator';

// Mock dependencies
jest.mock('../deliveryTrackingService');
jest.mock('../aiResponseService');

const mockDeliveryTrackingService = deliveryTrackingService as jest.Mocked<
  typeof deliveryTrackingService
>;
const mockAiResponseService = aiResponseService as jest.Mocked<
  typeof aiResponseService
>;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('V2WorkflowOrchestrator', () => {
  let orchestrator: V2WorkflowOrchestrator;

  const mockRequest: PublicRecordRequest = {
    id: 'req-123',
    agencyId: 'agency-1',
    requesterId: 'user-1',
    submittedDate: new Date('2024-01-15'),
    description: 'Test request',
    keywords: ['test', 'records'],
    category: 'general',
    status: 'submitted' as RequestStatus,
    priority: 'normal',
    estimatedCompletionDate: new Date('2024-01-20'),
  };

  const mockWorkflowContext: WorkflowContext = {
    requestId: 'req-123',
    currentStep: 'locate' as WorkflowStep,
    completedSteps: [],
    stepResults: {} as any,
    metadata: {
      startedAt: new Date('2024-01-15T10:00:00Z'),
      assignedTo: 'staff-1',
      priority: 'normal',
      agencyId: 'agency-1',
      automationLevel: 'assisted',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new V2WorkflowOrchestrator('/api', 'test-key');

    // Default successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
      statusText: 'OK',
    });
  });

  describe('initializeWorkflow', () => {
    it('should initialize a new workflow successfully', async () => {
      const expectedContext = { ...mockWorkflowContext };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(expectedContext),
        statusText: 'OK',
      });

      const result = await orchestrator.initializeWorkflow(
        mockRequest,
        'staff-1',
        'assisted'
      );

      expect(mockFetch).toHaveBeenCalledWith('/api/workflow/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        body: expect.stringContaining('"requestId":"req-123"'),
      });

      // Verify notification sent
      expect(mockFetch).toHaveBeenCalledWith('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        body: expect.stringContaining('"title":"Workflow Initialized"'),
      });
    });

    it('should handle initialization errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        orchestrator.initializeWorkflow(mockRequest, 'staff-1')
      ).rejects.toThrow('Failed to initialize workflow: Internal Server Error');
    });

    it('should calculate estimated completion correctly', async () => {
      const complexRequest = {
        ...mockRequest,
        keywords: ['word1', 'word2', 'word3', 'word4', 'word5', 'word6'],
        priority: 'urgent',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkflowContext),
      });

      await orchestrator.initializeWorkflow(complexRequest, 'staff-1');

      const initCall = mockFetch.mock.calls[0];
      const bodyData = JSON.parse(initCall[1]?.body as string);
      expect(bodyData.metadata.estimatedCompletion).toBeDefined();
    });
  });

  describe('advanceWorkflow', () => {
    beforeEach(() => {
      // Mock getWorkflowContext
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkflowContext),
      });
    });

    it('should advance workflow to next step successfully', async () => {
      const stepData = { selectedRecords: ['record1', 'record2'] };

      // Mock context update response
      const updatedContext = {
        ...mockWorkflowContext,
        currentStep: 'redact' as WorkflowStep,
        completedSteps: ['locate'] as WorkflowStep[],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockWorkflowContext),
        })
        .mockResolvedValueOnce({ ok: true }) // transition record
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(updatedContext),
        })
        .mockResolvedValueOnce({ ok: true }); // notification

      const result = await orchestrator.advanceWorkflow(
        'req-123',
        stepData,
        'staff-1'
      );

      expect(result.currentStep).toBe('redact');
      expect(result.completedSteps).toContain('locate');
    });

    it('should prevent advancement when validation fails', async () => {
      const invalidStepData = {}; // Missing required data

      await expect(
        orchestrator.advanceWorkflow('req-123', invalidStepData, 'staff-1')
      ).rejects.toThrow('Cannot proceed');
    });

    it('should complete workflow when on final step', async () => {
      const finalStepContext = {
        ...mockWorkflowContext,
        currentStep: 'review' as WorkflowStep,
        completedSteps: ['locate', 'redact', 'respond'] as WorkflowStep[],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(finalStepContext),
        })
        .mockResolvedValueOnce({ ok: true }) // transition record
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            ...finalStepContext,
            metadata: {
              ...finalStepContext.metadata,
              completedAt: new Date(),
            },
          }),
        })
        .mockResolvedValueOnce({ ok: true }); // completion notification

      const stepData = {
        approved: true,
        deliveryConfiguration: {
          method: 'email',
          format: 'pdf',
          recipients: [
            {
              id: '1',
              name: 'Test',
              email: 'test@example.com',
              isPrimary: true,
            },
          ],
        },
      };

      const result = await orchestrator.advanceWorkflow(
        'req-123',
        stepData,
        'staff-1'
      );

      expect(result.metadata.completedAt).toBeDefined();
    });

    it('should handle automated step execution', async () => {
      const automatedContext = {
        ...mockWorkflowContext,
        metadata: {
          ...mockWorkflowContext.metadata,
          automationLevel: 'automated' as const,
        },
      };

      // Mock automated locate step execution
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(automatedContext),
        })
        .mockResolvedValueOnce({ ok: true }) // transition record
        .mockResolvedValueOnce({
          ok: true,
          json: jest
            .fn()
            .mockResolvedValue({ selectedRecords: ['auto-record'] }),
        }) // automated locate execution
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            ...automatedContext,
            currentStep: 'redact',
          }),
        });

      const stepData = { selectedRecords: ['record1'] };
      await orchestrator.advanceWorkflow('req-123', stepData, 'staff-1');
    });
  });

  describe('executeCompleteWorkflow', () => {
    it('should execute complete end-to-end workflow', async () => {
      // Mock all API calls for complete workflow
      mockFetch
        // Initialize
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockWorkflowContext),
        })
        .mockResolvedValueOnce({ ok: true }) // init notification
        // Locate step
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ selectedRecords: ['record1'] }),
        })
        // ... additional mocks for each step ...
        .mockResolvedValue({ ok: true });

      mockAiResponseService.generateResponse.mockResolvedValue({
        id: 'resp-1',
        content: 'Generated response',
        qualityScore: 95,
        complianceScore: 98,
        timestamp: new Date(),
        requestId: 'req-123',
        generatedBy: 'ai-service',
      });

      mockDeliveryTrackingService.createDeliveryTracking.mockResolvedValue([
        {
          id: 'delivery-1',
          requestId: 'req-123',
          method: 'email',
          status: 'pending',
          createdAt: new Date(),
        },
      ]);

      const result = await orchestrator.executeCompleteWorkflow(
        mockRequest,
        'staff-1',
        { automationLevel: 'automated' }
      );

      expect(result.context).toBeDefined();
      expect(result.deliveryStatus).toBeDefined();
      expect(result.completionTime).toBeGreaterThan(0);
      expect(
        mockDeliveryTrackingService.createDeliveryTracking
      ).toHaveBeenCalled();
    });

    it('should skip specified steps', async () => {
      // Mock initialize and notifications
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockWorkflowContext),
        })
        .mockResolvedValue({ ok: true });

      await orchestrator.executeCompleteWorkflow(mockRequest, 'staff-1', {
        skipSteps: ['locate', 'redact'],
      });

      // Should not call locate or redact steps
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/ai/locate-records',
        expect.any(Object)
      );
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/ai/redact-records',
        expect.any(Object)
      );
    });

    it('should use custom data for steps', async () => {
      const customData = {
        locate: { selectedRecords: ['custom-record'] },
        redact: { redactions: [] },
        respond: { response: { id: 'custom-resp' } },
        review: { approved: true },
      };

      mockFetch.mockResolvedValue({ ok: true });

      await orchestrator.executeCompleteWorkflow(mockRequest, 'staff-1', {
        customData,
      });

      // Should not call AI services when custom data provided
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/ai/locate-records',
        expect.any(Object)
      );
    });

    it('should handle workflow failures gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockWorkflowContext),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        orchestrator.executeCompleteWorkflow(mockRequest, 'staff-1')
      ).rejects.toThrow('Network error');

      // Should record failure
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/workflow/req-123/failure',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Network error'),
        })
      );
    });
  });

  describe('validateStepCompletion', () => {
    it('should validate locate step correctly', async () => {
      const validData = { selectedRecords: ['record1', 'record2'] };
      const validation = await orchestrator.validateStepCompletion(
        mockWorkflowContext,
        validData
      );

      expect(validation.isValid).toBe(true);
      expect(validation.canProceedToNext).toBe(true);
      expect(validation.missingData).toHaveLength(0);
    });

    it('should reject locate step with no records', async () => {
      const invalidData = { selectedRecords: [] };
      const validation = await orchestrator.validateStepCompletion(
        mockWorkflowContext,
        invalidData
      );

      expect(validation.isValid).toBe(false);
      expect(validation.canProceedToNext).toBe(false);
      expect(validation.missingData).toContain('No records selected');
    });

    it('should validate redact step with warnings for no redactions', async () => {
      const redactContext = {
        ...mockWorkflowContext,
        currentStep: 'redact' as WorkflowStep,
      };
      const noRedactionData = {};

      const validation = await orchestrator.validateStepCompletion(
        redactContext,
        noRedactionData
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain(
        'No redactions applied - verify if this is intentional'
      );
    });

    it('should validate respond step quality scores', async () => {
      const respondContext = {
        ...mockWorkflowContext,
        currentStep: 'respond' as WorkflowStep,
      };
      const lowQualityResponse = {
        response: {
          id: 'resp-1',
          qualityScore: 75,
          complianceScore: 80,
        },
      };

      const validation = await orchestrator.validateStepCompletion(
        respondContext,
        lowQualityResponse
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain(
        'Quality score below recommended threshold'
      );
      expect(validation.warnings).toContain(
        'Compliance score below required threshold'
      );
    });

    it('should validate review step approval requirements', async () => {
      const reviewContext = {
        ...mockWorkflowContext,
        currentStep: 'review' as WorkflowStep,
      };
      const incompleteReview = { approved: true }; // Missing delivery config

      const validation = await orchestrator.validateStepCompletion(
        reviewContext,
        incompleteReview
      );

      expect(validation.isValid).toBe(false);
      expect(validation.canProceedToNext).toBe(false);
      expect(validation.missingData).toContain(
        'Delivery configuration required for approved requests'
      );
    });
  });

  describe('generateReviewIntegration', () => {
    it('should generate review integration data', async () => {
      const completeContext = {
        ...mockWorkflowContext,
        completedSteps: ['locate', 'redact', 'respond'] as WorkflowStep[],
        stepResults: {
          locate: {
            stepName: 'locate' as WorkflowStep,
            completed: true,
            timestamp: new Date(),
            data: { selectedRecords: ['record1'] },
            errors: [],
            warnings: [],
          },
          redact: {
            stepName: 'redact' as WorkflowStep,
            completed: true,
            timestamp: new Date(),
            data: { redactions: [] },
            errors: [],
            warnings: [],
          },
          respond: {
            stepName: 'respond' as WorkflowStep,
            completed: true,
            timestamp: new Date(),
            data: { response: { id: 'resp-1' } },
            errors: [],
            warnings: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(completeContext),
      });

      const integration =
        await orchestrator.generateReviewIntegration('req-123');

      expect(integration.requestId).toBe('req-123');
      expect(integration.currentStep).toBe('review');
      expect(integration.previousSteps.locate.completed).toBe(true);
      expect(integration.previousSteps.redact.completed).toBe(true);
      expect(integration.previousSteps.respond.completed).toBe(true);
      expect(integration.readyForReview).toBe(true);
      expect(integration.stepData.selectedRecords).toEqual(['record1']);
    });

    it('should indicate not ready for review when steps incomplete', async () => {
      const incompleteContext = {
        ...mockWorkflowContext,
        completedSteps: ['locate'] as WorkflowStep[],
        stepResults: {
          locate: {
            stepName: 'locate' as WorkflowStep,
            completed: true,
            timestamp: new Date(),
            data: { selectedRecords: ['record1'] },
            errors: [],
            warnings: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(incompleteContext),
      });

      const integration =
        await orchestrator.generateReviewIntegration('req-123');

      expect(integration.readyForReview).toBe(false);
      expect(integration.previousSteps.redact.completed).toBe(false);
      expect(integration.previousSteps.respond.completed).toBe(false);
    });
  });

  describe('getWorkflowMetrics', () => {
    it('should fetch workflow metrics successfully', async () => {
      const mockMetrics = {
        totalWorkflows: 100,
        completedWorkflows: 85,
        averageCompletionTime: 7200000, // 2 hours
        stepAnalytics: {
          locate: { averageTime: 1800000, successRate: 0.95, commonIssues: [] },
          redact: {
            averageTime: 3600000,
            successRate: 0.92,
            commonIssues: ['PII detection'],
          },
          respond: {
            averageTime: 1200000,
            successRate: 0.98,
            commonIssues: [],
          },
          review: { averageTime: 600000, successRate: 0.99, commonIssues: [] },
        },
        automationEffectiveness: {
          manualAverage: 14400000, // 4 hours
          assistedAverage: 7200000, // 2 hours
          automatedAverage: 3600000, // 1 hour
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMetrics),
      });

      const metrics = await orchestrator.getWorkflowMetrics(
        'agency-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(metrics.totalWorkflows).toBe(100);
      expect(metrics.completedWorkflows).toBe(85);
      expect(metrics.stepAnalytics.locate.successRate).toBe(0.95);
      expect(metrics.automationEffectiveness.automatedAverage).toBeLessThan(
        metrics.automationEffectiveness.assistedAverage
      );
    });

    it('should handle metrics API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(orchestrator.getWorkflowMetrics('agency-1')).rejects.toThrow(
        'Failed to get workflow metrics: Internal Server Error'
      );
    });
  });

  describe('getWorkflowContext', () => {
    it('should fetch workflow context successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkflowContext),
      });

      const context = await orchestrator.getWorkflowContext('req-123');

      expect(context.requestId).toBe('req-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/workflow/req-123', {
        headers: { Authorization: 'Bearer test-key' },
      });
    });

    it('should handle context fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(
        orchestrator.getWorkflowContext('invalid-id')
      ).rejects.toThrow('Failed to get workflow context: Not Found');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(v2WorkflowOrchestrator).toBeInstanceOf(V2WorkflowOrchestrator);
    });

    it('should be reusable across imports', () => {
      const instance1 = v2WorkflowOrchestrator;
      const instance2 = v2WorkflowOrchestrator;
      expect(instance1).toBe(instance2);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        orchestrator.initializeWorkflow(mockRequest, 'staff-1')
      ).rejects.toThrow('Network error');
    });

    it('should handle validation errors in step advancement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkflowContext),
      });

      // Test validation error handling
      const result = await orchestrator.validateStepCompletion(
        { ...mockWorkflowContext, currentStep: 'unknown' as any },
        {}
      );

      expect(result.isValid).toBe(false);
      expect(result.missingData[0]).toContain('Validation error');
    });

    it('should send failure notifications on errors', async () => {
      const error = new Error('Step execution failed');

      await orchestrator['handleWorkflowFailure']('req-123', error, 'staff-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/workflow/req-123/failure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        body: expect.stringContaining('Step execution failed'),
      });
    });
  });
});
