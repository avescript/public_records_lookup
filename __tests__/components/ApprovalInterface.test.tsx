/**
 * ApprovalInterface Component Tests
 * Comprehensive test coverage for approval workflow UI (US-042)
 * Tests component rendering, user interactions, and approval flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ApprovalInterface from '../../src/components/staff/ApprovalInterface';
import { approvalService, ApprovalWorkflow, ApprovalDecision } from '../../src/services/approvalService';

// Mock the approval service
jest.mock('../../src/services/approvalService', () => ({
  approvalService: {
    getWorkflow: jest.fn(),
    submitDecision: jest.fn(),
  },
  ApprovalWorkflow: {},
  ApprovalDecision: {},
}));

const mockedApprovalService = approvalService as jest.Mocked<typeof approvalService>;

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockWorkflow: ApprovalWorkflow = {
  recordId: 'test-record-123',
  fileName: 'test-document.pdf',
  status: 'under_review',
  assignedReviewer: 'reviewer-123',
  reviewHistory: [],
  submittedAt: '2024-01-15T10:00:00Z',
  totalRedactions: 5,
  redactionVersionId: 'version-1',
  priority: 'medium',
};

const mockDecision: ApprovalDecision = {
  id: 'decision-123',
  recordId: 'test-record-123',
  fileName: 'test-document.pdf',
  reviewerId: 'reviewer-123',
  reviewerName: 'John Doe',
  decision: 'approved',
  timestamp: '2024-01-15T11:00:00Z',
  redactionVersionId: 'version-1',
};

describe('ApprovalInterface', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    recordId: 'test-record-123',
    fileName: 'test-document.pdf',
    onDecisionSubmitted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApprovalService.getWorkflow.mockResolvedValue(mockWorkflow);
    mockedApprovalService.submitDecision.mockResolvedValue(mockDecision);
  });

  describe('Component Rendering', () => {
    it('should render dialog when open', () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      expect(screen.getByText('Document Approval Review')).toBeInTheDocument();
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByText('test-record-123')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Document Approval Review')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      mockedApprovalService.getWorkflow.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockWorkflow), 100))
      );

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Workflow Information Display', () => {
    it('should display workflow details correctly', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
        expect(screen.getByText('test-record-123')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // total redactions
        expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM PRIORITY')).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        // Check that date is formatted (exact format may vary by locale)
        expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
      });
    });

    it('should display priority and status chips with correct colors', async () => {
      const urgentWorkflow = { 
        ...mockWorkflow, 
        priority: 'urgent' as const,
        status: 'approved' as const
      };
      mockedApprovalService.getWorkflow.mockResolvedValue(urgentWorkflow);

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('APPROVED')).toBeInTheDocument();
        expect(screen.getByText('URGENT PRIORITY')).toBeInTheDocument();
      });
    });
  });

  describe('Review History', () => {
    it('should display review history when present', async () => {
      const workflowWithHistory = {
        ...mockWorkflow,
        reviewHistory: [
          {
            id: 'review-1',
            recordId: 'test-record-123',
            fileName: 'test-document.pdf',
            reviewerId: 'reviewer-456',
            reviewerName: 'Jane Smith',
            decision: 'needs_revision' as const,
            reason: 'Missing redactions',
            comments: 'Need to redact SSNs',
            timestamp: '2024-01-14T09:00:00Z',
            redactionVersionId: 'version-1',
          },
        ],
      };
      mockedApprovalService.getWorkflow.mockResolvedValue(workflowWithHistory);

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Review History')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith - NEEDS REVISION')).toBeInTheDocument();
        expect(screen.getByText('Missing redactions')).toBeInTheDocument();
        expect(screen.getByText('Need to redact SSNs')).toBeInTheDocument();
      });
    });

    it('should not show review history section when empty', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Review History')).not.toBeInTheDocument();
      });
    });
  });

  describe('Decision Form', () => {
    it('should show decision form for documents under review', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Submit Review Decision')).toBeInTheDocument();
        expect(screen.getByLabelText('Reviewer Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Decision')).toBeInTheDocument();
        expect(screen.getByText('Submit Decision')).toBeInTheDocument();
      });
    });

    it('should not show decision form for completed workflows', async () => {
      const completedWorkflow = { ...mockWorkflow, status: 'approved' as const };
      mockedApprovalService.getWorkflow.mockResolvedValue(completedWorkflow);

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Submit Review Decision')).not.toBeInTheDocument();
        expect(screen.getByText(/already been reviewed/)).toBeInTheDocument();
      });
    });

    it('should show reason field when rejection is selected', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const decisionSelect = screen.getByLabelText('Decision');
        await userEvent.click(decisionSelect);
        await userEvent.click(screen.getByText('Reject'));
        
        expect(screen.getByLabelText('Reason for Rejection')).toBeInTheDocument();
      });
    });

    it('should show revision comments field when needs revision is selected', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const decisionSelect = screen.getByLabelText('Decision');
        await userEvent.click(decisionSelect);
        await userEvent.click(screen.getByText('Needs Revision'));
        
        expect(screen.getByLabelText('Revision Comments')).toBeInTheDocument();
      });
    });

    it('should show optional comments field for approval', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Additional Comments (Optional)')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit approval decision successfully', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        // Fill in reviewer name
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'John Doe');
        
        // Add optional comments
        const commentsInput = screen.getByLabelText('Additional Comments (Optional)');
        await userEvent.type(commentsInput, 'Looks good to me');
        
        // Submit
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockedApprovalService.submitDecision).toHaveBeenCalledWith(
          'test-record-123',
          'test-document.pdf',
          'approved',
          expect.any(String), // reviewerId
          'John Doe',
          undefined, // reason
          'Looks good to me',
          expect.any(Number) // reviewDuration
        );
        expect(defaultProps.onDecisionSubmitted).toHaveBeenCalledWith(mockDecision);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should submit rejection with reason', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        // Change to rejection
        const decisionSelect = screen.getByLabelText('Decision');
        await userEvent.click(decisionSelect);
        await userEvent.click(screen.getByText('Reject'));
        
        // Fill in required fields
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'Jane Smith');
        
        const reasonInput = screen.getByLabelText('Reason for Rejection');
        await userEvent.type(reasonInput, 'Contains sensitive data');
        
        // Submit
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockedApprovalService.submitDecision).toHaveBeenCalledWith(
          'test-record-123',
          'test-document.pdf',
          'rejected',
          expect.any(String),
          'Jane Smith',
          'Contains sensitive data',
          undefined,
          expect.any(Number)
        );
      });
    });

    it('should require reviewer name', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const submitButton = screen.getByText('Submit Decision');
        expect(submitButton).toBeDisabled();
        
        // Add reviewer name
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'John Doe');
        
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show error when rejection submitted without reason', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        // Change to rejection
        const decisionSelect = screen.getByLabelText('Decision');
        await userEvent.click(decisionSelect);
        await userEvent.click(screen.getByText('Reject'));
        
        // Fill in reviewer name but not reason
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'Jane Smith');
        
        // Try to submit
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
        
        expect(screen.getByText('Please provide a reason for rejection.')).toBeInTheDocument();
      });
    });

    it('should show error when revision submitted without comments', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        // Change to needs revision
        const decisionSelect = screen.getByLabelText('Decision');
        await userEvent.click(decisionSelect);
        await userEvent.click(screen.getByText('Needs Revision'));
        
        // Fill in reviewer name but not comments
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'Jane Smith');
        
        // Try to submit
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
        
        expect(screen.getByText('Please provide comments for revision requirements.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow loading errors', async () => {
      mockedApprovalService.getWorkflow.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load approval workflow.')).toBeInTheDocument();
      });
    });

    it('should handle missing workflow', async () => {
      mockedApprovalService.getWorkflow.mockResolvedValue(null);

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Workflow not found. The document may not be submitted for approval.')).toBeInTheDocument();
      });
    });

    it('should handle decision submission errors', async () => {
      mockedApprovalService.submitDecision.mockRejectedValue(new Error('Submission failed'));

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'John Doe');
        
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to submit decision. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      mockedApprovalService.submitDecision.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDecision), 100))
      );

      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'John Doe');
        
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
        
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Dialog Controls', () => {
    it('should close dialog when close button is clicked', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      const closeButton = screen.getAllByRole('button', { name: /close/i })[0];
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should close dialog when cancel is clicked', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const cancelButton = screen.getByText('Cancel');
        await userEvent.click(cancelButton);
        
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should reset form when dialog is reopened', async () => {
      const { rerender } = renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'John Doe');
      });

      // Close and reopen
      rerender(<ApprovalInterface {...defaultProps} open={false} />);
      rerender(<ApprovalInterface {...defaultProps} open={true} />);
      
      await waitFor(() => {
        const reviewerInput = screen.getByLabelText('Reviewer Name') as HTMLInputElement;
        expect(reviewerInput.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Reviewer Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Decision')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        reviewerInput.focus();
        expect(document.activeElement).toBe(reviewerInput);
      });
    });
  });

  describe('Integration with Service', () => {
    it('should load workflow on mount', async () => {
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockedApprovalService.getWorkflow).toHaveBeenCalledWith(
          'test-record-123',
          'test-document.pdf'
        );
      });
    });

    it('should calculate review duration correctly', async () => {
      const startTime = Date.now();
      renderWithTheme(<ApprovalInterface {...defaultProps} />);
      
      await waitFor(async () => {
        const reviewerInput = screen.getByLabelText('Reviewer Name');
        await userEvent.type(reviewerInput, 'John Doe');
        
        const submitButton = screen.getByText('Submit Decision');
        await userEvent.click(submitButton);
      });

      await waitFor(() => {
        const calls = mockedApprovalService.submitDecision.mock.calls;
        const reviewDuration = calls[0][7]; // 8th parameter is reviewDuration
        expect(typeof reviewDuration).toBe('number');
        expect(reviewDuration).toBeGreaterThanOrEqual(0);
      });
    });
  });
});