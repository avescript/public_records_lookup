/**
 * Unified AI Assistant Service
 * Central coordinator for AI interactions across all V2 workflow steps
 * Provides context sharing, decision transparency, and performance monitoring
 */

import {
  PublicRecordRequest,
  RequestStatus,
  WorkflowStep,
} from '@/types/request';

export interface AIContext {
  requestId: string;
  currentStep: WorkflowStep;
  previousSteps: WorkflowStep[];
  stepData: Record<WorkflowStep, any>;
  userPreferences: AIUserPreferences;
  sessionHistory: AIDecision[];
}

export interface AIUserPreferences {
  preferredTone: 'formal' | 'friendly' | 'professional';
  redactionSensitivity: 'light' | 'standard' | 'strict';
  automationLevel: 'manual' | 'assisted' | 'automated';
  explanationDetail: 'brief' | 'standard' | 'detailed';
  feedbackFrequency: 'minimal' | 'regular' | 'frequent';
}

export interface AIDecision {
  id: string;
  timestamp: Date;
  step: WorkflowStep;
  action: string;
  confidence: number;
  reasoning: string[];
  context: Record<string, any>;
  userFeedback?: 'positive' | 'negative' | 'corrected';
  corrections?: any;
}

export interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization' | 'pattern';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionable: boolean;
  relatedSteps: WorkflowStep[];
  confidence: number;
}

export interface AIPerformanceMetrics {
  accuracy: number;
  userSatisfaction: number;
  processingTime: number;
  correctionsRate: number;
  automationAdoption: number;
  decisionConfidence: number;
}

export interface WorkflowIntelligence {
  predictedDuration: number;
  riskAssessment: {
    complexityScore: number;
    sensitivityScore: number;
    urgencyScore: number;
    risks: string[];
  };
  recommendations: AIInsight[];
  similarCases: {
    requestId: string;
    similarity: number;
    relevantDecisions: AIDecision[];
  }[];
}

/**
 * Central AI Assistant Service
 * Coordinates AI interactions across workflow steps
 */
class UnifiedAIAssistant {
  private contexts: Map<string, AIContext> = new Map();
  private userPreferences: Map<string, AIUserPreferences> = new Map();
  private performanceMetrics: AIPerformanceMetrics = {
    accuracy: 0,
    userSatisfaction: 0,
    processingTime: 0,
    correctionsRate: 0,
    automationAdoption: 0,
    decisionConfidence: 0,
  };

  /**
   * Initialize AI context for a workflow session
   */
  async initializeContext(
    requestId: string,
    request: PublicRecordRequest,
    userId: string
  ): Promise<AIContext> {
    const userPrefs = await this.getUserPreferences(userId);

    const context: AIContext = {
      requestId,
      currentStep: 'locate',
      previousSteps: [],
      stepData: {},
      userPreferences: userPrefs,
      sessionHistory: [],
    };

    this.contexts.set(requestId, context);

    // Generate initial workflow intelligence
    await this.analyzeWorkflow(requestId, request);

    return context;
  }

  /**
   * Update context when transitioning between workflow steps
   */
  async updateStepContext(
    requestId: string,
    newStep: WorkflowStep,
    stepData: any
  ): Promise<AIContext> {
    const context = this.contexts.get(requestId);
    if (!context) {
      throw new Error(`No context found for request ${requestId}`);
    }

    // Store previous step data
    context.stepData[context.currentStep] = stepData;
    context.previousSteps.push(context.currentStep);
    context.currentStep = newStep;

    this.contexts.set(requestId, context);

    // Update workflow intelligence based on step progress
    await this.updateWorkflowIntelligence(requestId);

    return context;
  }

  /**
   * Record AI decision with reasoning and context
   */
  async recordDecision(
    requestId: string,
    action: string,
    confidence: number,
    reasoning: string[],
    context: Record<string, any>
  ): Promise<AIDecision> {
    const aiContext = this.contexts.get(requestId);
    if (!aiContext) {
      throw new Error(`No context found for request ${requestId}`);
    }

    const decision: AIDecision = {
      id: `${requestId}-${Date.now()}`,
      timestamp: new Date(),
      step: aiContext.currentStep,
      action,
      confidence,
      reasoning,
      context,
    };

    aiContext.sessionHistory.push(decision);
    this.contexts.set(requestId, aiContext);

    // Update performance metrics
    await this.updatePerformanceMetrics(decision);

    return decision;
  }

  /**
   * Generate AI insights and recommendations based on current context
   */
  async generateInsights(requestId: string): Promise<AIInsight[]> {
    const context = this.contexts.get(requestId);
    if (!context) {
      return [];
    }

    const insights: AIInsight[] = [];

    // Analyze workflow progress
    if (context.previousSteps.length > 0) {
      const progressInsights = await this.analyzeWorkflowProgress(context);
      insights.push(...progressInsights);
    }

    // Detect patterns from similar cases
    const patternInsights = await this.detectPatterns(context);
    insights.push(...patternInsights);

    // Performance optimization suggestions
    const optimizationInsights = await this.generateOptimizations(context);
    insights.push(...optimizationInsights);

    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Process user feedback to improve AI performance
   */
  async processFeedback(
    decisionId: string,
    feedback: 'positive' | 'negative' | 'corrected',
    corrections?: any
  ): Promise<void> {
    // Find the decision across all contexts
    for (const [requestId, context] of this.contexts) {
      const decision = context.sessionHistory.find(d => d.id === decisionId);
      if (decision) {
        decision.userFeedback = feedback;
        if (corrections) {
          decision.corrections = corrections;
        }

        // Update context
        this.contexts.set(requestId, context);

        // Process feedback for model improvement
        await this.updateModelFromFeedback(decision);
        break;
      }
    }
  }

  /**
   * Get cross-step intelligence for workflow optimization
   */
  async getWorkflowIntelligence(
    requestId: string
  ): Promise<WorkflowIntelligence | null> {
    const context = this.contexts.get(requestId);
    if (!context) {
      return null;
    }

    // Predict workflow duration based on complexity and history
    const predictedDuration = await this.predictWorkflowDuration(context);

    // Assess risks and complexity
    const riskAssessment = await this.assessWorkflowRisks(context);

    // Generate step-specific recommendations
    const recommendations = await this.generateInsights(requestId);

    // Find similar cases for reference
    const similarCases = await this.findSimilarCases(context);

    return {
      predictedDuration,
      riskAssessment,
      recommendations,
      similarCases,
    };
  }

  /**
   * Get AI performance metrics
   */
  getPerformanceMetrics(): AIPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear context when workflow is complete
   */
  async clearContext(requestId: string): Promise<void> {
    const context = this.contexts.get(requestId);
    if (context) {
      // Archive session data for analytics
      await this.archiveSession(context);
      this.contexts.delete(requestId);
    }
  }

  // Private helper methods

  private async getUserPreferences(userId: string): Promise<AIUserPreferences> {
    let prefs = this.userPreferences.get(userId);
    if (!prefs) {
      prefs = {
        preferredTone: 'professional',
        redactionSensitivity: 'standard',
        automationLevel: 'assisted',
        explanationDetail: 'standard',
        feedbackFrequency: 'regular',
      };
      this.userPreferences.set(userId, prefs);
    }
    return prefs;
  }

  private async analyzeWorkflow(
    requestId: string,
    request: PublicRecordRequest
  ): Promise<void> {
    // Implement workflow analysis logic
    // This would analyze the request complexity, sensitivity, etc.
  }

  private async updateWorkflowIntelligence(requestId: string): Promise<void> {
    // Update workflow predictions based on step progress
  }

  private async updatePerformanceMetrics(decision: AIDecision): Promise<void> {
    // Update aggregate performance metrics
  }

  private async analyzeWorkflowProgress(
    context: AIContext
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Check for potential bottlenecks
    if (context.previousSteps.length > 0) {
      insights.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Workflow Progress Analysis',
        description: `Completed ${context.previousSteps.length} workflow steps`,
        actionable: false,
        relatedSteps: context.previousSteps,
        confidence: 0.85,
      });
    }

    return insights;
  }

  private async detectPatterns(context: AIContext): Promise<AIInsight[]> {
    // Pattern detection from historical data
    return [];
  }

  private async generateOptimizations(
    context: AIContext
  ): Promise<AIInsight[]> {
    // Performance optimization suggestions
    return [];
  }

  private async updateModelFromFeedback(decision: AIDecision): Promise<void> {
    // Process feedback for continuous learning
  }

  private async predictWorkflowDuration(context: AIContext): Promise<number> {
    // Predict remaining workflow time in minutes
    const baseTime = 30; // Base time per step in minutes
    const remainingSteps = this.getRemainingSteps(context.currentStep);

    // Always return at least the base time for the current step
    const duration = Math.max(
      baseTime,
      baseTime * Math.max(1, remainingSteps.length)
    );
    return duration;
  }

  private async assessWorkflowRisks(context: AIContext): Promise<any> {
    return {
      complexityScore: 0.5,
      sensitivityScore: 0.3,
      urgencyScore: 0.7,
      risks: ['Standard processing workflow'],
    };
  }

  private async findSimilarCases(context: AIContext): Promise<any[]> {
    // Find similar historical cases
    return [];
  }

  private async archiveSession(context: AIContext): Promise<void> {
    // Archive session data for analytics and future reference
  }

  private getRemainingSteps(currentStep: WorkflowStep): WorkflowStep[] {
    const allSteps: WorkflowStep[] = ['locate', 'redact', 'respond', 'review'];
    const currentIndex = allSteps.indexOf(currentStep);
    return allSteps.slice(currentIndex + 1);
  }
}

// Export singleton instance
export const unifiedAIAssistant = new UnifiedAIAssistant();

// Export types and service
export { UnifiedAIAssistant };
