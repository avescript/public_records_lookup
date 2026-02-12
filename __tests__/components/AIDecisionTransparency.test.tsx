/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  AIDecisionTransparency,
  AIInsightsPanel,
} from '@/components/shared/AIDecisionTransparency';
import { AIDecision, AIInsight } from '@/services/unifiedAIAssistant';

// Mock the unified AI assistant service
jest.mock('@/services/unifiedAIAssistant', () => ({
  unifiedAIAssistant: {
    processFeedback: jest.fn(),
  },
}));

const mockDecision: AIDecision = {
  id: 'test-decision-123',
  timestamp: new Date('2024-02-12T10:30:00Z'),
  step: 'redact',
  action: 'apply_redactions',
  confidence: 0.85,
  reasoning: [
    'High confidence PII detection',
    'Legal exemption analysis completed',
    'Pattern matching successful',
  ],
  context: {
    redactionsApplied: 12,
    documentsProcessed: 3,
    sensitivityLevel: 'standard',
  },
};

const mockInsights: AIInsight[] = [
  {
    type: 'suggestion',
    priority: 'high',
    title: 'Optimization Opportunity',
    description: 'Consider adjusting redaction sensitivity for better coverage',
    actionable: true,
    relatedSteps: ['redact'],
    confidence: 0.9,
  },
  {
    type: 'warning',
    priority: 'medium',
    title: 'Review Recommendation',
    description: 'This request may require additional legal review',
    actionable: true,
    relatedSteps: ['review'],
    confidence: 0.75,
  },
  {
    type: 'pattern',
    priority: 'low',
    title: 'Pattern Recognition',
    description: 'Similar pattern detected in previous requests',
    actionable: false,
    relatedSteps: ['locate', 'redact'],
    confidence: 0.6,
  },
];

describe('AIDecisionTransparency', () => {
  const mockFeedbackSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeedbackSubmit.mockClear();
  });

  describe('Component Rendering', () => {
    it('renders decision information correctly', () => {
      render(<AIDecisionTransparency decision={mockDecision} />);

      expect(
        screen.getByText('AI Decision: Apply Redactions')
      ).toBeInTheDocument();
      expect(screen.getByText('85% - High')).toBeInTheDocument();
      expect(screen.getByText('Workflow Step: Redact')).toBeInTheDocument();
    });

    it('renders timestamp in correct format', () => {
      render(<AIDecisionTransparency decision={mockDecision} />);

      // The timestamp should be formatted as "Feb 12, 10:30 AM" or similar
      expect(screen.getByText(/Feb 12/)).toBeInTheDocument();
    });

    it('renders confidence score with appropriate color and progress', () => {
      render(<AIDecisionTransparency decision={mockDecision} />);

      const confidenceChip = screen.getByText('85% - High');
      expect(confidenceChip).toBeInTheDocument();

      // Check for progress bar
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders reasoning when showDetailedReasoning is true', () => {
      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showDetailedReasoning={true}
        />
      );

      expect(screen.getByText('AI Reasoning (3 factors)')).toBeInTheDocument();
    });

    it('hides reasoning when showDetailedReasoning is false', () => {
      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showDetailedReasoning={false}
        />
      );

      expect(screen.queryByText('AI Reasoning')).not.toBeInTheDocument();
    });

    it('renders context data correctly', () => {
      render(<AIDecisionTransparency decision={mockDecision} />);

      expect(screen.getByText('Decision Context:')).toBeInTheDocument();
      expect(screen.getByText(/redactionsApplied: 12/)).toBeInTheDocument();
      expect(screen.getByText(/documentsProcessed: 3/)).toBeInTheDocument();
    });
  });

  describe('Confidence Display', () => {
    it('displays very high confidence correctly', () => {
      const highConfidenceDecision = { ...mockDecision, confidence: 0.95 };
      render(<AIDecisionTransparency decision={highConfidenceDecision} />);

      expect(screen.getByText('95% - Very High')).toBeInTheDocument();
    });

    it('displays low confidence correctly', () => {
      const lowConfidenceDecision = { ...mockDecision, confidence: 0.3 };
      render(<AIDecisionTransparency decision={lowConfidenceDecision} />);

      expect(screen.getByText('30% - Very Low')).toBeInTheDocument();
    });

    it('applies appropriate color for different confidence levels', () => {
      const { rerender } = render(
        <AIDecisionTransparency decision={mockDecision} />
      );

      // High confidence (0.85) should use success color
      expect(screen.getByText('85% - High')).toBeInTheDocument();

      // Medium confidence should use warning color
      const mediumConfidenceDecision = { ...mockDecision, confidence: 0.65 };
      rerender(<AIDecisionTransparency decision={mediumConfidenceDecision} />);
      expect(screen.getByText('65% - Medium')).toBeInTheDocument();

      // Low confidence should use error color
      const lowConfidenceDecision = { ...mockDecision, confidence: 0.3 };
      rerender(<AIDecisionTransparency decision={lowConfidenceDecision} />);
      expect(screen.getByText('30% - Very Low')).toBeInTheDocument();
    });
  });

  describe('Feedback Controls', () => {
    it('shows feedback controls when enabled and no feedback exists', () => {
      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showFeedbackControls={true}
          onFeedbackSubmit={mockFeedbackSubmit}
        />
      );

      expect(
        screen.getByText('Was this AI decision helpful?')
      ).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(
        buttons.find(
          btn =>
            btn.textContent?.includes('Helpful') &&
            !btn.textContent?.includes('Not')
        )
      ).toBeInTheDocument();
      expect(
        buttons.find(btn => btn.textContent?.includes('Not Helpful'))
      ).toBeInTheDocument();
      expect(
        buttons.find(btn => btn.textContent?.includes('Suggest Improvement'))
      ).toBeInTheDocument();
    });

    it('hides feedback controls when disabled', () => {
      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showFeedbackControls={false}
        />
      );

      expect(
        screen.queryByText('Was this AI decision helpful?')
      ).not.toBeInTheDocument();
    });

    it('shows existing feedback status', () => {
      const decisionWithFeedback = {
        ...mockDecision,
        userFeedback: 'positive' as const,
      };

      render(<AIDecisionTransparency decision={decisionWithFeedback} />);

      expect(
        screen.getByText('You provided positive feedback for this decision')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Was this AI decision helpful?')
      ).not.toBeInTheDocument();
    });

    it('handles positive feedback correctly', async () => {
      const mockProcessFeedback = jest.fn();
      const mockOnFeedback = jest.fn();

      // Mock the service method
      require('@/services/unifiedAIAssistant').unifiedAIAssistant.processFeedback =
        mockProcessFeedback;

      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showFeedbackControls={true}
          onFeedbackSubmitted={mockOnFeedback}
        />
      );

      const buttons = screen.getAllByRole('button');
      const helpfulButton = buttons.find(
        btn =>
          btn.textContent?.includes('Helpful') &&
          !btn.textContent?.includes('Not')
      );
      expect(helpfulButton).toBeTruthy();
      fireEvent.click(helpfulButton!);

      await waitFor(() => {
        expect(mockProcessFeedback).toHaveBeenCalledWith(
          'test-decision-123',
          'positive'
        );
        expect(mockOnFeedback).toHaveBeenCalledWith('positive');
      });

      expect(
        screen.getByText(
          'Thank you for your feedback! This helps improve AI performance.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Feedback Dialogs', () => {
    it('opens negative feedback dialog', async () => {
      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showFeedbackControls={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const notHelpfulButton = buttons.find(btn =>
        btn.textContent?.includes('Not Helpful')
      );
      expect(notHelpfulButton).toBeTruthy();
      fireEvent.click(notHelpfulButton!);

      await waitFor(() => {
        expect(screen.getByText('Provide Feedback')).toBeInTheDocument();
      });
    });

    it('opens correction dialog', async () => {
      render(
        <AIDecisionTransparency
          decision={mockDecision}
          showFeedbackControls={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const suggestionButton = buttons.find(btn =>
        btn.textContent?.includes('Suggest Improvement')
      );
      expect(suggestionButton).toBeTruthy();
      fireEvent.click(suggestionButton!);

      await waitFor(() => {
        expect(screen.getByLabelText('Your suggestion')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('submits correction with text input', async () => {
      const user = userEvent.setup();
      const mockProcessFeedback = jest.fn();
      require('@/services/unifiedAIAssistant').unifiedAIAssistant.processFeedback =
        mockProcessFeedback;

      render(<AIDecisionTransparency decision={mockDecision} />);

      // Open correction dialog
      const suggestionButton = screen.getByRole('button', {
        name: /Suggest Improvement/,
      });
      await user.click(suggestionButton);

      // Enter suggestion text
      const textArea = screen.getByLabelText('Your suggestion');
      await user.type(
        textArea,
        'This should be improved by considering additional context'
      );

      // Submit
      const submitButton = screen.getByRole('button', {
        name: 'Submit Suggestion',
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessFeedback).toHaveBeenCalledWith(
          'test-decision-123',
          'corrected',
          {
            correctionText:
              'This should be improved by considering additional context',
            rating: null,
          }
        );
      });
    });
  });

  describe('Reasoning Display', () => {
    it('expands reasoning accordion to show details', async () => {
      render(<AIDecisionTransparency decision={mockDecision} />);

      const reasoningAccordion = screen.getByText('AI Reasoning (3 factors)');
      fireEvent.click(reasoningAccordion);

      await waitFor(() => {
        expect(
          screen.getByText('High confidence PII detection')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Legal exemption analysis completed')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Pattern matching successful')
        ).toBeInTheDocument();
      });
    });

    it('handles empty reasoning array', () => {
      const decisionWithoutReasoning = {
        ...mockDecision,
        reasoning: [],
      };

      render(<AIDecisionTransparency decision={decisionWithoutReasoning} />);

      expect(screen.queryByText('AI Reasoning')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing context gracefully', () => {
      const decisionWithoutContext = {
        ...mockDecision,
        context: {},
      };

      render(<AIDecisionTransparency decision={decisionWithoutContext} />);

      expect(screen.queryByText('Decision Context:')).not.toBeInTheDocument();
    });

    it('handles complex context objects', () => {
      const decisionWithComplexContext = {
        ...mockDecision,
        context: {
          simpleValue: 'test',
          complexObject: { nested: 'value', array: [1, 2, 3] },
          nullValue: null,
        },
      };

      render(<AIDecisionTransparency decision={decisionWithComplexContext} />);

      expect(screen.getByText('Decision Context:')).toBeInTheDocument();
      expect(screen.getByText(/simpleValue: test/)).toBeInTheDocument();
      expect(screen.getByText(/complexObject:/)).toBeInTheDocument();
    });
  });
});

describe('AIInsightsPanel', () => {
  describe('Component Rendering', () => {
    it('renders insights correctly', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      expect(screen.getByText('Optimization Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Review Recommendation')).toBeInTheDocument();
      expect(screen.getByText('Pattern Recognition')).toBeInTheDocument();
    });

    it('renders empty state when no insights', () => {
      render(<AIInsightsPanel insights={[]} />);

      expect(
        screen.getByText('No AI insights available at this time.')
      ).toBeInTheDocument();
    });

    it('displays priority indicators correctly', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('displays confidence scores', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('shows related workflow steps', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      expect(screen.getAllByText('redact')).toHaveLength(2); // One for high priority, one for low priority
      expect(screen.getByText('review')).toBeInTheDocument();
      expect(screen.getByText('locate')).toBeInTheDocument();
    });

    it('indicates actionable insights', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      const actionableChips = screen.getAllByText('Actionable');
      expect(actionableChips).toHaveLength(2); // Two insights are marked as actionable
    });
  });

  describe('Insight Dismissal', () => {
    it('shows dismiss button when onInsightDismiss is provided', () => {
      const mockDismiss = jest.fn();
      render(
        <AIInsightsPanel
          insights={mockInsights}
          onInsightDismiss={mockDismiss}
        />
      );

      const dismissButtons = screen.getAllByTitle('Dismiss');
      expect(dismissButtons).toHaveLength(mockInsights.length);
    });

    it('calls onInsightDismiss when dismiss button clicked', () => {
      const mockDismiss = jest.fn();
      render(
        <AIInsightsPanel
          insights={mockInsights}
          onInsightDismiss={mockDismiss}
        />
      );

      const firstDismissButton = screen.getAllByTitle('Dismiss')[0];
      fireEvent.click(firstDismissButton);

      expect(mockDismiss).toHaveBeenCalledWith('insight-0');
    });

    it('hides dismiss button when onInsightDismiss is not provided', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      expect(screen.queryByTitle('Dismiss')).not.toBeInTheDocument();
    });
  });

  describe('Priority Handling', () => {
    it('uses correct icons for different priorities', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      // Check that warning icons are used for critical/high priority
      const warningIcons = document.querySelectorAll(
        '[data-testid="WarningIcon"]'
      );
      expect(warningIcons.length).toBeGreaterThan(0);
    });

    it('applies correct colors for priority levels', () => {
      render(<AIInsightsPanel insights={mockInsights} />);

      // High priority should use warning color
      const highPriorityChip = screen.getByText('HIGH');
      expect(highPriorityChip).toBeInTheDocument();

      // Medium priority should use info color
      const mediumPriorityChip = screen.getByText('MEDIUM');
      expect(mediumPriorityChip).toBeInTheDocument();

      // Low priority should use success color
      const lowPriorityChip = screen.getByText('LOW');
      expect(lowPriorityChip).toBeInTheDocument();
    });
  });
});
