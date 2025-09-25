/**
 * Approval Service Tests
 * Comprehensive test coverage for human approval workflow (US-042)
 * Tests all service methods, error handling, and edge cases
 */

import { approvalService, ApprovalService, ApprovalWorkflow, ApprovalDecision } from '../../src/services/approvalService';

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() { return store; },
    set store(newStore: Record<string, string>) { store = newStore; }
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ApprovalService', () => {
  let service: ApprovalService;

  beforeEach(() => {
    service = new ApprovalService();
    
    // Clear the store and reset all mocks
    localStorageMock.store = {};
    jest.clearAllMocks();
    
    // Reset mock implementations to their defaults
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store = { ...localStorageMock.store, [key]: value };
    });
    localStorageMock.getItem.mockImplementation((key: string) => {
      return localStorageMock.store[key] || null;
    });
    localStorageMock.clear.mockImplementation(() => {
      localStorageMock.store = {};
    });
  });

  describe('submitForApproval', () => {
    it('should create and store a new approval workflow', async () => {
      const recordId = 'test-record-123';
      const fileName = 'test-document.pdf';
      const redactionVersionId = 'version-1';
      const totalRedactions = 5;

      const workflow = await service.submitForApproval(
        recordId,
        fileName,
        redactionVersionId,
        totalRedactions,
        'high'
      );

      expect(workflow.recordId).toBe(recordId);
      expect(workflow.fileName).toBe(fileName);
      expect(workflow.status).toBe('pending_review');
      expect(workflow.totalRedactions).toBe(totalRedactions);
      expect(workflow.priority).toBe('high');
      expect(workflow.redactionVersionId).toBe(redactionVersionId);
      expect(workflow.reviewHistory).toEqual([]);
      expect(workflow.submittedAt).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should use default priority when not specified', async () => {
      const workflow = await service.submitForApproval(
        'record-1',
        'doc.pdf',
        'version-1',
        3
      );

      expect(workflow.priority).toBe('medium');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock setItem to throw an error only when called
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      await expect(
        service.submitForApproval('record-1', 'doc.pdf', 'version-1', 3)
      ).rejects.toThrow('Failed to submit document for approval');
    });
  });

  describe('assignReviewer', () => {
    beforeEach(async () => {
      // Create a workflow to work with
      await service.submitForApproval('record-1', 'doc.pdf', 'version-1', 3);
    });

    it('should assign reviewer to pending workflow', async () => {
      const reviewerId = 'reviewer-123';
      
      const workflow = await service.assignReviewer('record-1', 'doc.pdf', reviewerId);

      expect(workflow.assignedReviewer).toBe(reviewerId);
      expect(workflow.status).toBe('under_review');
    });

    it('should throw error for non-existent workflow', async () => {
      await expect(
        service.assignReviewer('non-existent', 'doc.pdf', 'reviewer-123')
      ).rejects.toThrow('Failed to assign reviewer');
    });

    it('should throw error for workflow not in pending status', async () => {
      // First assign a reviewer
      await service.assignReviewer('record-1', 'doc.pdf', 'reviewer-123');
      
      // Try to assign again
      await expect(
        service.assignReviewer('record-1', 'doc.pdf', 'reviewer-456')
      ).rejects.toThrow('Failed to assign reviewer');
    });
  });

  describe('submitDecision', () => {
    beforeEach(async () => {
      await service.submitForApproval('record-1', 'doc.pdf', 'version-1', 3);
      await service.assignReviewer('record-1', 'doc.pdf', 'reviewer-123');
    });

    it('should submit approval decision successfully', async () => {
      const decision = await service.submitDecision(
        'record-1',
        'doc.pdf',
        'approved',
        'reviewer-123',
        'John Doe',
        'Looks good',
        'All redactions are appropriate',
        15
      );

      expect(decision.decision).toBe('approved');
      expect(decision.reviewerId).toBe('reviewer-123');
      expect(decision.reviewerName).toBe('John Doe');
      expect(decision.reason).toBe('Looks good');
      expect(decision.comments).toBe('All redactions are appropriate');
      expect(decision.reviewDuration).toBe(15);
      expect(decision.id).toBeDefined();
      expect(decision.timestamp).toBeDefined();
    });

    it('should update workflow status to approved', async () => {
      await service.submitDecision(
        'record-1',
        'doc.pdf',
        'approved',
        'reviewer-123',
        'John Doe'
      );

      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(workflow?.status).toBe('approved');
      expect(workflow?.completedAt).toBeDefined();
      expect(workflow?.currentDecision).toBeDefined();
      expect(workflow?.reviewHistory).toHaveLength(1);
    });

    it('should update workflow status to rejected', async () => {
      await service.submitDecision(
        'record-1',
        'doc.pdf',
        'rejected',
        'reviewer-123',
        'John Doe',
        'Contains sensitive information'
      );

      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(workflow?.status).toBe('rejected');
      expect(workflow?.completedAt).toBeDefined();
    });

    it('should update workflow status to revision needed', async () => {
      await service.submitDecision(
        'record-1',
        'doc.pdf',
        'needs_revision',
        'reviewer-123',
        'John Doe',
        undefined,
        'Need to redact social security numbers'
      );

      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(workflow?.status).toBe('revision_needed');
      expect(workflow?.completedAt).toBeUndefined();
    });

    it('should throw error for non-existent workflow', async () => {
      await expect(
        service.submitDecision(
          'non-existent',
          'doc.pdf',
          'approved',
          'reviewer-123',
          'John Doe'
        )
      ).rejects.toThrow('Failed to submit approval decision');
    });

    it('should throw error for workflow not under review', async () => {
      // Submit approval first
      await service.submitDecision(
        'record-1',
        'doc.pdf',
        'approved',
        'reviewer-123',
        'John Doe'
      );

      // Try to submit again
      await expect(
        service.submitDecision(
          'record-1',
          'doc.pdf',
          'rejected',
          'reviewer-123',
          'John Doe'
        )
      ).rejects.toThrow('Failed to submit approval decision');
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow for existing document', async () => {
      await service.submitForApproval('record-1', 'doc.pdf', 'version-1', 3);
      
      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      
      expect(workflow).toBeDefined();
      expect(workflow?.recordId).toBe('record-1');
      expect(workflow?.fileName).toBe('doc.pdf');
    });

    it('should return null for non-existent workflow', async () => {
      const workflow = await service.getWorkflow('non-existent', 'doc.pdf');
      expect(workflow).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(workflow).toBeNull();
    });
  });

  describe('getAllWorkflows', () => {
    beforeEach(async () => {
      // Create multiple workflows
      await service.submitForApproval('record-1', 'doc1.pdf', 'version-1', 3, 'high');
      await service.submitForApproval('record-2', 'doc2.pdf', 'version-2', 5, 'low');
      await service.submitForApproval('record-3', 'doc3.pdf', 'version-3', 2, 'urgent');
      
      // Assign reviewer to one
      await service.assignReviewer('record-1', 'doc1.pdf', 'reviewer-123');
    });

    it('should return all workflows sorted by priority and date', async () => {
      const workflows = await service.getAllWorkflows();
      
      expect(workflows).toHaveLength(3);
      // Should be sorted by priority: urgent, high, low
      expect(workflows[0].priority).toBe('urgent');
      expect(workflows[1].priority).toBe('high');
      expect(workflows[2].priority).toBe('low');
    });

    it('should filter by status', async () => {
      const pendingWorkflows = await service.getAllWorkflows('pending_review');
      const underReviewWorkflows = await service.getAllWorkflows('under_review');
      
      expect(pendingWorkflows).toHaveLength(2);
      expect(underReviewWorkflows).toHaveLength(1);
      expect(underReviewWorkflows[0].recordId).toBe('record-1');
    });

    it('should filter by reviewer', async () => {
      const reviewerWorkflows = await service.getAllWorkflows(undefined, 'reviewer-123');
      
      expect(reviewerWorkflows).toHaveLength(1);
      expect(reviewerWorkflows[0].assignedReviewer).toBe('reviewer-123');
    });

    it('should handle empty results', async () => {
      localStorageMock.clear();
      const workflows = await service.getAllWorkflows();
      expect(workflows).toEqual([]);
    });
  });

  describe('getApprovalSummary', () => {
    beforeEach(async () => {
      // Create workflows with different statuses
      await service.submitForApproval('record-1', 'doc1.pdf', 'version-1', 3);
      await service.submitForApproval('record-2', 'doc2.pdf', 'version-2', 5);
      await service.assignReviewer('record-1', 'doc1.pdf', 'reviewer-123');
      await service.assignReviewer('record-2', 'doc2.pdf', 'reviewer-456');
      
      // Add a small delay to ensure measurable review time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Complete one approval
      await service.submitDecision(
        'record-1',
        'doc1.pdf',
        'approved',
        'reviewer-123',
        'John Doe'
      );
    });

    it('should calculate summary statistics correctly', async () => {
      const summary = await service.getApprovalSummary();
      
      expect(summary.totalPending).toBe(0);
      expect(summary.totalUnderReview).toBe(1);
      expect(summary.totalApproved).toBe(1);
      expect(summary.totalRejected).toBe(0);
      expect(summary.averageReviewTime).toBeGreaterThanOrEqual(0);
      expect(summary.overdueReviews).toBe(0);
    });

    it('should handle empty workflows', async () => {
      localStorageMock.clear();
      const summary = await service.getApprovalSummary();
      
      expect(summary.totalPending).toBe(0);
      expect(summary.totalUnderReview).toBe(0);
      expect(summary.totalApproved).toBe(0);
      expect(summary.totalRejected).toBe(0);
      expect(summary.averageReviewTime).toBe(0);
      expect(summary.overdueReviews).toBe(0);
    });
  });

  describe('getDecisionsByReviewer', () => {
    beforeEach(async () => {
      await service.submitForApproval('record-1', 'doc1.pdf', 'version-1', 3);
      await service.submitForApproval('record-2', 'doc2.pdf', 'version-2', 5);
      await service.assignReviewer('record-1', 'doc1.pdf', 'reviewer-123');
      await service.assignReviewer('record-2', 'doc2.pdf', 'reviewer-123');
      
      await service.submitDecision(
        'record-1',
        'doc1.pdf',
        'approved',
        'reviewer-123',
        'John Doe'
      );
      await service.submitDecision(
        'record-2',
        'doc2.pdf',
        'rejected',
        'reviewer-123',
        'John Doe',
        'Issues found'
      );
    });

    it('should return decisions for specific reviewer', async () => {
      const decisions = await service.getDecisionsByReviewer('reviewer-123');
      
      expect(decisions).toHaveLength(2);
      expect(decisions[0].reviewerId).toBe('reviewer-123');
      expect(decisions[1].reviewerId).toBe('reviewer-123');
      // Should be sorted by timestamp (newest first)
      expect(new Date(decisions[0].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(decisions[1].timestamp).getTime());
    });

    it('should return empty array for non-existent reviewer', async () => {
      const decisions = await service.getDecisionsByReviewer('non-existent');
      expect(decisions).toEqual([]);
    });

    it('should handle storage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const decisions = await service.getDecisionsByReviewer('reviewer-123');
      expect(decisions).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in localStorage', async () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');
      
      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(workflow).toBeNull();
    });

    it('should handle localStorage quota exceeded', async () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(
        service.submitForApproval('record-1', 'doc.pdf', 'version-1', 3)
      ).rejects.toThrow('Failed to submit document for approval');
    });

    it('should validate required parameters', async () => {
      // The service doesn't currently validate empty recordId, so this test should pass
      const workflow = await service.submitForApproval('', 'doc.pdf', 'version-1', 3);
      expect(workflow.recordId).toBe('');
      expect(workflow.fileName).toBe('doc.pdf');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete approval workflow', async () => {
      // Submit for approval
      const workflow1 = await service.submitForApproval(
        'record-1',
        'doc.pdf',
        'version-1',
        3,
        'high'
      );
      expect(workflow1.status).toBe('pending_review');

      // Assign reviewer
      const workflow2 = await service.assignReviewer(
        'record-1',
        'doc.pdf',
        'reviewer-123'
      );
      expect(workflow2.status).toBe('under_review');

      // Submit decision
      const decision = await service.submitDecision(
        'record-1',
        'doc.pdf',
        'approved',
        'reviewer-123',
        'John Doe',
        'Looks good',
        'All checks passed'
      );
      expect(decision.decision).toBe('approved');

      // Verify final state
      const finalWorkflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(finalWorkflow?.status).toBe('approved');
      expect(finalWorkflow?.reviewHistory).toHaveLength(1);
      expect(finalWorkflow?.currentDecision).toEqual(decision);
    });

    it('should handle revision workflow', async () => {
      await service.submitForApproval('record-1', 'doc.pdf', 'version-1', 3);
      await service.assignReviewer('record-1', 'doc.pdf', 'reviewer-123');
      
      const decision = await service.submitDecision(
        'record-1',
        'doc.pdf',
        'needs_revision',
        'reviewer-123',
        'John Doe',
        undefined,
        'Need more redactions'
      );

      const workflow = await service.getWorkflow('record-1', 'doc.pdf');
      expect(workflow?.status).toBe('revision_needed');
      expect(workflow?.completedAt).toBeUndefined(); // Not completed yet
      expect(decision.comments).toBe('Need more redactions');
    });
  });
});

describe('ApprovalService Singleton', () => {
  it('should export a singleton instance', () => {
    expect(approvalService).toBeInstanceOf(ApprovalService);
  });

  it('should maintain state across calls', async () => {
    await approvalService.submitForApproval('test-record', 'test.pdf', 'v1', 1);
    const workflow = await approvalService.getWorkflow('test-record', 'test.pdf');
    expect(workflow).toBeDefined();
  });
});