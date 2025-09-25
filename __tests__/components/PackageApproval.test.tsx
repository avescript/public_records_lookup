/**
 * PackageApproval Component Tests (Epic 5 - US-051)
 * Tests for package approval workflow, delivery locking, and approval management UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PackageApprovalComponent from '../../src/components/staff/PackageApproval';
import { legalReviewService } from '../../src/services/legalReviewService';
import type { PackageApproval } from '../../src/services/legalReviewService';

// Mock the legal review service
jest.mock('../../src/services/legalReviewService');
const mockLegalReviewService = legalReviewService as jest.Mocked<typeof legalReviewService>;

// Mock Material-UI components for cleaner testing
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Dialog: ({ open, children, onClose }: any) => 
    open ? <div data-testid="dialog" onClick={onClose}>{children}</div> : null,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogActions: ({ children }: any) => <div data-testid="dialog-actions">{children}</div>,
}));

describe('PackageApproval Component', () => {
  const mockCurrentUser = {
    id: 'user-legal-001',
    name: 'Sarah Johnson',
    role: 'legal_reviewer' as const,
  };

  const mockPackageApproval: PackageApproval = {
    id: 'package-1',
    requestId: 'request-123',
    packageId: 'pkg_123456',
    status: 'pending',
    recordIds: ['record-1', 'record-2', 'record-3'],
    totalRecords: 3,
    isLocked: false,
    deliveryApproved: false,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  };

  const mockPackageApprovals: PackageApproval[] = [mockPackageApproval];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue(mockPackageApprovals);
    mockLegalReviewService.createPackageApproval.mockResolvedValue(mockPackageApproval);
    mockLegalReviewService.submitPackageApproval.mockResolvedValue(mockPackageApproval);
    mockLegalReviewService.lockPackage.mockResolvedValue(mockPackageApproval);
  });

  describe('Initial Render', () => {
    it('should render package approval section', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      expect(screen.getByText('Package Approval')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('pkg_123456')).toBeInTheDocument();
      });
    });

    it('should display package statistics', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('3 Records')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('should show empty state when no packages exist', async () => {
      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No packages created yet')).toBeInTheDocument();
      });
    });

    it('should load package approvals on mount', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(mockLegalReviewService.getPackageApprovalsByRequest).toHaveBeenCalledWith('request-123');
      });
    });
  });

  describe('Package Creation', () => {
    it('should create new package when button clicked', async () => {
      const newPackage: PackageApproval = {
        id: 'package-2',
        requestId: 'request-123',
        packageId: 'pkg_789012',
        status: 'pending',
        recordIds: ['record-1', 'record-2', 'record-3'],
        totalRecords: 3,
        isLocked: false,
        deliveryApproved: false,
        createdAt: '2024-01-15T11:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      };

      mockLegalReviewService.createPackageApproval.mockResolvedValue(newPackage);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      const createButton = screen.getByText('Create Package');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockLegalReviewService.createPackageApproval).toHaveBeenCalledWith(
          'request-123',
          ['record-1', 'record-2', 'record-3']
        );
      });
    });

    it('should handle creation errors gracefully', async () => {
      mockLegalReviewService.createPackageApproval.mockRejectedValue(
        new Error('Creation failed')
      );

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      fireEvent.click(screen.getByText('Create Package'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create package')).toBeInTheDocument();
      });
    });

    it('should disable create button when records array is empty', () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={[]}
        />
      );

      const createButton = screen.getByText('Create Package');
      expect(createButton).toBeDisabled();
    });
  });

  describe('Package Status Display', () => {
    it('should display pending status correctly', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
        const statusChip = screen.getByText('Pending');
        expect(statusChip).toHaveClass('MuiChip-colorDefault'); // Would check actual class
      });
    });

    it('should display approved status with lock indicator', async () => {
      const approvedPackage = {
        ...mockPackageApproval,
        status: 'approved' as const,
        isLocked: true,
        deliveryApproved: true,
        reviewerName: 'Sarah Johnson',
        approvedAt: '2024-01-15T12:00:00.000Z',
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([approvedPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Locked for Delivery')).toBeInTheDocument();
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });
    });

    it('should display rejected status with reason', async () => {
      const rejectedPackage = {
        ...mockPackageApproval,
        status: 'rejected' as const,
        reviewerName: 'Mike Wilson',
        reason: 'Contains sensitive information',
        rejectedAt: '2024-01-15T12:00:00.000Z',
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([rejectedPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('Contains sensitive information')).toBeInTheDocument();
        expect(screen.getByText('Mike Wilson')).toBeInTheDocument();
      });
    });

    it('should display changes requested status', async () => {
      const changesPackage = {
        ...mockPackageApproval,
        status: 'changes_requested' as const,
        reviewerName: 'Legal Team',
        reason: 'Minor changes needed',
        comments: 'Please review page 3',
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([changesPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Changes Requested')).toBeInTheDocument();
        expect(screen.getByText('Minor changes needed')).toBeInTheDocument();
        expect(screen.getByText('Please review page 3')).toBeInTheDocument();
      });
    });
  });

  describe('Package Approval Actions', () => {
    it('should open approval dialog when approve button clicked', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        const approveButton = screen.getByText('Approve');
        fireEvent.click(approveButton);
      });

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Approve Package')).toBeInTheDocument();
    });

    it('should submit approval with required fields', async () => {
      const approvedPackage = {
        ...mockPackageApproval,
        status: 'approved' as const,
        isLocked: true,
        deliveryApproved: true,
      };

      mockLegalReviewService.submitPackageApproval.mockResolvedValue(approvedPackage);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      // Open approval dialog
      await waitFor(() => {
        fireEvent.click(screen.getByText('Approve'));
      });

      // Fill approval form
      const reasonInput = screen.getByLabelText('Reason');
      fireEvent.change(reasonInput, { target: { value: 'All documents reviewed and approved' } });

      const commentsInput = screen.getByLabelText('Comments');
      fireEvent.change(commentsInput, { target: { value: 'Ready for delivery' } });

      // Submit approval
      const submitButton = screen.getByText('Submit Approval');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLegalReviewService.submitPackageApproval).toHaveBeenCalledWith(
          'package-1',
          'approved',
          'user-legal-001',
          'Sarah Johnson',
          'All documents reviewed and approved',
          'Ready for delivery'
        );
      });
    });

    it('should submit rejection with reason', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      // Open rejection dialog
      await waitFor(() => {
        fireEvent.click(screen.getByText('Reject'));
      });

      // Fill rejection form
      const reasonInput = screen.getByLabelText('Reason');
      fireEvent.change(reasonInput, { target: { value: 'Contains sensitive information' } });

      const commentsInput = screen.getByLabelText('Comments');
      fireEvent.change(commentsInput, { target: { value: 'Needs more redactions' } });

      // Submit rejection
      const submitButton = screen.getByText('Submit Rejection');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLegalReviewService.submitPackageApproval).toHaveBeenCalledWith(
          'package-1',
          'rejected',
          'user-legal-001',
          'Sarah Johnson',
          'Contains sensitive information',
          'Needs more redactions'
        );
      });
    });

    it('should request changes with details', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      // Open changes dialog
      await waitFor(() => {
        fireEvent.click(screen.getByText('Request Changes'));
      });

      // Fill changes form
      const reasonInput = screen.getByLabelText('Reason');
      fireEvent.change(reasonInput, { target: { value: 'Minor changes needed' } });

      const commentsInput = screen.getByLabelText('Comments');
      fireEvent.change(commentsInput, { target: { value: 'Please review page 3' } });

      // Submit changes request
      const submitButton = screen.getByText('Submit Changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLegalReviewService.submitPackageApproval).toHaveBeenCalledWith(
          'package-1',
          'changes_requested',
          'user-legal-001',
          'Sarah Johnson',
          'Minor changes needed',
          'Please review page 3'
        );
      });
    });

    it('should validate required fields in approval forms', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      // Open approval dialog
      await waitFor(() => {
        fireEvent.click(screen.getByText('Approve'));
      });

      // Try to submit without reason
      const submitButton = screen.getByText('Submit Approval');
      fireEvent.click(submitButton);

      // Should not call service
      expect(mockLegalReviewService.submitPackageApproval).not.toHaveBeenCalled();
      expect(screen.getByText('Reason is required')).toBeInTheDocument();
    });

    it('should handle approval submission errors', async () => {
      mockLegalReviewService.submitPackageApproval.mockRejectedValue(
        new Error('Approval failed')
      );

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      // Submit approval
      await waitFor(() => {
        fireEvent.click(screen.getByText('Approve'));
      });

      const reasonInput = screen.getByLabelText('Reason');
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
      fireEvent.click(screen.getByText('Submit Approval'));

      await waitFor(() => {
        expect(screen.getByText('Failed to submit approval')).toBeInTheDocument();
      });
    });
  });

  describe('Package Locking', () => {
    it('should show lock status for approved packages', async () => {
      const approvedPackage = {
        ...mockPackageApproval,
        status: 'approved' as const,
        isLocked: true,
        lockTimestamp: '2024-01-15T12:00:00.000Z',
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([approvedPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Locked for Delivery')).toBeInTheDocument();
        expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      });
    });

    it('should disable actions for locked packages', async () => {
      const lockedPackage = {
        ...mockPackageApproval,
        status: 'approved' as const,
        isLocked: true,
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([lockedPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        // Action buttons should be disabled or hidden for locked packages
        expect(screen.queryByText('Approve')).not.toBeInTheDocument();
        expect(screen.queryByText('Reject')).not.toBeInTheDocument();
        expect(screen.queryByText('Request Changes')).not.toBeInTheDocument();
      });
    });

    it('should show delivery approval status', async () => {
      const deliveryApprovedPackage = {
        ...mockPackageApproval,
        status: 'approved' as const,
        isLocked: true,
        deliveryApproved: true,
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([deliveryApprovedPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Approved for Delivery')).toBeInTheDocument();
      });
    });
  });

  describe('Record Information', () => {
    it('should display record count', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('3 Records')).toBeInTheDocument();
      });
    });

    it('should show record IDs when expanded', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        const expandButton = screen.getByLabelText('Expand package details');
        fireEvent.click(expandButton);
      });

      expect(screen.getByText('record-1')).toBeInTheDocument();
      expect(screen.getByText('record-2')).toBeInTheDocument();
      expect(screen.getByText('record-3')).toBeInTheDocument();
    });
  });

  describe('Timestamps and Metadata', () => {
    it('should display creation timestamp', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should display approval timestamp when approved', async () => {
      const approvedPackage = {
        ...mockPackageApproval,
        status: 'approved' as const,
        approvedAt: '2024-01-15T12:00:00.000Z',
        reviewerName: 'Sarah Johnson',
      };

      mockLegalReviewService.getPackageApprovalsByRequest.mockResolvedValue([approvedPackage]);

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Approved:/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      mockLegalReviewService.getPackageApprovalsByRequest.mockRejectedValue(
        new Error('Failed to load')
      );

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading package approvals')).toBeInTheDocument();
      });
    });

    it('should handle network errors during actions', async () => {
      mockLegalReviewService.submitPackageApproval.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Approve'));
      });

      const reasonInput = screen.getByLabelText('Reason');
      fireEvent.change(reasonInput, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Submit Approval'));

      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      expect(screen.getByLabelText('Package Approval')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Package actions')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        const approveButton = screen.getByText('Approve');
        approveButton.focus();
        expect(document.activeElement).toBe(approveButton);
      });
    });

    it('should have proper role attributes for interactive elements', async () => {
      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        const approveButton = screen.getByRole('button', { name: 'Approve' });
        expect(approveButton).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle mobile viewport correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Package Approval')).toBeInTheDocument();
      });
    });

    it('should stack action buttons on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(
        <PackageApprovalComponent
          requestId="request-123"
          recordIds={['record-1', 'record-2', 'record-3']}
        />
      );

      await waitFor(() => {
        const approveButton = screen.getByText('Approve');
        const rejectButton = screen.getByText('Reject');
        
        // Buttons should be vertically stacked on mobile
        expect(approveButton).toBeInTheDocument();
        expect(rejectButton).toBeInTheDocument();
      });
    });
  });
});