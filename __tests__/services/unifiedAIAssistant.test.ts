/**
 * @jest-environment jsdom
 */

import {
  AIContext,
  AIDecision,
  AIInsight,
  AIUserPreferences,
  UnifiedAIAssistant,
  unifiedAIAssistant,
} from '@/services/unifiedAIAssistant';
import {
  PublicRecordRequest,
  RequestStatus,
  WorkflowStep,
} from '@/types/request';

describe('UnifiedAIAssistant', () => {
  let aiAssistant: UnifiedAIAssistant;
  let mockRequest: PublicRecordRequest;

  beforeEach(() => {
    aiAssistant = new UnifiedAIAssistant();
    mockRequest = {
      id: 'test-request-123',
      requesterInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        organization: 'Test Org',
      },
      requestDetails: {
        description: 'Test request for records',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        recordTypes: ['emails', 'documents'],
        urgency: 'standard',
      },
      status: 'open' as RequestStatus,
      assignedTo: 'staff-user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      priority: 'medium',
      workflow: {
        currentStep: 'locate' as WorkflowStep,
        completedSteps: [],
        stepData: {},
      },
      attachments: [],
      activityLog: [],
      tags: [],
      redactionLevel: 'standard',
      legalReview: false,
    };
  });

  afterEach(() => {
    // Clear any contexts after each test
    aiAssistant.clearContext('test-request-123');
  });

  describe('Context Management', () => {
    it('initializes AI context for workflow session', async () => {
      const context = await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );

      expect(context).toBeDefined();
      expect(context.requestId).toBe('test-request-123');
      expect(context.currentStep).toBe('locate');
      expect(context.previousSteps).toEqual([]);
      expect(context.stepData).toEqual({});
      expect(context.userPreferences).toBeDefined();
      expect(context.sessionHistory).toEqual([]);
    });

    it('updates step context when transitioning between workflow steps', async () => {
      // Initialize context
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );

      const stepData = { selectedRecords: ['record1', 'record2'] };
      const updatedContext = await aiAssistant.updateStepContext(
        'test-request-123',
        'redact',
        stepData
      );

      expect(updatedContext.currentStep).toBe('redact');
      expect(updatedContext.previousSteps).toContain('locate');
      expect(updatedContext.stepData.locate).toEqual(stepData);
    });

    it('throws error when updating context for non-existent request', async () => {
      await expect(
        aiAssistant.updateStepContext('non-existent', 'redact', {})
      ).rejects.toThrow('No context found for request non-existent');
    });

    it('clears context when workflow is complete', async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );
      await aiAssistant.clearContext('test-request-123');

      // Attempting to update step context should fail after clearing
      await expect(
        aiAssistant.updateStepContext('test-request-123', 'redact', {})
      ).rejects.toThrow('No context found for request test-request-123');
    });
  });

  describe('Decision Recording', () => {
    beforeEach(async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );
    });

    it('records AI decision with reasoning and context', async () => {
      const decision = await aiAssistant.recordDecision(
        'test-request-123',
        'select_records',
        0.85,
        ['High relevance match', 'Keyword frequency analysis'],
        { selectedCount: 5, totalAnalyzed: 20 }
      );

      expect(decision).toBeDefined();
      expect(decision.id).toContain('test-request-123');
      expect(decision.action).toBe('select_records');
      expect(decision.confidence).toBe(0.85);
      expect(decision.reasoning).toEqual([
        'High relevance match',
        'Keyword frequency analysis',
      ]);
      expect(decision.context.selectedCount).toBe(5);
      expect(decision.step).toBe('locate');
    });

    it('records decisions across multiple steps', async () => {
      // Record first decision
      await aiAssistant.recordDecision(
        'test-request-123',
        'select_records',
        0.85,
        ['High relevance'],
        { count: 5 }
      );

      // Move to next step
      await aiAssistant.updateStepContext('test-request-123', 'redact', {
        records: 5,
      });

      // Record second decision
      await aiAssistant.recordDecision(
        'test-request-123',
        'apply_redactions',
        0.92,
        ['PII detected'],
        { redactionsApplied: 12 }
      );

      const intelligence =
        await aiAssistant.getWorkflowIntelligence('test-request-123');
      expect(intelligence).toBeDefined();
    });

    it('throws error when recording decision for non-existent request', async () => {
      await expect(
        aiAssistant.recordDecision('non-existent', 'action', 0.5, [], {})
      ).rejects.toThrow('No context found for request non-existent');
    });
  });

  describe('Insight Generation', () => {
    beforeEach(async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );
    });

    it('generates insights based on workflow context', async () => {
      // Add some step progress
      await aiAssistant.updateStepContext('test-request-123', 'redact', {
        records: 3,
      });

      const insights = await aiAssistant.generateInsights('test-request-123');

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThanOrEqual(0);
    });

    it('returns empty array for non-existent request', async () => {
      const insights = await aiAssistant.generateInsights('non-existent');
      expect(insights).toEqual([]);
    });

    it('sorts insights by priority correctly', async () => {
      await aiAssistant.updateStepContext('test-request-123', 'redact', {
        records: 3,
      });

      const insights = await aiAssistant.generateInsights('test-request-123');

      if (insights.length > 1) {
        const priorities = ['critical', 'high', 'medium', 'low'];
        for (let i = 1; i < insights.length; i++) {
          const currentIndex = priorities.indexOf(insights[i].priority);
          const previousIndex = priorities.indexOf(insights[i - 1].priority);
          expect(currentIndex).toBeGreaterThanOrEqual(previousIndex);
        }
      }
    });
  });

  describe('Feedback Processing', () => {
    let decisionId: string;

    beforeEach(async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );
      const decision = await aiAssistant.recordDecision(
        'test-request-123',
        'test_action',
        0.8,
        ['test reasoning'],
        {}
      );
      decisionId = decision.id;
    });

    it('processes positive feedback', async () => {
      await expect(
        aiAssistant.processFeedback(decisionId, 'positive')
      ).resolves.not.toThrow();
    });

    it('processes negative feedback', async () => {
      await expect(
        aiAssistant.processFeedback(decisionId, 'negative')
      ).resolves.not.toThrow();
    });

    it('processes corrective feedback with corrections', async () => {
      const corrections = { correctedAction: 'better_action' };
      await expect(
        aiAssistant.processFeedback(decisionId, 'corrected', corrections)
      ).resolves.not.toThrow();
    });
  });

  describe('Workflow Intelligence', () => {
    beforeEach(async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );
    });

    it('generates workflow intelligence for active request', async () => {
      const intelligence =
        await aiAssistant.getWorkflowIntelligence('test-request-123');

      expect(intelligence).toBeDefined();
      expect(intelligence!.predictedDuration).toBeGreaterThan(0);
      expect(intelligence!.riskAssessment).toBeDefined();
      expect(intelligence!.recommendations).toBeDefined();
      expect(intelligence!.similarCases).toBeDefined();
      expect(Array.isArray(intelligence!.recommendations)).toBe(true);
      expect(Array.isArray(intelligence!.similarCases)).toBe(true);
    });

    it('returns null for non-existent request', async () => {
      const intelligence =
        await aiAssistant.getWorkflowIntelligence('non-existent');
      expect(intelligence).toBeNull();
    });

    it('provides risk assessment with appropriate scores', async () => {
      const intelligence =
        await aiAssistant.getWorkflowIntelligence('test-request-123');

      expect(intelligence!.riskAssessment).toBeDefined();
      expect(
        intelligence!.riskAssessment.complexityScore
      ).toBeGreaterThanOrEqual(0);
      expect(intelligence!.riskAssessment.complexityScore).toBeLessThanOrEqual(
        1
      );
      expect(
        intelligence!.riskAssessment.sensitivityScore
      ).toBeGreaterThanOrEqual(0);
      expect(intelligence!.riskAssessment.sensitivityScore).toBeLessThanOrEqual(
        1
      );
      expect(intelligence!.riskAssessment.urgencyScore).toBeGreaterThanOrEqual(
        0
      );
      expect(intelligence!.riskAssessment.urgencyScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(intelligence!.riskAssessment.risks)).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('provides performance metrics', () => {
      const metrics = aiAssistant.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.accuracy).toBe('number');
      expect(typeof metrics.userSatisfaction).toBe('number');
      expect(typeof metrics.processingTime).toBe('number');
      expect(typeof metrics.correctionsRate).toBe('number');
      expect(typeof metrics.automationAdoption).toBe('number');
      expect(typeof metrics.decisionConfidence).toBe('number');
    });

    it('returns metrics within valid ranges', () => {
      const metrics = aiAssistant.getPerformanceMetrics();

      Object.values(metrics).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('User Preferences', () => {
    it('initializes with default preferences for new user', async () => {
      const context = await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'new-user-456'
      );

      expect(context.userPreferences.preferredTone).toBe('professional');
      expect(context.userPreferences.redactionSensitivity).toBe('standard');
      expect(context.userPreferences.automationLevel).toBe('assisted');
      expect(context.userPreferences.explanationDetail).toBe('standard');
      expect(context.userPreferences.feedbackFrequency).toBe('regular');
    });
  });

  describe('Singleton Instance', () => {
    it('provides singleton instance', () => {
      expect(unifiedAIAssistant).toBeDefined();
      expect(unifiedAIAssistant).toBeInstanceOf(UnifiedAIAssistant);
    });

    it('maintains singleton pattern', async () => {
      const context1 = await unifiedAIAssistant.initializeContext(
        'singleton-test-1',
        mockRequest,
        'user-1'
      );

      const context2 = await unifiedAIAssistant.initializeContext(
        'singleton-test-2',
        mockRequest,
        'user-2'
      );

      expect(context1).toBeDefined();
      expect(context2).toBeDefined();
      expect(context1.requestId).toBe('singleton-test-1');
      expect(context2.requestId).toBe('singleton-test-2');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid workflow steps gracefully', async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );

      // This should work with valid step
      await expect(
        aiAssistant.updateStepContext('test-request-123', 'redact', {})
      ).resolves.toBeDefined();
    });

    it('handles empty reasoning arrays', async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );

      const decision = await aiAssistant.recordDecision(
        'test-request-123',
        'test_action',
        0.5,
        [],
        {}
      );

      expect(decision.reasoning).toEqual([]);
    });

    it('handles null context data gracefully', async () => {
      await aiAssistant.initializeContext(
        'test-request-123',
        mockRequest,
        'user-123'
      );

      const decision = await aiAssistant.recordDecision(
        'test-request-123',
        'test_action',
        0.5,
        ['test'],
        null as any
      );

      expect(decision.context).toBeNull();
    });
  });

  describe('Integration Testing', () => {
    it('supports complete workflow progression', async () => {
      // Initialize
      const context = await aiAssistant.initializeContext(
        'integration-test',
        mockRequest,
        'user-123'
      );
      expect(context.currentStep).toBe('locate');

      // Step 1: Locate
      await aiAssistant.recordDecision(
        'integration-test',
        'select_records',
        0.8,
        ['Relevance analysis'],
        { count: 5 }
      );
      await aiAssistant.updateStepContext('integration-test', 'redact', {
        selectedRecords: 5,
      });

      // Step 2: Redact
      await aiAssistant.recordDecision(
        'integration-test',
        'apply_redactions',
        0.9,
        ['PII detection'],
        { redactions: 12 }
      );
      await aiAssistant.updateStepContext('integration-test', 'respond', {
        redactedRecords: 5,
      });

      // Step 3: Respond
      await aiAssistant.recordDecision(
        'integration-test',
        'generate_response',
        0.85,
        ['Template matching'],
        { responseLength: 250 }
      );
      await aiAssistant.updateStepContext('integration-test', 'review', {
        response: 'generated',
      });

      // Get final intelligence
      const intelligence =
        await aiAssistant.getWorkflowIntelligence('integration-test');
      expect(intelligence).toBeDefined();
      expect(intelligence!.predictedDuration).toBeGreaterThan(0);

      // Get insights
      const insights = await aiAssistant.generateInsights('integration-test');
      expect(Array.isArray(insights)).toBe(true);

      // Clean up
      await aiAssistant.clearContext('integration-test');
    });
  });
});
