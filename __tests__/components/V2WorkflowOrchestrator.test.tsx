/**
 * V2WorkflowOrchestrator Component Tests
 * Tests the complete workflow integration and step coordination
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { V2WorkflowOrchestrator } from '@/components/staff/V2WorkflowOrchestrator';

// Mock the services
jest.mock('@/services/v2WorkflowOrchestrator', () => ({
  v2WorkflowOrchestrator: {
    getWorkflowState: jest.fn(),
    saveStepProgress: jest.fn(),
    updateCurrentStep: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
    },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock child components
jest.mock('../../src/components/staff/AIResponseGenerator', () => ({
  AIResponseGenerator: ({ onSave, onSend }: any) => (
    <div data-testid='ai-response-generator'>
      <button onClick={() => onSave({ content: 'test response' })}>
        Save Response
      </button>
      <button onClick={() => onSend({ content: 'test response' })}>
        Send Response
      </button>
    </div>
  ),
}));

jest.mock('../../src/components/staff/ReviewInterface', () => ({
  ReviewInterface: ({ requestId }: any) => (
    <div data-testid='review-interface'>Review Interface for {requestId}</div>
  ),
}));

const mockRequest = {
  id: 'req-123',
  requestNumber: 'REQ-2026-001',
  requesterInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
  },
  requestDetails: {
    subject: 'Police incident reports',
    description: 'Request for incident reports from January 2026',
    dateRange: {
      from: '2026-01-01',
      to: '2026-01-31',
    },
  },
  agencyId: 'agency-1',
  priority: 'normal',
};

const mockWorkflowState = {
  request: mockRequest,
  response: null,
  data: {},
  currentStep: 0,
  stepValidation: {
    0: false,
    1: false,
    2: false,
    3: false,
  },
};

describe('V2WorkflowOrchestrator', () => {
  const {
    v2WorkflowOrchestrator,
  } = require('../../src/services/v2WorkflowOrchestrator');

  beforeEach(() => {
    jest.clearAllMocks();
    v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(
      mockWorkflowState
    );
    v2WorkflowOrchestrator.saveStepProgress.mockResolvedValue(undefined);
    v2WorkflowOrchestrator.updateCurrentStep.mockResolvedValue(undefined);
  });

  describe('Component Initialization', () => {
    it('should render workflow orchestrator with request details', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(screen.getByText(/Police incident reports/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Request #REQ-2026-001/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('should display workflow progress stepper', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(screen.getByText('Locate Records')).toBeInTheDocument();
      });

      expect(screen.getByText('Redact Sensitive Info')).toBeInTheDocument();
      expect(screen.getByText('Generate Response')).toBeInTheDocument();
      expect(screen.getByText('Review & Send')).toBeInTheDocument();
    });

    it('should show current step indicator', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });

      expect(screen.getByText('Locate Records')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should disable previous button on first step', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous Step');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button when step is not validated', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        const nextButton = screen.getByText('Next Step');
        expect(nextButton).toBeDisabled();
      });
    });

    it('should allow navigation to completed steps', async () => {
      const completedState = {
        ...mockWorkflowState,
        currentStep: 2,
        stepValidation: { 0: true, 1: true, 2: false, 3: false },
      };
      v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(completedState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Generate Response')).toBeInTheDocument();
      });

      // Should be able to click on completed steps
      const locateStep = screen.getByText('Locate Records');
      await user.click(locateStep);

      expect(v2WorkflowOrchestrator.updateCurrentStep).toHaveBeenCalledWith(
        'req-123',
        0
      );
    });
  });

  describe('Step Components', () => {
    it('should render AI Response Generator for respond step', async () => {
      const respondState = {
        ...mockWorkflowState,
        currentStep: 2,
      };
      v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(respondState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(screen.getByTestId('ai-response-generator')).toBeInTheDocument();
      });
    });

    it('should render Review Interface for review step', async () => {
      const reviewState = {
        ...mockWorkflowState,
        currentStep: 3,
      };
      v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(reviewState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(screen.getByTestId('review-interface')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Review Interface for req-123')
      ).toBeInTheDocument();
    });

    it('should show placeholder for unimplemented steps', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(
          screen.getByText('This step is not yet implemented')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Skip to Next Step')).toBeInTheDocument();
    });
  });

  describe('Workflow State Management', () => {
    it('should save step progress when AI response is saved', async () => {
      const respondState = {
        ...mockWorkflowState,
        currentStep: 2,
      };
      v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(respondState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('ai-response-generator')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Response');
      await user.click(saveButton);

      expect(v2WorkflowOrchestrator.saveStepProgress).toHaveBeenCalledWith(
        'req-123',
        2,
        { response: { content: 'test response' } }
      );
    });

    it('should proceed to next step when response is sent', async () => {
      const respondState = {
        ...mockWorkflowState,
        currentStep: 2,
      };
      v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(respondState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('ai-response-generator')).toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send Response');
      await user.click(sendButton);

      expect(v2WorkflowOrchestrator.saveStepProgress).toHaveBeenCalledWith(
        'req-123',
        2,
        { response: { content: 'test response' }, sent: true }
      );

      expect(v2WorkflowOrchestrator.updateCurrentStep).toHaveBeenCalledWith(
        'req-123',
        3
      );
    });

    it('should validate steps before allowing progression', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        const infoAlert = screen.getByText(
          'Complete the current step to proceed to the next step.'
        );
        expect(infoAlert).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state when workflow fails to load', async () => {
      v2WorkflowOrchestrator.getWorkflowState.mockRejectedValue(
        new Error('Network error')
      );

      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load workflow state')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should provide retry functionality', async () => {
      v2WorkflowOrchestrator.getWorkflowState
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockWorkflowState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Police incident reports')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator while loading workflow state', () => {
      v2WorkflowOrchestrator.getWorkflowState.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve(mockWorkflowState), 1000)
          )
      );

      render(<V2WorkflowOrchestrator requestId='req-123' />);

      expect(screen.getByText('Loading workflow...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for stepper', async () => {
      render(<V2WorkflowOrchestrator requestId='req-123' />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Locate Records/)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation for step selection', async () => {
      const completedState = {
        ...mockWorkflowState,
        currentStep: 1,
        stepValidation: { 0: true, 1: false, 2: false, 3: false },
      };
      v2WorkflowOrchestrator.getWorkflowState.mockResolvedValue(completedState);

      render(<V2WorkflowOrchestrator requestId='req-123' />);
      const user = userEvent.setup();

      await waitFor(() => {
        const locateStep = screen.getByText('Locate Records');
        expect(locateStep).toBeInTheDocument();
      });

      const locateStep = screen.getByText('Locate Records');
      await user.type(locateStep, '{enter}');

      expect(v2WorkflowOrchestrator.updateCurrentStep).toHaveBeenCalled();
    });
  });
});
