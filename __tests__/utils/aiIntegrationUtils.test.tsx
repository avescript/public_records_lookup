import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';

import { unifiedAIAssistant } from '@/services/unifiedAIAssistant';
import {
  AIWorkflowAssistant,
  useAIAssistant,
  useAIEnhancedComponent,
  withAIErrorBoundary,
} from '@/utils/aiIntegrationUtils';

// Mock the unified AI assistant
jest.mock('@/services/unifiedAIAssistant', () => ({
  unifiedAIAssistant: {
    initializeContext: jest.fn(),
    updateStepContext: jest.fn(),
    recordDecision: jest.fn(),
    generateInsights: jest.fn(),
    processFeedback: jest.fn(),
    getWorkflowIntelligence: jest.fn(),
    clearContext: jest.fn(),
  },
}));

// Mock console.error for error boundary tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('AI Integration Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAIAssistant hook', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      expect(result.current.context).toBeNull();
      expect(result.current.decisions).toEqual([]);
      expect(result.current.insights).toEqual([]);
      expect(result.current.intelligence).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('provides access to AI assistant methods', () => {
      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      expect(typeof result.current.initializeAI).toBe('function');
      expect(typeof result.current.updateWorkflowStep).toBe('function');
      expect(typeof result.current.recordAIDecision).toBe('function');
      expect(typeof result.current.processFeedback).toBe('function');
      expect(typeof result.current.clearAIContext).toBe('function');
      expect(typeof result.current.refreshInsights).toBe('function');
    });

    it('initializes AI context', async () => {
      const mockRequest = {
        id: 'test-request-123',
        description: 'Test request',
        currentStep: 'locate' as const,
      };

      const mockContext = { requestId: 'test-request-123' };
      const mockInsights = [
        { type: 'suggestion', priority: 'high', title: 'Test' },
      ];
      const mockIntelligence = { nextSteps: ['redact'] };

      (unifiedAIAssistant.initializeContext as jest.Mock).mockResolvedValue(
        mockContext
      );
      (unifiedAIAssistant.generateInsights as jest.Mock).mockResolvedValue(
        mockInsights
      );
      (
        unifiedAIAssistant.getWorkflowIntelligence as jest.Mock
      ).mockResolvedValue(mockIntelligence);

      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      await act(async () => {
        await result.current.initializeAI(mockRequest);
      });

      expect(unifiedAIAssistant.initializeContext).toHaveBeenCalledWith(
        'test-request-123',
        mockRequest,
        'user-1'
      );
      expect(result.current.context).toEqual(mockContext);
      expect(result.current.insights).toEqual(mockInsights);
      expect(result.current.intelligence).toEqual(mockIntelligence);
      expect(result.current.loading).toBe(false);
    });

    it('records AI decisions', async () => {
      const mockDecision = {
        id: 'decision-1',
        step: 'locate',
        decision: 'Found documents',
        confidence: 0.9,
      };

      (unifiedAIAssistant.recordDecision as jest.Mock).mockResolvedValue(
        mockDecision
      );

      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      await act(async () => {
        const decision = await result.current.recordAIDecision(
          'locate',
          0.9,
          ['reason1'],
          { testContext: true }
        );
        expect(decision).toEqual(mockDecision);
      });

      expect(unifiedAIAssistant.recordDecision).toHaveBeenCalledWith(
        'test-request-123',
        'locate',
        0.9,
        ['reason1'],
        { testContext: true }
      );
    });

    it('processes user feedback', async () => {
      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      await act(async () => {
        await result.current.processFeedback('decision-1', 'positive');
      });

      expect(unifiedAIAssistant.processFeedback).toHaveBeenCalledWith(
        'decision-1',
        'positive',
        undefined
      );
    });

    it('handles errors gracefully', async () => {
      (unifiedAIAssistant.generateInsights as jest.Mock).mockRejectedValue(
        new Error('AI Service Error')
      );

      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      await act(async () => {
        await result.current.refreshInsights();
      });

      expect(result.current.error).toBe('AI Service Error');
    });
  });

  describe('useAIEnhancedComponent hook', () => {
    it('provides AI capabilities for component', () => {
      const { result } = renderHook(() =>
        useAIEnhancedComponent('TestComponent', 'test-request-123', 'user-1')
      );

      expect(typeof result.current.recordComponentDecision).toBe('function');
      expect(typeof result.current.getComponentInsights).toBe('function');
      expect(typeof result.current.initializeAI).toBe('function');
      expect(typeof result.current.refreshInsights).toBe('function');
    });
  });

  describe('AIWorkflowAssistant', () => {
    it('generates location suggestions', async () => {
      const mockDecision = {
        id: 'decision-1',
        step: 'generate_location_suggestions',
        confidence: 0.8,
      };

      (unifiedAIAssistant.recordDecision as jest.Mock).mockResolvedValue(
        mockDecision
      );

      const result = await AIWorkflowAssistant.generateLocationSuggestions(
        'test-request-123',
        'police reports',
        [{ title: 'Report 1' }, { title: 'Report 2' }]
      );

      expect(result.suggestions).toBeDefined();
      expect(result.decision).toEqual(mockDecision);
      expect(unifiedAIAssistant.recordDecision).toHaveBeenCalled();
    });
  });

  describe('withAIErrorBoundary HOC', () => {
    const TestComponent = ({ name }: { name: string }) => (
      <div>Hello {name}</div>
    );

    it('renders children when no error', () => {
      const EnhancedComponent = withAIErrorBoundary(TestComponent);
      render(<EnhancedComponent name='World' />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders error fallback when AI error occurs via window error', async () => {
      const EnhancedComponent = withAIErrorBoundary(TestComponent);
      const { container } = render(<EnhancedComponent name='World' />);

      // Simulate a window error event with AI-related error
      const aiError = new Error('AI Service unavailable');
      const errorEvent = new ErrorEvent('error', { error: aiError });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      // Check if error boundary shows fallback
      expect(container.textContent).toContain(
        'AI Assistant Temporarily Unavailable'
      );
    });
  });

  describe('Error Handling', () => {
    it('handles AI service failures gracefully', async () => {
      (unifiedAIAssistant.generateInsights as jest.Mock).mockRejectedValue(
        new Error('AI Service Error')
      );

      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      await act(async () => {
        await result.current.refreshInsights();
      });

      expect(result.current.error).toBe('AI Service Error');
    });

    it('provides fallback when AI features unavailable', () => {
      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      // All methods should be available even if AI service fails
      expect(typeof result.current.recordAIDecision).toBe('function');
      expect(typeof result.current.refreshInsights).toBe('function');
      expect(typeof result.current.processFeedback).toBe('function');
    });
  });

  describe('Integration', () => {
    it('works with complete AI workflow', async () => {
      const mockRequest = {
        id: 'test-request-123',
        description: 'Test request',
        currentStep: 'locate' as const,
      };

      const mockContext = { requestId: 'test-request-123' };
      const mockDecision = { id: 'decision-1', step: 'locate' };

      (unifiedAIAssistant.initializeContext as jest.Mock).mockResolvedValue(
        mockContext
      );
      (unifiedAIAssistant.generateInsights as jest.Mock).mockResolvedValue([]);
      (
        unifiedAIAssistant.getWorkflowIntelligence as jest.Mock
      ).mockResolvedValue({});
      (unifiedAIAssistant.updateStepContext as jest.Mock).mockResolvedValue(
        mockContext
      );
      (unifiedAIAssistant.recordDecision as jest.Mock).mockResolvedValue(
        mockDecision
      );

      const { result } = renderHook(() =>
        useAIAssistant('test-request-123', 'user-1')
      );

      // Simulate complete workflow
      await act(async () => {
        await result.current.initializeAI(mockRequest);
        await result.current.updateWorkflowStep('locate', {
          foundDocuments: 3,
        });
        await result.current.recordAIDecision(
          'locate',
          0.9,
          ['Complete search'],
          { foundDocuments: 3 }
        );
      });

      expect(unifiedAIAssistant.initializeContext).toHaveBeenCalledWith(
        'test-request-123',
        mockRequest,
        'user-1'
      );

      expect(unifiedAIAssistant.updateStepContext).toHaveBeenCalledWith(
        'test-request-123',
        'locate',
        { foundDocuments: 3 }
      );

      expect(unifiedAIAssistant.recordDecision).toHaveBeenCalledWith(
        'test-request-123',
        'locate',
        0.9,
        ['Complete search'],
        { foundDocuments: 3 }
      );
    });
  });
});
