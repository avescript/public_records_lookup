/**
 * Test file for V2 Workflow Page Component
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';

import WorkflowPage from '@/app/staff/workflow/[requestId]/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock V2WorkflowOrchestrator component
jest.mock('@/components/staff/V2WorkflowOrchestrator', () => ({
  V2WorkflowOrchestrator: ({ requestId, initialStep }: any) => (
    <div data-testid='v2-workflow-orchestrator'>
      <div>Request ID: {requestId}</div>
      <div>Initial Step: {initialStep}</div>
    </div>
  ),
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

describe('WorkflowPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders workflow page with valid request ID', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      expect(screen.getByText('Staff Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText('V2 Workflow - Request test-request-123')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('v2-workflow-orchestrator')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Request ID: test-request-123')
      ).toBeInTheDocument();
    });

    it('renders error when request ID is missing', () => {
      const props = {
        params: { requestId: '' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      expect(
        screen.getByText('Request ID is required to start the V2 workflow.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Return to Dashboard' })
      ).toBeInTheDocument();
    });

    it('handles initial step from search params', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: { step: '2' },
      };

      render(<WorkflowPage {...props} />);

      expect(screen.getByText('Initial Step: 2')).toBeInTheDocument();
    });

    it('handles array step param from search params', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: { step: ['1', '2'] },
      };

      render(<WorkflowPage {...props} />);

      expect(screen.getByText('Initial Step: 1')).toBeInTheDocument();
    });

    it('defaults to step 0 when no step param provided', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      expect(screen.getByText('Initial Step: 0')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders return to dashboard button', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      const returnButton = screen.getByRole('button', {
        name: 'Return to Dashboard',
      });
      expect(returnButton).toBeInTheDocument();
    });

    it('navigates back to staff dashboard when return button clicked', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      const returnButton = screen.getByRole('button', {
        name: 'Return to Dashboard',
      });
      fireEvent.click(returnButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/staff');
    });

    it('handles error state navigation', () => {
      const props = {
        params: { requestId: '' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      const returnButton = screen.getByRole('button', {
        name: 'Return to Dashboard',
      });
      fireEvent.click(returnButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/staff');
    });

    it('renders breadcrumb navigation correctly', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      const breadcrumbs = screen.getByLabelText('breadcrumb');
      expect(breadcrumbs).toBeInTheDocument();

      const staffLink = screen.getByRole('link', { name: /Staff Dashboard/ });
      expect(staffLink).toHaveAttribute('href', '/staff');
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct container styling', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      const mainContainer = screen.getByTestId(
        'v2-workflow-orchestrator'
      ).parentElement;
      expect(mainContainer).toHaveClass('MuiContainer-root');
    });

    it('renders with proper page structure', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: {},
      };

      const { container } = render(<WorkflowPage {...props} />);

      // Check for main page wrapper
      const pageWrapper = container
        .querySelector('[data-testid]')
        ?.closest('.MuiBox-root');
      expect(pageWrapper).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('handles undefined search params gracefully', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: undefined,
      };

      expect(() => render(<WorkflowPage {...props} />)).not.toThrow();
      expect(screen.getByText('Initial Step: 0')).toBeInTheDocument();
    });

    it('handles invalid step parameter gracefully', () => {
      const props = {
        params: { requestId: 'test-request-123' },
        searchParams: { step: 'invalid' },
      };

      render(<WorkflowPage {...props} />);

      // Should default to 0 when parseInt returns NaN
      expect(screen.getByText('Initial Step: 0')).toBeInTheDocument();
    });

    it('passes correct props to V2WorkflowOrchestrator', () => {
      const props = {
        params: { requestId: 'workflow-test-456' },
        searchParams: { step: '3' },
      };

      render(<WorkflowPage {...props} />);

      expect(
        screen.getByText('Request ID: workflow-test-456')
      ).toBeInTheDocument();
      expect(screen.getByText('Initial Step: 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message for empty request ID', () => {
      const props = {
        params: { requestId: '' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(
        screen.getByText('Request ID is required to start the V2 workflow.')
      ).toBeInTheDocument();
    });

    it('does not render workflow orchestrator when request ID is missing', () => {
      const props = {
        params: { requestId: '' },
        searchParams: {},
      };

      render(<WorkflowPage {...props} />);

      expect(
        screen.queryByTestId('v2-workflow-orchestrator')
      ).not.toBeInTheDocument();
    });
  });
});
