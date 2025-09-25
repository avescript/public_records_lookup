/**
 * Epic 5 Integration Tests
 * Tests the complete workflow of legal review features including
 * comment threads, change requests, and package approvals
 */

import { legalReviewService } from '../../src/services/legalReviewService';
import type { CommentThread, ChangeRequest, PackageApproval } from '../../src/services/legalReviewService';

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

describe('Epic 5 Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Complete Legal Review Workflow', () => {
    it('should handle full legal review process from comment to package approval', async () => {
      const recordId = 'record-123';
      const fileName = 'sensitive-document.pdf';
      const requestId = 'request-456';

      // Step 1: Create a comment thread (US-050)
      const commentThread = await legalReviewService.createCommentThread(
        recordId,
        fileName,
        'change_request',
        'This document needs additional redactions on page 2',
        'user-legal-001',
        'Sarah Johnson',
        'legal_reviewer',
        'high'
      );

      expect(commentThread).toBeDefined();
      expect(commentThread.recordId).toBe(recordId);
      expect(commentThread.fileName).toBe(fileName);
      expect(commentThread.status).toBe('open');
      expect(commentThread.priority).toBe('high');

      // Step 2: Add follow-up comments
      const followupComment = await legalReviewService.addComment(
        commentThread.id,
        'I agree, particularly the SSN on page 2 needs to be redacted',
        'user-records-001',
        'Mike Wilson',
        'records_officer'
      );

      expect(followupComment).toBeDefined();
      expect(followupComment.content).toContain('SSN on page 2');

      // Step 3: Create a change request based on the comment thread
      const changeRequest = await legalReviewService.createChangeRequest(
        recordId,
        fileName,
        'additional_redaction',
        'Redact SSN on page 2 as discussed in comment thread',
        'user-legal-001',
        'Sarah Johnson',
        'high',
        {
          page: 2,
          coordinates: { x: 150, y: 300, width: 120, height: 18 }
        }
      );

      expect(changeRequest).toBeDefined();
      expect(changeRequest.requestType).toBe('additional_redaction');
      expect(changeRequest.urgency).toBe('high');
      expect(changeRequest.specificLocation?.page).toBe(2);

      // Step 4: Assign and process the change request
      const updatedChangeRequest = await legalReviewService.updateChangeRequestStatus(
        changeRequest.id,
        'in_progress',
        'user-records-002',
        'Processing redaction request'
      );

      expect(updatedChangeRequest.status).toBe('in_progress');
      expect(updatedChangeRequest.assignedTo).toBe('user-records-002');

      // Step 5: Complete the change request
      const completedChangeRequest = await legalReviewService.updateChangeRequestStatus(
        changeRequest.id,
        'completed',
        'user-records-002',
        'SSN redacted successfully'
      );

      expect(completedChangeRequest.status).toBe('completed');
      expect(completedChangeRequest.resolvedAt).toBeDefined();

      // Step 6: Add resolution comment to thread
      const resolutionComment = await legalReviewService.addComment(
        commentThread.id,
        'Change request completed. SSN has been redacted from page 2.',
        'user-records-002',
        'Records Team',
        'records_officer',
        true // isResolution
      );

      expect(resolutionComment.isResolution).toBe(true);

      // Step 7: Verify thread is automatically resolved
      const resolvedThreads = await legalReviewService.getCommentThreadsForRecord(recordId, fileName);
      expect(resolvedThreads[0].status).toBe('resolved');

      // Step 8: Create package approval (US-051)
      const packageApproval = await legalReviewService.createPackageApproval(
        requestId,
        [recordId, 'record-124', 'record-125'],
        'package-sensitive-docs-v1'
      );

      expect(packageApproval).toBeDefined();
      expect(packageApproval.requestId).toBe(requestId);
      expect(packageApproval.recordIds).toEqual([recordId, 'record-124', 'record-125']);
      expect(packageApproval.packageId).toBe('package-sensitive-docs-v1');
      expect(packageApproval.status).toBe('pending');
      expect(packageApproval.isLocked).toBe(false);

      // Step 9: Submit package approval
      const approvedPackage = await legalReviewService.submitPackageApproval(
        packageApproval.id,
        'approved',
        'user-legal-001',
        'Sarah Johnson',
        'All documents reviewed and redacted appropriately',
        'Package ready for delivery'
      );

      expect(approvedPackage.status).toBe('approved');
      expect(approvedPackage.isLocked).toBe(true);
      expect(approvedPackage.deliveryApproved).toBe(true);
      expect(approvedPackage.reviewerId).toBe('user-legal-001');
      expect(approvedPackage.reviewerName).toBe('Sarah Johnson');
      expect(approvedPackage.approvedAt).toBeDefined();
      expect(approvedPackage.lockTimestamp).toBeDefined();

      // Step 10: Verify the complete workflow summary
      const summary = await legalReviewService.getLegalReviewSummary();
      expect(summary.totalThreads).toBe(1);
      expect(summary.resolvedThreads).toBe(1);
      expect(summary.completedChangeRequests).toBe(1);
      expect(summary.approvedPackages).toBe(1);
    });

    it('should handle rejection workflow with comments and changes', async () => {
      const recordId = 'record-789';
      const fileName = 'problematic-document.pdf';
      const requestId = 'request-789';

      // Create initial comment thread
      const commentThread = await legalReviewService.createCommentThread(
        recordId,
        fileName,
        'general_comment',
        'This document has over-redaction issues',
        'user-legal-002',
        'Legal Reviewer 2',
        'legal_reviewer',
        'medium'
      );

      // Create change request for over-redaction
      const changeRequest = await legalReviewService.createChangeRequest(
        recordId,
        fileName,
        'remove_redaction',
        'Remove excessive redaction from public information sections',
        'user-legal-002',
        'Legal Reviewer 2',
        'medium'
      );

      // Create package approval
      const packageApproval = await legalReviewService.createPackageApproval(
        requestId,
        [recordId]
      );

      // Reject the package due to ongoing issues
      const rejectedPackage = await legalReviewService.submitPackageApproval(
        packageApproval.id,
        'rejected',
        'user-legal-002',
        'Legal Reviewer 2',
        'Document contains over-redaction and requires revision',
        'Please address over-redaction issues before resubmission'
      );

      expect(rejectedPackage.status).toBe('rejected');
      expect(rejectedPackage.isLocked).toBe(false);
      expect(rejectedPackage.deliveryApproved).toBe(false);
      expect(rejectedPackage.reason).toBe('Document contains over-redaction and requires revision');
      expect(rejectedPackage.rejectedAt).toBeDefined();

      // Verify summary reflects rejection
      const summary = await legalReviewService.getLegalReviewSummary();
      expect(summary.totalThreads).toBe(1);
      expect(summary.openThreads).toBe(1);
      expect(summary.pendingChangeRequests).toBe(1);
      expect(summary.packagesAwaitingApproval).toBe(0); // Rejected packages don't count as awaiting
    });

    it('should handle changes requested workflow', async () => {
      const recordId = 'record-456';
      const fileName = 'needs-minor-changes.pdf';
      const requestId = 'request-456';

      // Create package approval
      const packageApproval = await legalReviewService.createPackageApproval(
        requestId,
        [recordId, 'record-457']
      );

      // Request minor changes
      const changesPackage = await legalReviewService.submitPackageApproval(
        packageApproval.id,
        'changes_requested',
        'user-legal-003',
        'Legal Reviewer 3',
        'Minor formatting issues need to be addressed',
        'Page headers need to be consistent across all documents'
      );

      expect(changesPackage.status).toBe('changes_requested');
      expect(changesPackage.isLocked).toBe(false);
      expect(changesPackage.deliveryApproved).toBe(false);
      expect(changesPackage.reason).toBe('Minor formatting issues need to be addressed');
      expect(changesPackage.comments).toBe('Page headers need to be consistent across all documents');

      // Create comment thread for the requested changes
      const commentThread = await legalReviewService.createCommentThread(
        recordId,
        fileName,
        'clarification',
        'Based on package review feedback: Page headers need consistency',
        'user-records-003',
        'Records Officer',
        'records_officer',
        'low'
      );

      expect(commentThread.threadType).toBe('clarification');
      expect(commentThread.priority).toBe('low');

      // After addressing changes, resubmit for approval
      const resubmittedPackage = await legalReviewService.submitPackageApproval(
        packageApproval.id,
        'approved',
        'user-legal-003',
        'Legal Reviewer 3',
        'Changes have been addressed, documents are now consistent',
        'Approved for delivery'
      );

      expect(resubmittedPackage.status).toBe('approved');
      expect(resubmittedPackage.isLocked).toBe(true);
      expect(resubmittedPackage.deliveryApproved).toBe(true);
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should maintain data consistency across all Epic 5 features', async () => {
      const recordIds = ['record-A', 'record-B', 'record-C'];
      const requestId = 'request-multi-feature';

      // Create multiple comment threads
      const threads = await Promise.all([
        legalReviewService.createCommentThread(
          'record-A',
          'doc-A.pdf',
          'change_request',
          'Thread A',
          'user-1',
          'User 1',
          'legal_reviewer',
          'high'
        ),
        legalReviewService.createCommentThread(
          'record-B',
          'doc-B.pdf',
          'general_comment',
          'Thread B',
          'user-2',
          'User 2',
          'records_officer',
          'medium'
        ),
        legalReviewService.createCommentThread(
          'record-C',
          'doc-C.pdf',
          'clarification',
          'Thread C',
          'user-3',
          'User 3',
          'legal_reviewer',
          'low'
        ),
      ]);

      expect(threads).toHaveLength(3);

      // Create multiple change requests
      const changeRequests = await Promise.all([
        legalReviewService.createChangeRequest(
          'record-A',
          'doc-A.pdf',
          'additional_redaction',
          'Need more redaction',
          'user-1',
          'User 1',
          'high'
        ),
        legalReviewService.createChangeRequest(
          'record-B',
          'doc-B.pdf',
          'clarification',
          'Need clarification',
          'user-2',
          'User 2',
          'medium'
        ),
      ]);

      expect(changeRequests).toHaveLength(2);

      // Create package approval
      const packageApproval = await legalReviewService.createPackageApproval(
        requestId,
        recordIds
      );

      expect(packageApproval.recordIds).toEqual(recordIds);
      expect(packageApproval.totalRecords).toBe(3);

      // Verify summary aggregates correctly
      const summary = await legalReviewService.getLegalReviewSummary();
      expect(summary.totalThreads).toBe(3);
      expect(summary.openThreads).toBe(3);
      expect(summary.pendingChangeRequests).toBe(2);
      expect(summary.packagesAwaitingApproval).toBe(1);

      // Resolve some threads and change requests
      await legalReviewService.updateThreadStatus(threads[0].id, 'resolved');
      await legalReviewService.updateChangeRequestStatus(changeRequests[0].id, 'completed');

      // Verify updated summary
      const updatedSummary = await legalReviewService.getLegalReviewSummary();
      expect(updatedSummary.totalThreads).toBe(3);
      expect(updatedSummary.openThreads).toBe(2);
      expect(updatedSummary.resolvedThreads).toBe(1);
      expect(updatedSummary.pendingChangeRequests).toBe(1);
      expect(updatedSummary.completedChangeRequests).toBe(1);
    });

    it('should handle concurrent operations without data corruption', async () => {
      const recordId = 'record-concurrent';
      const fileName = 'concurrent-test.pdf';
      const requestId = 'request-concurrent';

      // Create multiple operations concurrently
      const operations = await Promise.allSettled([
        legalReviewService.createCommentThread(
          recordId,
          fileName,
          'change_request',
          'Concurrent thread 1',
          'user-1',
          'User 1',
          'legal_reviewer'
        ),
        legalReviewService.createCommentThread(
          recordId,
          fileName,
          'general_comment',
          'Concurrent thread 2',
          'user-2',
          'User 2',
          'records_officer'
        ),
        legalReviewService.createChangeRequest(
          recordId,
          fileName,
          'additional_redaction',
          'Concurrent change request',
          'user-3',
          'User 3'
        ),
        legalReviewService.createPackageApproval(
          requestId,
          [recordId]
        ),
      ]);

      // All operations should succeed
      expect(operations.every(op => op.status === 'fulfilled')).toBe(true);

      // Verify data integrity
      const threads = await legalReviewService.getCommentThreadsForRecord(recordId, fileName);
      const changes = await legalReviewService.getChangeRequestsForRecord(recordId, fileName);
      const packages = await legalReviewService.getPackageApprovalsByRequest(requestId);

      expect(threads).toHaveLength(2);
      expect(changes).toHaveLength(1);
      expect(packages).toHaveLength(1);

      // Verify unique IDs
      const threadIds = threads.map(t => t.id);
      const changeIds = changes.map(c => c.id);
      const packageIds = packages.map(p => p.id);

      expect(new Set(threadIds).size).toBe(threadIds.length);
      expect(new Set(changeIds).size).toBe(changeIds.length);
      expect(new Set(packageIds).size).toBe(packageIds.length);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle invalid data gracefully', async () => {
      // Test with empty/invalid inputs
      await expect(
        legalReviewService.createCommentThread('', '', 'general_comment', '', '', '', 'legal_reviewer')
      ).rejects.toThrow();

      await expect(
        legalReviewService.createChangeRequest('', '', 'clarification', '', '', '')
      ).rejects.toThrow();

      await expect(
        legalReviewService.createPackageApproval('', [])
      ).rejects.toThrow();
    });

    it('should handle storage errors and continue functioning', async () => {
      // Create some initial data
      const thread = await legalReviewService.createCommentThread(
        'record-storage-test',
        'test.pdf',
        'general_comment',
        'Test comment',
        'user-1',
        'User 1',
        'legal_reviewer'
      );

      expect(thread).toBeDefined();

      // Mock storage failure for subsequent operations
      const originalSetItem = localStorage.setItem;
      let failureCount = 0;
      localStorage.setItem = jest.fn().mockImplementation((key, value) => {
        failureCount++;
        if (failureCount <= 2) {
          throw new Error('Storage quota exceeded');
        }
        return originalSetItem.call(localStorage, key, value);
      });

      // These operations should handle storage errors gracefully
      try {
        await legalReviewService.addComment(
          thread.id,
          'This should fail initially',
          'user-2',
          'User 2',
          'records_officer'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Restore original localStorage and verify system recovery
      localStorage.setItem = originalSetItem;

      const comment = await legalReviewService.addComment(
        thread.id,
        'This should succeed after recovery',
        'user-2',
        'User 2',
        'records_officer'
      );

      expect(comment).toBeDefined();
      expect(comment.content).toBe('This should succeed after recovery');
    });

    it('should maintain referential integrity across features', async () => {
      const recordId = 'record-integrity-test';
      const fileName = 'integrity-test.pdf';
      const requestId = 'request-integrity-test';

      // Create a comment thread
      const thread = await legalReviewService.createCommentThread(
        recordId,
        fileName,
        'change_request',
        'Integrity test thread',
        'user-1',
        'User 1',
        'legal_reviewer'
      );

      // Create a change request for the same record
      const changeRequest = await legalReviewService.createChangeRequest(
        recordId,
        fileName,
        'additional_redaction',
        'Integrity test change',
        'user-1',
        'User 1'
      );

      // Create package approval including this record
      const packageApproval = await legalReviewService.createPackageApproval(
        requestId,
        [recordId, 'record-other']
      );

      // Verify all items reference the same record
      expect(thread.recordId).toBe(recordId);
      expect(changeRequest.recordId).toBe(recordId);
      expect(packageApproval.recordIds).toContain(recordId);

      // Verify they can all be retrieved by record ID
      const threadsByRecord = await legalReviewService.getCommentThreadsForRecord(recordId);
      const changesByRecord = await legalReviewService.getChangeRequestsForRecord(recordId);
      const packagesByRequest = await legalReviewService.getPackageApprovalsByRequest(requestId);

      expect(threadsByRecord).toHaveLength(1);
      expect(changesByRecord).toHaveLength(1);
      expect(packagesByRequest).toHaveLength(1);
      expect(threadsByRecord[0].id).toBe(thread.id);
      expect(changesByRecord[0].id).toBe(changeRequest.id);
      expect(packagesByRequest[0].id).toBe(packageApproval.id);
    });

  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of entities efficiently', async () => {
      const recordCount = 50;
      const threadsPerRecord = 5;
      const changesPerRecord = 3;

      const startTime = Date.now();

      // Create a large number of records, threads, and changes
      const operations = [];

      for (let i = 0; i < recordCount; i++) {
        const recordId = `record-perf-${i}`;
        const fileName = `document-${i}.pdf`;

        // Create threads for this record
        for (let j = 0; j < threadsPerRecord; j++) {
          operations.push(
            legalReviewService.createCommentThread(
              recordId,
              fileName,
              'general_comment',
              `Performance test thread ${j} for record ${i}`,
              `user-${j % 3}`,
              `User ${j % 3}`,
              'legal_reviewer'
            )
          );
        }

        // Create change requests for this record
        for (let k = 0; k < changesPerRecord; k++) {
          operations.push(
            legalReviewService.createChangeRequest(
              recordId,
              fileName,
              'clarification',
              `Performance test change ${k} for record ${i}`,
              `user-${k % 3}`,
              `User ${k % 3}`
            )
          );
        }
      }

      // Execute all operations
      const results = await Promise.allSettled(operations);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify performance metrics
      expect(successCount).toBe(recordCount * (threadsPerRecord + changesPerRecord));
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify data integrity after bulk operations
      const summary = await legalReviewService.getLegalReviewSummary();
      expect(summary.totalThreads).toBe(recordCount * threadsPerRecord);
      expect(summary.pendingChangeRequests).toBe(recordCount * changesPerRecord);

      console.log(`Created ${successCount} entities in ${executionTime}ms`);
    });

    it('should maintain performance with complex queries', async () => {
      // Create diverse data set
      const recordIds = ['record-A', 'record-B', 'record-C'];
      const fileNames = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf'];

      for (const recordId of recordIds) {
        for (const fileName of fileNames) {
          await legalReviewService.createCommentThread(
            recordId,
            fileName,
            'general_comment',
            `Thread for ${recordId} - ${fileName}`,
            'user-1',
            'User 1',
            'legal_reviewer'
          );

          await legalReviewService.createChangeRequest(
            recordId,
            fileName,
            'clarification',
            `Change for ${recordId} - ${fileName}`,
            'user-1',
            'User 1'
          );
        }
      }

      const queryStartTime = Date.now();

      // Perform multiple concurrent queries
      const queryResults = await Promise.all([
        legalReviewService.getCommentThreadsForRecord('record-A'),
        legalReviewService.getCommentThreadsForRecord('record-B', 'doc1.pdf'),
        legalReviewService.getChangeRequestsForRecord('record-C'),
        legalReviewService.getChangeRequestsForRecord('record-A', 'doc2.pdf'),
        legalReviewService.getLegalReviewSummary(),
      ]);

      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;

      // Verify query performance
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify query results
      expect(queryResults[0]).toHaveLength(3); // record-A has 3 files
      expect(queryResults[1]).toHaveLength(1); // record-B + doc1.pdf
      expect(queryResults[2]).toHaveLength(3); // record-C has 3 files
      expect(queryResults[3]).toHaveLength(1); // record-A + doc2.pdf
      expect(queryResults[4].totalThreads).toBe(9); // 3 records × 3 files

      console.log(`Executed 5 complex queries in ${queryTime}ms`);
    });
  });
});