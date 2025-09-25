/**
 * Legal Review Service Tests (Epic 5)
 * Comprehensive tests for comment threads, change requests, and package approvals
 */

import { legalReviewService, LegalReviewService } from '../../src/services/legalReviewService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LegalReviewService', () => {
  let service: LegalReviewService;

  beforeEach(() => {
    localStorageMock.clear();
    service = new LegalReviewService();
  });

  describe('Comment Threads (US-050)', () => {
    describe('createCommentThread', () => {
      it('should create a new comment thread', async () => {
        const thread = await service.createCommentThread(
          'record-123',
          'document.pdf',
          'change_request',
          'Need additional redactions',
          'user-legal-001',
          'Sarah Johnson',
          'legal_reviewer',
          'high'
        );

        expect(thread).toBeDefined();
        expect(thread.recordId).toBe('record-123');
        expect(thread.fileName).toBe('document.pdf');
        expect(thread.threadType).toBe('change_request');
        expect(thread.priority).toBe('high');
        expect(thread.status).toBe('open');
        expect(thread.comments).toHaveLength(1);
        expect(thread.comments[0].content).toBe('Need additional redactions');
        expect(thread.comments[0].authorName).toBe('Sarah Johnson');
        expect(thread.comments[0].authorRole).toBe('legal_reviewer');
      });

      it('should set default priority to medium', async () => {
        const thread = await service.createCommentThread(
          'record-123',
          'document.pdf',
          'general_comment',
          'General comment',
          'user-001',
          'John Doe',
          'records_officer'
        );

        expect(thread.priority).toBe('medium');
      });

      it('should generate unique IDs', async () => {
        const thread1 = await service.createCommentThread(
          'record-123',
          'doc1.pdf',
          'general_comment',
          'Comment 1',
          'user-001',
          'User 1',
          'legal_reviewer'
        );

        const thread2 = await service.createCommentThread(
          'record-123',
          'doc2.pdf',
          'general_comment',
          'Comment 2',
          'user-002',
          'User 2',
          'records_officer'
        );

        expect(thread1.id).not.toBe(thread2.id);
        expect(thread1.comments[0].id).not.toBe(thread2.comments[0].id);
      });
    });

    describe('addComment', () => {
      let threadId: string;

      beforeEach(async () => {
        const thread = await service.createCommentThread(
          'record-123',
          'document.pdf',
          'general_comment',
          'Initial comment',
          'user-001',
          'John Doe',
          'records_officer'
        );
        threadId = thread.id;
      });

      it('should add a comment to existing thread', async () => {
        const comment = await service.addComment(
          threadId,
          'Reply comment',
          'user-legal-001',
          'Sarah Johnson',
          'legal_reviewer'
        );

        expect(comment).toBeDefined();
        expect(comment.content).toBe('Reply comment');
        expect(comment.authorName).toBe('Sarah Johnson');
        expect(comment.authorRole).toBe('legal_reviewer');
        expect(comment.threadId).toBe(threadId);

        const threads = await service.getCommentThreadsForRecord('record-123', 'document.pdf');
        expect(threads[0].comments).toHaveLength(2);
      });

      it('should resolve thread when adding resolution comment', async () => {
        const comment = await service.addComment(
          threadId,
          'This issue is resolved',
          'user-legal-001',
          'Sarah Johnson',
          'legal_reviewer',
          true // isResolution
        );

        expect(comment.isResolution).toBe(true);

        const threads = await service.getCommentThreadsForRecord('record-123', 'document.pdf');
        expect(threads[0].status).toBe('resolved');
      });

      it('should throw error for non-existent thread', async () => {
        await expect(
          service.addComment(
            'non-existent-thread',
            'Comment',
            'user-001',
            'User',
            'legal_reviewer'
          )
        ).rejects.toThrow('Failed to add comment');
      });
    });

    describe('getCommentThreadsForRecord', () => {
      beforeEach(async () => {
        await service.createCommentThread(
          'record-123',
          'doc1.pdf',
          'change_request',
          'Change needed',
          'user-001',
          'User 1',
          'legal_reviewer',
          'high'
        );

        await service.createCommentThread(
          'record-123',
          'doc2.pdf',
          'general_comment',
          'General comment',
          'user-002',
          'User 2',
          'records_officer',
          'medium'
        );

        await service.createCommentThread(
          'record-456',
          'doc1.pdf',
          'clarification',
          'Need clarification',
          'user-003',
          'User 3',
          'legal_reviewer',
          'low'
        );
      });

      it('should return threads for specific record', async () => {
        const threads = await service.getCommentThreadsForRecord('record-123');
        expect(threads).toHaveLength(2);
        expect(threads.every(t => t.recordId === 'record-123')).toBe(true);
      });

      it('should filter by fileName when provided', async () => {
        const threads = await service.getCommentThreadsForRecord('record-123', 'doc1.pdf');
        expect(threads).toHaveLength(1);
        expect(threads[0].fileName).toBe('doc1.pdf');
      });

      it('should return empty array for non-existent record', async () => {
        const threads = await service.getCommentThreadsForRecord('non-existent');
        expect(threads).toHaveLength(0);
      });

      it('should sort threads by updated date (newest first)', async () => {
        const threads = await service.getCommentThreadsForRecord('record-123');
        expect(threads).toHaveLength(2);
        
        // Threads should be sorted by updatedAt in descending order
        const dates = threads.map(t => new Date(t.updatedAt).getTime());
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      });
    });

    describe('updateThreadStatus', () => {
      let threadId: string;

      beforeEach(async () => {
        const thread = await service.createCommentThread(
          'record-123',
          'document.pdf',
          'general_comment',
          'Initial comment',
          'user-001',
          'User',
          'legal_reviewer'
        );
        threadId = thread.id;
      });

      it('should update thread status', async () => {
        const updatedThread = await service.updateThreadStatus(threadId, 'resolved');
        
        expect(updatedThread.status).toBe('resolved');
        expect(updatedThread.updatedAt).toBeDefined();
      });

      it('should throw error for non-existent thread', async () => {
        await expect(
          service.updateThreadStatus('non-existent-thread', 'resolved')
        ).rejects.toThrow('Failed to update thread status');
      });
    });
  });

  describe('Change Requests (US-050)', () => {
    describe('createChangeRequest', () => {
      it('should create a new change request', async () => {
        const changeRequest = await service.createChangeRequest(
          'record-123',
          'document.pdf',
          'additional_redaction',
          'Need to redact SSN on page 2',
          'user-legal-001',
          'Sarah Johnson',
          'urgent',
          {
            page: 2,
            coordinates: { x: 100, y: 200, width: 150, height: 20 }
          }
        );

        expect(changeRequest).toBeDefined();
        expect(changeRequest.recordId).toBe('record-123');
        expect(changeRequest.fileName).toBe('document.pdf');
        expect(changeRequest.requestType).toBe('additional_redaction');
        expect(changeRequest.description).toBe('Need to redact SSN on page 2');
        expect(changeRequest.requestedByName).toBe('Sarah Johnson');
        expect(changeRequest.urgency).toBe('urgent');
        expect(changeRequest.status).toBe('pending');
        expect(changeRequest.specificLocation).toBeDefined();
        expect(changeRequest.specificLocation!.page).toBe(2);
      });

      it('should set default urgency to medium', async () => {
        const changeRequest = await service.createChangeRequest(
          'record-123',
          'document.pdf',
          'clarification',
          'Need clarification',
          'user-001',
          'User'
        );

        expect(changeRequest.urgency).toBe('medium');
      });
    });

    describe('updateChangeRequestStatus', () => {
      let changeRequestId: string;

      beforeEach(async () => {
        const changeRequest = await service.createChangeRequest(
          'record-123',
          'document.pdf',
          'additional_redaction',
          'Need redaction',
          'user-001',
          'User'
        );
        changeRequestId = changeRequest.id;
      });

      it('should update change request status', async () => {
        const updatedRequest = await service.updateChangeRequestStatus(
          changeRequestId,
          'in_progress',
          'user-002',
          'Work in progress'
        );

        expect(updatedRequest.status).toBe('in_progress');
        expect(updatedRequest.assignedTo).toBe('user-002');
        expect(updatedRequest.resolutionNotes).toBe('Work in progress');
      });

      it('should set resolved timestamp when completed or rejected', async () => {
        const completedRequest = await service.updateChangeRequestStatus(
          changeRequestId,
          'completed'
        );

        expect(completedRequest.status).toBe('completed');
        expect(completedRequest.resolvedAt).toBeDefined();
      });

      it('should throw error for non-existent change request', async () => {
        await expect(
          service.updateChangeRequestStatus('non-existent', 'completed')
        ).rejects.toThrow('Failed to update change request');
      });
    });

    describe('getChangeRequestsForRecord', () => {
      beforeEach(async () => {
        await service.createChangeRequest(
          'record-123',
          'doc1.pdf',
          'additional_redaction',
          'Redact SSN',
          'user-001',
          'User 1',
          'high'
        );

        await service.createChangeRequest(
          'record-123',
          'doc2.pdf',
          'remove_redaction',
          'Remove over-redaction',
          'user-002',
          'User 2',
          'medium'
        );

        await service.createChangeRequest(
          'record-456',
          'doc1.pdf',
          'clarification',
          'Need clarification',
          'user-003',
          'User 3',
          'low'
        );
      });

      it('should return change requests for specific record', async () => {
        const requests = await service.getChangeRequestsForRecord('record-123');
        expect(requests).toHaveLength(2);
        expect(requests.every(r => r.recordId === 'record-123')).toBe(true);
      });

      it('should filter by fileName when provided', async () => {
        const requests = await service.getChangeRequestsForRecord('record-123', 'doc1.pdf');
        expect(requests).toHaveLength(1);
        expect(requests[0].fileName).toBe('doc1.pdf');
      });

      it('should sort by creation date (newest first)', async () => {
        const requests = await service.getChangeRequestsForRecord('record-123');
        expect(requests).toHaveLength(2);
        
        const dates = requests.map(r => new Date(r.createdAt).getTime());
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      });
    });
  });

  describe('Package Approvals (US-051)', () => {
    describe('createPackageApproval', () => {
      it('should create a new package approval', async () => {
        const packageApproval = await service.createPackageApproval(
          'request-123',
          ['record-1', 'record-2', 'record-3'],
          'custom-package-id'
        );

        expect(packageApproval).toBeDefined();
        expect(packageApproval.requestId).toBe('request-123');
        expect(packageApproval.recordIds).toEqual(['record-1', 'record-2', 'record-3']);
        expect(packageApproval.totalRecords).toBe(3);
        expect(packageApproval.packageId).toBe('custom-package-id');
        expect(packageApproval.status).toBe('pending');
        expect(packageApproval.isLocked).toBe(false);
        expect(packageApproval.deliveryApproved).toBe(false);
      });

      it('should generate package ID when not provided', async () => {
        const packageApproval = await service.createPackageApproval(
          'request-123',
          ['record-1']
        );

        expect(packageApproval.packageId).toMatch(/^pkg_\d+$/);
      });
    });

    describe('submitPackageApproval', () => {
      let packageApprovalId: string;

      beforeEach(async () => {
        const packageApproval = await service.createPackageApproval(
          'request-123',
          ['record-1', 'record-2']
        );
        packageApprovalId = packageApproval.id;
      });

      it('should approve package and lock for delivery', async () => {
        const approvedPackage = await service.submitPackageApproval(
          packageApprovalId,
          'approved',
          'reviewer-001',
          'Sarah Johnson',
          'All documents look good',
          'Ready for delivery'
        );

        expect(approvedPackage.status).toBe('approved');
        expect(approvedPackage.reviewerId).toBe('reviewer-001');
        expect(approvedPackage.reviewerName).toBe('Sarah Johnson');
        expect(approvedPackage.reason).toBe('All documents look good');
        expect(approvedPackage.comments).toBe('Ready for delivery');
        expect(approvedPackage.isLocked).toBe(true);
        expect(approvedPackage.deliveryApproved).toBe(true);
        expect(approvedPackage.approvedAt).toBeDefined();
        expect(approvedPackage.lockTimestamp).toBeDefined();
      });

      it('should reject package without locking', async () => {
        const rejectedPackage = await service.submitPackageApproval(
          packageApprovalId,
          'rejected',
          'reviewer-001',
          'Sarah Johnson',
          'Contains sensitive information',
          'Needs more redactions'
        );

        expect(rejectedPackage.status).toBe('rejected');
        expect(rejectedPackage.reason).toBe('Contains sensitive information');
        expect(rejectedPackage.isLocked).toBe(false);
        expect(rejectedPackage.deliveryApproved).toBe(false);
        expect(rejectedPackage.rejectedAt).toBeDefined();
      });

      it('should request changes without locking', async () => {
        const changesPackage = await service.submitPackageApproval(
          packageApprovalId,
          'changes_requested',
          'reviewer-001',
          'Sarah Johnson',
          'Minor changes needed',
          'Please review page 3'
        );

        expect(changesPackage.status).toBe('changes_requested');
        expect(changesPackage.isLocked).toBe(false);
        expect(changesPackage.deliveryApproved).toBe(false);
      });

      it('should throw error for non-existent package approval', async () => {
        await expect(
          service.submitPackageApproval(
            'non-existent',
            'approved',
            'reviewer-001',
            'Reviewer'
          )
        ).rejects.toThrow('Failed to submit package approval');
      });
    });

    describe('getPackageApproval', () => {
      let packageApprovalId: string;

      beforeEach(async () => {
        const packageApproval = await service.createPackageApproval(
          'request-123',
          ['record-1']
        );
        packageApprovalId = packageApproval.id;
      });

      it('should return package approval by ID', async () => {
        const packageApproval = await service.getPackageApproval(packageApprovalId);
        
        expect(packageApproval).toBeDefined();
        expect(packageApproval!.id).toBe(packageApprovalId);
      });

      it('should return null for non-existent ID', async () => {
        const packageApproval = await service.getPackageApproval('non-existent');
        expect(packageApproval).toBeNull();
      });
    });

    describe('getPackageApprovalsByRequest', () => {
      beforeEach(async () => {
        await service.createPackageApproval('request-123', ['record-1']);
        await service.createPackageApproval('request-123', ['record-2']);
        await service.createPackageApproval('request-456', ['record-3']);
      });

      it('should return package approvals for specific request', async () => {
        const approvals = await service.getPackageApprovalsByRequest('request-123');
        expect(approvals).toHaveLength(2);
        expect(approvals.every(pa => pa.requestId === 'request-123')).toBe(true);
      });

      it('should return empty array for non-existent request', async () => {
        const approvals = await service.getPackageApprovalsByRequest('non-existent');
        expect(approvals).toHaveLength(0);
      });

      it('should sort by creation date (newest first)', async () => {
        const approvals = await service.getPackageApprovalsByRequest('request-123');
        expect(approvals).toHaveLength(2);
        
        const dates = approvals.map(pa => new Date(pa.createdAt).getTime());
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      });
    });

    describe('getPendingPackageApprovals', () => {
      beforeEach(async () => {
        // Create pending package
        await service.createPackageApproval('request-1', ['record-1']);
        
        // Create and approve another package
        const approved = await service.createPackageApproval('request-2', ['record-2']);
        await service.submitPackageApproval(
          approved.id,
          'approved',
          'reviewer-001',
          'Reviewer'
        );
        
        // Create and reject another package
        const rejected = await service.createPackageApproval('request-3', ['record-3']);
        await service.submitPackageApproval(
          rejected.id,
          'rejected',
          'reviewer-001',
          'Reviewer',
          'Issues found'
        );
      });

      it('should return only pending package approvals', async () => {
        const pendingApprovals = await service.getPendingPackageApprovals();
        expect(pendingApprovals).toHaveLength(1);
        expect(pendingApprovals[0].status).toBe('pending');
      });
    });

    describe('lockPackage', () => {
      let approvedPackageId: string;
      let pendingPackageId: string;

      beforeEach(async () => {
        // Create and approve a package
        const approved = await service.createPackageApproval('request-1', ['record-1']);
        await service.submitPackageApproval(
          approved.id,
          'approved',
          'reviewer-001',
          'Reviewer'
        );
        approvedPackageId = approved.id;

        // Create a pending package
        const pending = await service.createPackageApproval('request-2', ['record-2']);
        pendingPackageId = pending.id;
      });

      it('should lock approved package', async () => {
        const lockedPackage = await service.lockPackage(approvedPackageId);
        
        expect(lockedPackage.isLocked).toBe(true);
        expect(lockedPackage.lockTimestamp).toBeDefined();
      });

      it('should throw error for non-approved package', async () => {
        await expect(
          service.lockPackage(pendingPackageId)
        ).rejects.toThrow('Package must be approved before locking');
      });

      it('should throw error for non-existent package', async () => {
        await expect(
          service.lockPackage('non-existent')
        ).rejects.toThrow('Failed to lock package');
      });
    });
  });

  describe('getLegalReviewSummary', () => {
    beforeEach(async () => {
      // Create comment threads
      await service.createCommentThread(
        'record-1',
        'doc1.pdf',
        'change_request',
        'Thread 1',
        'user-1',
        'User 1',
        'legal_reviewer',
        'high'
      );
      
      const thread2 = await service.createCommentThread(
        'record-2',
        'doc2.pdf',
        'general_comment',
        'Thread 2',
        'user-2',
        'User 2',
        'records_officer',
        'medium'
      );
      
      // Resolve one thread
      await service.updateThreadStatus(thread2.id, 'resolved');

      // Create change requests
      await service.createChangeRequest(
        'record-1',
        'doc1.pdf',
        'additional_redaction',
        'Change 1',
        'user-1',
        'User 1',
        'high'
      );
      
      const change2 = await service.createChangeRequest(
        'record-2',
        'doc2.pdf',
        'clarification',
        'Change 2',
        'user-2',
        'User 2',
        'medium'
      );
      
      // Complete one change request
      await service.updateChangeRequestStatus(change2.id, 'completed');

      // Create package approvals
      await service.createPackageApproval('request-1', ['record-1']);
      
      const approved = await service.createPackageApproval('request-2', ['record-2']);
      await service.submitPackageApproval(
        approved.id,
        'approved',
        'reviewer-001',
        'Reviewer'
      );
    });

    it('should return comprehensive summary statistics', async () => {
      const summary = await service.getLegalReviewSummary();

      expect(summary.totalThreads).toBe(2);
      expect(summary.openThreads).toBe(1);
      expect(summary.resolvedThreads).toBe(1);
      expect(summary.pendingChangeRequests).toBe(1);
      expect(summary.completedChangeRequests).toBe(1);
      expect(summary.packagesAwaitingApproval).toBe(1);
      expect(summary.approvedPackages).toBe(1);
      expect(summary.averageReviewTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Singleton Export', () => {
    it('should export a singleton instance', () => {
      expect(legalReviewService).toBeInstanceOf(LegalReviewService);
    });

    it('should maintain state across calls', async () => {
      await legalReviewService.createCommentThread(
        'test-record',
        'test.pdf',
        'general_comment',
        'Test comment',
        'test-user',
        'Test User',
        'legal_reviewer'
      );
      
      const threads = await legalReviewService.getCommentThreadsForRecord('test-record');
      expect(threads).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Service should not throw error, but log it
      expect(async () => {
        await service.createCommentThread(
          'record-1',
          'doc.pdf',
          'general_comment',
          'Test',
          'user-1',
          'User',
          'legal_reviewer'
        );
      }).not.toThrow();

      // Restore original implementation
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data', async () => {
      // Set corrupted data
      localStorage.setItem('legal_review_comment_threads', 'invalid-json');
      
      // Should return empty results instead of throwing
      const threads = await service.getCommentThreadsForRecord('any-record');
      expect(threads).toEqual([]);
    });
  });
});