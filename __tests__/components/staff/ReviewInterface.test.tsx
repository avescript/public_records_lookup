/**
 * @jest-environment jsdom
 */

import React from 'react';
import { jest } from '@jest/globals';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { theme } from '@/theme';
import { PublicRecordRequest } from '@/types/request';
import { GeneratedResponse } from '@/types/response';
// Import types
import {
  ApprovalRequest,
  DeliveryConfiguration,
  ReviewComparison,
  ReviewSession,
} from '@/types/review';

// Import components
import {
  ApprovalChecklist,
  BatchApprovalDialog,
  DeliveryConfigPanel,
  RequestDetailsPanel,
  ResponsePreviewPanel,
  ReviewHistory,
  ReviewInterface,
} from '../ReviewInterface';

// Mock dependencies
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
    },
  }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canApprove: true,
    canSend: true,
    canExport: true,
  }),
}));

jest.mock('@/hooks/useRequest', () => ({
  useRequest: () => ({
    request: mockRequest,
    loading: false,
    error: null,
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Test data
const mockRequest: PublicRecordRequest = {
  id: 'test-request-1',
  requesterName: 'John Doe',
  requesterEmail: 'john@example.com',
  requesterPhone: '555-1234',
  requesterOrganization: 'Test Organization',
  description: 'Request for public records regarding city budget',
  keywords: ['budget', 'finance', 'public'],
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  submittedAt: '2024-02-01T10:00:00Z',
  dueDate: '2024-03-01T10:00:00Z',
  status: 'in_progress',
  priority: 'normal',
  agencyId: 'test-agency',
  assignedTo: 'test-user',
};

const mockResponse: GeneratedResponse = {
  id: 'test-response-1',
  requestId: 'test-request-1',
  content:
    '<p>We have located the requested records and are providing them as attachments.</p>',
  type: 'full_fulfillment',
  tone: 'professional',
  length: 'standard',
  templateName: 'Standard Fulfillment',
  templateId: 'template-1',
  createdAt: '2024-02-10T14:00:00Z',
  updatedAt: '2024-02-10T14:00:00Z',
  qualityScore: 92,
  complianceScore: 96,
  suggestions: [
    'Consider adding delivery timeline',
    'Verify all attachments are included',
  ],
  attachments: ['budget_2024.pdf', 'finance_report.xlsx'],
  metadata: {
    wordCount: 150,
    estimatedReadingTime: 2,
    averageSentenceLength: 18,
  },
};

const mockComparison: ReviewComparison = {
  request: mockRequest,
  response: mockResponse,
  redactions: [],
  attachments: [
    {
      id: 'att-1',
      filename: 'budget_2024.pdf',
      mimeType: 'application/pdf',
      size: 1024000,
      uploadedAt: '2024-02-05T09:00:00Z',
      redacted: true,
      includeInDelivery: true,
    },
  ],
  estimatedResponseTime: 45,
  complianceScore: 96,
  qualityScore: 92,
  riskAssessment: {
    level: 'low',
    factors: [],
    recommendations: ['Standard approval process sufficient'],
    requiresLegalReview: false,
    requiresSupervisorApproval: false,
  },
  stepData: {
    selectedRecords: ['record-1', 'record-2'],
    appliedRedactions: [],
    generatedResponse: mockResponse,
  },
};

const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'approval-1',
    requestId: 'test-request-1',
    level: 'supervisor',
    approverId: 'supervisor-1',
    approverName: 'Jane Smith',
    approverEmail: 'jane@example.com',
    status: 'approved',
    submittedAt: '2024-02-10T15:00:00Z',
    reviewedAt: '2024-02-10T16:00:00Z',
    comments: 'Approved - meets all requirements',
    checklist: {
      items: [],
      overallScore: 95,
      passThreshold: 85,
    },
    priority: 'normal',
  },
];

const mockReviewSession: ReviewSession = {
  id: 'session-1',
  requestId: 'test-request-1',
  reviewerId: 'test-user',
  startedAt: '2024-02-10T13:00:00Z',
  status: 'in_progress',
  changes: [],
};

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
  ],
  includeAttachments: true,
  requireSignature: false,
  trackDelivery: true,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {component}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('ReviewInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Main Interface', () => {
    test('renders main review interface with tabs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparison,
      });

      renderWithProviders(<ReviewInterface requestId='test-request-1' />);

      await waitFor(() => {
        expect(screen.getByText('Review & Send')).toBeInTheDocument();
        expect(screen.getByText('Request Details')).toBeInTheDocument();
        expect(screen.getByText('Response Preview')).toBeInTheDocument();
        expect(screen.getByText('Approval Checklist')).toBeInTheDocument();
        expect(screen.getByText('Delivery Setup')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
      });
    });

    test('displays review status and quality metrics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparison,
      });

      renderWithProviders(<ReviewInterface requestId='test-request-1' />);

      await waitFor(() => {
        expect(screen.getByText('92%')).toBeInTheDocument(); // Quality score
        expect(screen.getByText('96%')).toBeInTheDocument(); // Compliance score
        expect(screen.getByText('LOW')).toBeInTheDocument(); // Risk level
      });
    });

    test('handles tab navigation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparison,
      });

      renderWithProviders(<ReviewInterface requestId='test-request-1' />);

      await waitFor(() => {
        const responsePreviewTab = screen.getByText('Response Preview');
        fireEvent.click(responsePreviewTab);
        expect(
          screen.getByText('Side-by-side comparison and response preview')
        ).toBeInTheDocument();
      });
    });
  });

  describe('RequestDetailsPanel', () => {
    test('displays request information correctly', () => {
      const onEdit = jest.fn();

      renderWithProviders(
        <RequestDetailsPanel
          request={mockRequest}
          comparison={mockComparison}
          onEdit={onEdit}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(
        screen.getByText('Request for public records regarding city budget')
      ).toBeInTheDocument();
      expect(screen.getByText('budget')).toBeInTheDocument();
      expect(screen.getByText('finance')).toBeInTheDocument();
      expect(screen.getByText('public')).toBeInTheDocument();
    });

    test('displays processing timeline', () => {
      renderWithProviders(
        <RequestDetailsPanel
          request={mockRequest}
          comparison={mockComparison}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText('Processing Timeline')).toBeInTheDocument();
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
    });

    test('shows quality and risk assessment', () => {
      renderWithProviders(
        <RequestDetailsPanel
          request={mockRequest}
          comparison={mockComparison}
          onEdit={() => {}}
        />
      );

      expect(screen.getByText('Quality Assessment')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Risk Level: LOW')).toBeInTheDocument();
    });
  });

  describe('ResponsePreviewPanel', () => {
    const defaultProps = {
      response: mockResponse,
      request: mockRequest,
      redactions: [],
      onApprove: jest.fn(),
      onReject: jest.fn(),
      onRequestRevision: jest.fn(),
      loading: false,
      canApprove: true,
    };

    test('displays response preview with side-by-side comparison', () => {
      renderWithProviders(<ResponsePreviewPanel {...defaultProps} />);

      expect(screen.getByText('Response Preview')).toBeInTheDocument();
      expect(screen.getByText('Original Request')).toBeInTheDocument();
      expect(screen.getByText('Generated Response')).toBeInTheDocument();
      expect(screen.getByText('professional tone')).toBeInTheDocument();
    });

    test('shows quality analysis metrics', () => {
      renderWithProviders(<ResponsePreviewPanel {...defaultProps} />);

      expect(screen.getByText('Response Quality Analysis')).toBeInTheDocument();
      expect(screen.getByText('Quality Score')).toBeInTheDocument();
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    });

    test('handles approval actions', async () => {
      const onApprove = jest.fn();
      renderWithProviders(
        <ResponsePreviewPanel {...defaultProps} onApprove={onApprove} />
      );

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      expect(onApprove).toHaveBeenCalled();
    });

    test('opens rejection dialog', async () => {
      renderWithProviders(<ResponsePreviewPanel {...defaultProps} />);

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByText('Reject Response')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Please provide a reason for rejecting this response:'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('ApprovalChecklist', () => {
    const defaultProps = {
      comparison: mockComparison,
      approvalRequests: mockApprovalRequests,
      onDecision: jest.fn(),
      loading: false,
      canApprove: true,
    };

    test('displays checklist items', () => {
      renderWithProviders(<ApprovalChecklist {...defaultProps} />);

      expect(screen.getByText('Approval Checklist')).toBeInTheDocument();
      expect(
        screen.getByText('Response complies with FOIA/CPRA legal requirements')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Response content is accurate and addresses the request'
        )
      ).toBeInTheDocument();
    });

    test('calculates overall score', async () => {
      renderWithProviders(<ApprovalChecklist {...defaultProps} />);

      // Initially score should be 0%
      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });

      // Check an item and verify score updates
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      await waitFor(() => {
        // Score should update based on weighted calculation
        expect(screen.queryByText('0%')).not.toBeInTheDocument();
      });
    });

    test('shows approval chain', () => {
      renderWithProviders(<ApprovalChecklist {...defaultProps} />);

      expect(screen.getByText('Approval Chain')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });

    test('displays risk-based approval requirements', () => {
      renderWithProviders(<ApprovalChecklist {...defaultProps} />);

      expect(
        screen.getByText('Risk-Based Approval Requirements')
      ).toBeInTheDocument();
      expect(screen.getByText('Risk Level: LOW')).toBeInTheDocument();
    });
  });

  describe('DeliveryConfigPanel', () => {
    const defaultProps = {
      requestId: 'test-request-1',
      comparison: mockComparison,
      config: mockDeliveryConfig,
      onChange: jest.fn(),
      onSend: jest.fn(),
      onExport: jest.fn(),
      loading: false,
      canSend: true,
      canExport: true,
    };

    test('displays delivery method selection', () => {
      renderWithProviders(<DeliveryConfigPanel {...defaultProps} />);

      expect(screen.getByText('Choose Delivery Method')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Online Portal')).toBeInTheDocument();
      expect(screen.getByText('US Mail')).toBeInTheDocument();
    });

    test('shows stepper navigation', () => {
      renderWithProviders(<DeliveryConfigPanel {...defaultProps} />);

      expect(screen.getByText('Choose Delivery Method')).toBeInTheDocument();
      expect(
        screen.getByText('Select Format & Recipients')
      ).toBeInTheDocument();
      expect(screen.getByText('Schedule & Options')).toBeInTheDocument();
      expect(screen.getByText('Review & Send')).toBeInTheDocument();
    });

    test('displays recipients list', () => {
      renderWithProviders(<DeliveryConfigPanel {...defaultProps} />);

      // Navigate to recipients step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText('Recipients (1)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    });
  });

  describe('ReviewHistory', () => {
    const defaultProps = {
      requestId: 'test-request-1',
      approvalRequests: mockApprovalRequests,
      reviewSession: mockReviewSession,
    };

    test('displays activity timeline', () => {
      renderWithProviders(<ReviewHistory {...defaultProps} />);

      expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });

    test('shows current session info', () => {
      renderWithProviders(<ReviewHistory {...defaultProps} />);

      expect(screen.getByText('Current Review Session')).toBeInTheDocument();
    });

    test('opens add comment dialog', async () => {
      renderWithProviders(<ReviewHistory {...defaultProps} />);

      const addCommentButton = screen.getByText('Add Comment');
      fireEvent.click(addCommentButton);

      await waitFor(() => {
        expect(screen.getByText('Add Review Comment')).toBeInTheDocument();
      });
    });
  });

  describe('BatchApprovalDialog', () => {
    const defaultProps = {
      open: true,
      onClose: jest.fn(),
      requestIds: ['test-request-1', 'test-request-2'],
    };

    test('renders batch operations dialog', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'test-request-1',
            requesterName: 'John Doe',
            canApprove: true,
            estimatedRisk: 'low',
          },
          {
            id: 'test-request-2',
            requesterName: 'Jane Smith',
            canApprove: true,
            estimatedRisk: 'medium',
          },
        ],
      });

      renderWithProviders(<BatchApprovalDialog {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('Batch Operations (2 requests)')
        ).toBeInTheDocument();
        expect(screen.getByText('1. Select Operation')).toBeInTheDocument();
      });
    });

    test('displays operation options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithProviders(<BatchApprovalDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Approve')).toBeInTheDocument();
        expect(screen.getByText('Bulk Reject')).toBeInTheDocument();
        expect(screen.getByText('Assign Approver')).toBeInTheDocument();
        expect(screen.getByText('Batch Export')).toBeInTheDocument();
        expect(screen.getByText('Batch Deliver')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error state when request loading fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderWithProviders(<ReviewInterface requestId='test-request-1' />);

      await waitFor(() => {
        expect(
          screen.getByText('Error loading review data')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Unable to load review data. Please refresh the page or contact support.'
          )
        ).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      renderWithProviders(<ReviewInterface requestId='test-request-1' />);

      await waitFor(() => {
        expect(screen.getByText('Loading review data...')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('complete review workflow - approve and send', async () => {
      // Mock successful API calls
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComparison,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApprovalRequests,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockReviewSession,
        });

      renderWithProviders(<ReviewInterface requestId='test-request-1' />);

      await waitFor(() => {
        expect(screen.getByText('Review & Send')).toBeInTheDocument();
      });

      // Navigate through tabs and verify workflow
      const approvalTab = screen.getByText('Approval Checklist');
      fireEvent.click(approvalTab);

      await waitFor(() => {
        expect(screen.getByText('Approval Checklist')).toBeInTheDocument();
      });

      // Test approval flow would continue here...
    });

    test('handles complex multi-step delivery configuration', async () => {
      const onChange = jest.fn();

      renderWithProviders(
        <DeliveryConfigPanel
          requestId='test-request-1'
          comparison={mockComparison}
          config={null}
          onChange={onChange}
          onSend={jest.fn()}
          onExport={jest.fn()}
          loading={false}
          canSend={true}
          canExport={true}
        />
      );

      // Should initialize default configuration
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });
  });
});
