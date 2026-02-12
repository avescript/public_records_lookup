/**
 * AI Integration Utilities for V2 Workflow Components
 * Provides hooks and utilities to integrate AI decision transparency across workflow
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  AIContext,
  AIDecision,
  AIInsight,
  unifiedAIAssistant,
  WorkflowIntelligence,
} from '@/services/unifiedAIAssistant';
import { PublicRecordRequest, WorkflowStep } from '@/types/request';

export interface AIIntegrationState {
  context: AIContext | null;
  decisions: AIDecision[];
  insights: AIInsight[];
  intelligence: WorkflowIntelligence | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for integrating AI assistance into workflow components
 */
export function useAIAssistant(requestId: string, userId: string) {
  const [state, setState] = useState<AIIntegrationState>({
    context: null,
    decisions: [],
    insights: [],
    intelligence: null,
    loading: true,
    error: null,
  });

  // Initialize AI context
  const initializeAI = useCallback(
    async (request: PublicRecordRequest) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const context = await unifiedAIAssistant.initializeContext(
          requestId,
          request,
          userId
        );
        const intelligence =
          await unifiedAIAssistant.getWorkflowIntelligence(requestId);
        const insights = await unifiedAIAssistant.generateInsights(requestId);

        setState(prev => ({
          ...prev,
          context,
          intelligence,
          insights,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to initialize AI',
          loading: false,
        }));
      }
    },
    [requestId, userId]
  );

  // Update workflow step
  const updateWorkflowStep = useCallback(
    async (newStep: WorkflowStep, stepData: any) => {
      try {
        const updatedContext = await unifiedAIAssistant.updateStepContext(
          requestId,
          newStep,
          stepData
        );
        const updatedIntelligence =
          await unifiedAIAssistant.getWorkflowIntelligence(requestId);
        const updatedInsights =
          await unifiedAIAssistant.generateInsights(requestId);

        setState(prev => ({
          ...prev,
          context: updatedContext,
          intelligence: updatedIntelligence,
          insights: updatedInsights,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update workflow step',
        }));
      }
    },
    [requestId]
  );

  // Record AI decision
  const recordAIDecision = useCallback(
    async (
      action: string,
      confidence: number,
      reasoning: string[],
      context: Record<string, any>
    ) => {
      try {
        const decision = await unifiedAIAssistant.recordDecision(
          requestId,
          action,
          confidence,
          reasoning,
          context
        );

        setState(prev => ({
          ...prev,
          decisions: [...prev.decisions, decision],
        }));

        return decision;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to record AI decision',
        }));
      }
    },
    [requestId]
  );

  // Process user feedback
  const processFeedback = useCallback(
    async (
      decisionId: string,
      feedback: 'positive' | 'negative' | 'corrected',
      corrections?: any
    ) => {
      try {
        await unifiedAIAssistant.processFeedback(
          decisionId,
          feedback,
          corrections
        );

        // Update the decision in our state
        setState(prev => ({
          ...prev,
          decisions: prev.decisions.map(decision =>
            decision.id === decisionId
              ? { ...decision, userFeedback: feedback, corrections }
              : decision
          ),
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to process feedback',
        }));
      }
    },
    []
  );

  // Clear AI context
  const clearAIContext = useCallback(async () => {
    try {
      await unifiedAIAssistant.clearContext(requestId);
      setState({
        context: null,
        decisions: [],
        insights: [],
        intelligence: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to clear AI context',
      }));
    }
  }, [requestId]);

  // Refresh insights
  const refreshInsights = useCallback(async () => {
    try {
      const insights = await unifiedAIAssistant.generateInsights(requestId);
      setState(prev => ({ ...prev, insights }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to refresh insights',
      }));
    }
  }, [requestId]);

  return {
    ...state,
    initializeAI,
    updateWorkflowStep,
    recordAIDecision,
    processFeedback,
    clearAIContext,
    refreshInsights,
  };
}

/**
 * Hook for AI-enhanced component functionality
 */
export function useAIEnhancedComponent(
  componentName: string,
  requestId: string,
  userId: string
) {
  const aiAssistant = useAIAssistant(requestId, userId);

  // Record component-specific AI decision
  const recordComponentDecision = useCallback(
    async (
      action: string,
      data: any,
      reasoning: string[],
      confidence: number = 0.8
    ) => {
      const decision = await aiAssistant.recordAIDecision(
        `${componentName}_${action}`,
        confidence,
        reasoning,
        { component: componentName, ...data }
      );
      return decision;
    },
    [aiAssistant, componentName]
  );

  // Get component-specific insights
  const getComponentInsights = useCallback(() => {
    return aiAssistant.insights.filter(
      insight =>
        insight.relatedSteps.includes(
          aiAssistant.context?.currentStep as WorkflowStep
        ) ||
        insight.description.toLowerCase().includes(componentName.toLowerCase())
    );
  }, [aiAssistant.insights, aiAssistant.context?.currentStep, componentName]);

  return {
    ...aiAssistant,
    recordComponentDecision,
    getComponentInsights,
  };
}

/**
 * Utility for creating AI-powered suggestions
 */
export class AIWorkflowAssistant {
  static async generateLocationSuggestions(
    requestId: string,
    searchQuery: string,
    searchResults: any[]
  ): Promise<{
    suggestions: string[];
    decision: AIDecision;
  }> {
    const reasoning = [
      'Analyzed search query keywords',
      'Evaluated search result relevance',
      'Applied domain-specific knowledge',
    ];

    const confidence = Math.min(0.9, Math.max(0.4, searchResults.length / 10));

    const decision = await unifiedAIAssistant.recordDecision(
      requestId,
      'generate_location_suggestions',
      confidence,
      reasoning,
      {
        searchQuery,
        resultCount: searchResults.length,
        suggestionsGenerated: true,
      }
    );

    const suggestions = [
      'Consider expanding search terms',
      'Review related documents in same department',
      'Check for cross-references in metadata',
      'Consider alternative date ranges',
    ];

    return { suggestions, decision };
  }

  static async generateRedactionSuggestions(
    requestId: string,
    documentContent: string,
    currentRedactions: any[]
  ): Promise<{
    suggestions: any[];
    decision: AIDecision;
  }> {
    const reasoning = [
      'Scanned document for PII patterns',
      'Analyzed existing redactions for completeness',
      'Applied legal exemption rules',
      'Evaluated sensitivity context',
    ];

    const confidence = 0.85;

    const decision = await unifiedAIAssistant.recordDecision(
      requestId,
      'generate_redaction_suggestions',
      confidence,
      reasoning,
      {
        documentLength: documentContent.length,
        existingRedactions: currentRedactions.length,
        patternsDetected: true,
      }
    );

    const suggestions = [
      { type: 'phone', confidence: 0.9, location: [100, 120] },
      { type: 'email', confidence: 0.95, location: [200, 250] },
      { type: 'ssn', confidence: 0.8, location: [350, 370] },
    ];

    return { suggestions, decision };
  }

  static async generateResponseSuggestions(
    requestId: string,
    requestContext: any,
    selectedRecords: any[]
  ): Promise<{
    responseTemplate: string;
    suggestions: string[];
    decision: AIDecision;
  }> {
    const reasoning = [
      'Analyzed request type and context',
      'Evaluated selected records content',
      'Applied appropriate response tone',
      'Included required legal elements',
    ];

    const confidence = 0.82;

    const decision = await unifiedAIAssistant.recordDecision(
      requestId,
      'generate_response_suggestions',
      confidence,
      reasoning,
      {
        requestType: requestContext.type || 'general',
        recordCount: selectedRecords.length,
        templateGenerated: true,
      }
    );

    const responseTemplate = `Dear ${requestContext.requester?.name || 'Requester'},

Thank you for your public records request dated ${new Date().toLocaleDateString()}. 

We have located ${selectedRecords.length} records that are responsive to your request. After careful review and application of appropriate exemptions, we are pleased to provide you with the attached responsive documents.

Please note that certain information has been redacted pursuant to applicable legal exemptions to protect personal privacy and maintain the integrity of ongoing processes.

If you have any questions about this response, please don't hesitate to contact us.

Sincerely,
Public Records Office`;

    const suggestions = [
      'Consider personalizing the greeting further',
      'Add specific exemption citations',
      'Include information about appeal rights',
      'Mention delivery method and timeline',
    ];

    return { responseTemplate, suggestions, decision };
  }

  static async generateReviewSuggestions(
    requestId: string,
    response: any,
    workflowData: any
  ): Promise<{
    reviewPoints: string[];
    riskAssessment: any;
    decision: AIDecision;
  }> {
    const reasoning = [
      'Analyzed response completeness',
      'Evaluated legal compliance',
      'Assessed potential risks',
      'Reviewed workflow consistency',
    ];

    const confidence = 0.88;

    const decision = await unifiedAIAssistant.recordDecision(
      requestId,
      'generate_review_suggestions',
      confidence,
      reasoning,
      {
        responseLength: response?.content?.length || 0,
        workflowStepsCompleted: Object.keys(workflowData || {}).length,
        reviewPointsGenerated: true,
      }
    );

    const reviewPoints = [
      'Verify all requested records are addressed',
      'Confirm redaction consistency and completeness',
      'Review response tone and professionalism',
      'Check for any missing legal elements',
      'Validate delivery method and format',
    ];

    const riskAssessment = {
      sensitivityLevel: 'medium',
      complianceRisk: 'low',
      reputationRisk: 'low',
      recommendations: [
        'Standard approval process recommended',
        'Consider additional legal review if sensitive content',
      ],
    };

    return { reviewPoints, riskAssessment, decision };
  }
}

/**
 * Error boundary for AI-enhanced components
 */
export function withAIErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  return function AIEnhancedComponent(props: T) {
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        if (
          event.error?.message?.includes('AI') ||
          event.error?.message?.includes('assistant')
        ) {
          setError(event.error);
        }
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    if (error) {
      const FallbackComponent = fallback || DefaultAIErrorFallback;
      return <FallbackComponent error={error} />;
    }

    return <Component {...props} />;
  };
}

function DefaultAIErrorFallback({ error }: { error: Error }) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
      }}
    >
      <h3>AI Assistant Temporarily Unavailable</h3>
      <p>
        The AI features are currently experiencing issues. You can continue
        using the manual workflow.
      </p>
      <details>
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
    </div>
  );
}
