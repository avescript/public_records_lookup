/**
 * Legal Review Service (Epic 5)
 * Manages comment threads, change requests, and package approvals
 * Extends the existing approval workflow for Epic 5 requirements
 */

export interface CommentThread {
  id: string;
  recordId: string;
  fileName: string;
  threadType: 'change_request' | 'general_comment' | 'clarification';
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorRole: 'legal_reviewer' | 'records_officer' | 'admin';
  content: string;
  timestamp: string;
  isResolution?: boolean; // Marks comment as resolving the thread
  attachments?: CommentAttachment[];
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'screenshot';
  url: string;
  size: number;
}

export interface ChangeRequest {
  id: string;
  recordId: string;
  fileName: string;
  requestedBy: string;
  requestedByName: string;
  requestType: 'additional_redaction' | 'remove_redaction' | 'clarification' | 'other';
  description: string;
  specificLocation?: {
    page: number;
    coordinates: { x: number; y: number; width: number; height: number };
  };
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface PackageApproval {
  id: string;
  requestId: string;
  packageId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
  recordIds: string[];
  totalRecords: number;
  reviewerId?: string;
  reviewerName?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reason?: string;
  comments?: string;
  isLocked: boolean;
  lockTimestamp?: string;
  deliveryApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegalReviewSummary {
  totalThreads: number;
  openThreads: number;
  resolvedThreads: number;
  pendingChangeRequests: number;
  completedChangeRequests: number;
  packagesAwaitingApproval: number;
  approvedPackages: number;
  averageReviewTime: number; // in hours
}

class LegalReviewService {
  private readonly COMMENT_THREADS_KEY = 'legal_review_comment_threads';
  private readonly CHANGE_REQUESTS_KEY = 'legal_review_change_requests';
  private readonly PACKAGE_APPROVALS_KEY = 'legal_review_package_approvals';
  private readonly AUDIT_KEY = 'legal_review_audit';

  // Comment Thread Management

  /**
   * Create a new comment thread
   */
  async createCommentThread(
    recordId: string,
    fileName: string,
    threadType: CommentThread['threadType'],
    initialComment: string,
    authorId: string,
    authorName: string,
    authorRole: Comment['authorRole'],
    priority: CommentThread['priority'] = 'medium'
  ): Promise<CommentThread> {
    try {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const thread: CommentThread = {
        id: threadId,
        recordId,
        fileName,
        threadType,
        comments: [{
          id: commentId,
          threadId,
          authorId,
          authorName,
          authorRole,
          content: initialComment,
          timestamp: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'open',
        priority,
      };

      const threads = await this.getCommentThreads();
      threads[threadId] = thread;
      this.saveCommentThreads(threads);

      // Log audit entry
      await this.logAudit('thread_created', {
        threadId,
        recordId,
        fileName,
        threadType,
        authorId,
        authorName,
      });

      return thread;
    } catch (error) {
      console.error('Failed to create comment thread:', error);
      throw new Error('Failed to create comment thread');
    }
  }

  /**
   * Add a comment to an existing thread
   */
  async addComment(
    threadId: string,
    content: string,
    authorId: string,
    authorName: string,
    authorRole: Comment['authorRole'],
    isResolution: boolean = false
  ): Promise<Comment> {
    try {
      const threads = await this.getCommentThreads();
      const thread = threads[threadId];

      if (!thread) {
        throw new Error('Comment thread not found');
      }

      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const comment: Comment = {
        id: commentId,
        threadId,
        authorId,
        authorName,
        authorRole,
        content,
        timestamp: new Date().toISOString(),
        isResolution,
      };

      thread.comments.push(comment);
      thread.updatedAt = new Date().toISOString();

      // If this is a resolution comment, close the thread
      if (isResolution) {
        thread.status = 'resolved';
      }

      threads[threadId] = thread;
      this.saveCommentThreads(threads);

      // Log audit entry
      await this.logAudit('comment_added', {
        threadId,
        commentId,
        authorId,
        authorName,
        isResolution,
        recordId: thread.recordId,
        fileName: thread.fileName,
      });

      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get comment threads for a specific record
   */
  async getCommentThreadsForRecord(recordId: string, fileName?: string): Promise<CommentThread[]> {
    try {
      const threads = await this.getCommentThreads();
      let results = Object.values(threads).filter(t => t.recordId === recordId);

      if (fileName) {
        results = results.filter(t => t.fileName === fileName);
      }

      return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Failed to get comment threads:', error);
      return [];
    }
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(threadId: string, status: CommentThread['status']): Promise<CommentThread> {
    try {
      const threads = await this.getCommentThreads();
      const thread = threads[threadId];

      if (!thread) {
        throw new Error('Comment thread not found');
      }

      thread.status = status;
      thread.updatedAt = new Date().toISOString();

      threads[threadId] = thread;
      this.saveCommentThreads(threads);

      // Log audit entry
      await this.logAudit('thread_status_updated', {
        threadId,
        newStatus: status,
        recordId: thread.recordId,
        fileName: thread.fileName,
      });

      return thread;
    } catch (error) {
      console.error('Failed to update thread status:', error);
      throw new Error('Failed to update thread status');
    }
  }

  // Change Request Management

  /**
   * Create a change request
   */
  async createChangeRequest(
    recordId: string,
    fileName: string,
    requestType: ChangeRequest['requestType'],
    description: string,
    requestedBy: string,
    requestedByName: string,
    urgency: ChangeRequest['urgency'] = 'medium',
    specificLocation?: ChangeRequest['specificLocation']
  ): Promise<ChangeRequest> {
    try {
      const changeRequest: ChangeRequest = {
        id: `change_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recordId,
        fileName,
        requestedBy,
        requestedByName,
        requestType,
        description,
        specificLocation,
        urgency,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      const changeRequests = await this.getChangeRequests();
      changeRequests[changeRequest.id] = changeRequest;
      this.saveChangeRequests(changeRequests);

      // Log audit entry
      await this.logAudit('change_requested', {
        changeRequestId: changeRequest.id,
        recordId,
        fileName,
        requestType,
        requestedBy,
        requestedByName,
        urgency,
      });

      return changeRequest;
    } catch (error) {
      console.error('Failed to create change request:', error);
      throw new Error('Failed to create change request');
    }
  }

  /**
   * Update change request status
   */
  async updateChangeRequestStatus(
    changeRequestId: string,
    status: ChangeRequest['status'],
    assignedTo?: string,
    resolutionNotes?: string
  ): Promise<ChangeRequest> {
    try {
      const changeRequests = await this.getChangeRequests();
      const changeRequest = changeRequests[changeRequestId];

      if (!changeRequest) {
        throw new Error('Change request not found');
      }

      changeRequest.status = status;
      if (assignedTo) changeRequest.assignedTo = assignedTo;
      if (resolutionNotes) changeRequest.resolutionNotes = resolutionNotes;
      
      if (status === 'completed' || status === 'rejected') {
        changeRequest.resolvedAt = new Date().toISOString();
      }

      changeRequests[changeRequestId] = changeRequest;
      this.saveChangeRequests(changeRequests);

      // Log audit entry
      await this.logAudit('change_request_updated', {
        changeRequestId,
        newStatus: status,
        assignedTo,
        recordId: changeRequest.recordId,
        fileName: changeRequest.fileName,
      });

      return changeRequest;
    } catch (error) {
      console.error('Failed to update change request:', error);
      throw new Error('Failed to update change request');
    }
  }

  /**
   * Get change requests for a record
   */
  async getChangeRequestsForRecord(recordId: string, fileName?: string): Promise<ChangeRequest[]> {
    try {
      const changeRequests = await this.getChangeRequests();
      let results = Object.values(changeRequests).filter(cr => cr.recordId === recordId);

      if (fileName) {
        results = results.filter(cr => cr.fileName === fileName);
      }

      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get change requests:', error);
      return [];
    }
  }

  // Package Approval Management

  /**
   * Create package approval workflow
   */
  async createPackageApproval(
    requestId: string,
    recordIds: string[],
    packageId?: string
  ): Promise<PackageApproval> {
    try {
      const packageApproval: PackageApproval = {
        id: `pkg_approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        packageId: packageId || `pkg_${Date.now()}`,
        status: 'pending',
        recordIds,
        totalRecords: recordIds.length,
        isLocked: false,
        deliveryApproved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const packageApprovals = await this.getPackageApprovals();
      packageApprovals[packageApproval.id] = packageApproval;
      this.savePackageApprovals(packageApprovals);

      // Log audit entry
      await this.logAudit('package_approval_created', {
        packageApprovalId: packageApproval.id,
        requestId,
        packageId: packageApproval.packageId,
        totalRecords: recordIds.length,
      });

      return packageApproval;
    } catch (error) {
      console.error('Failed to create package approval:', error);
      throw new Error('Failed to create package approval');
    }
  }

  /**
   * Submit package approval decision
   */
  async submitPackageApproval(
    packageApprovalId: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    reviewerId: string,
    reviewerName: string,
    reason?: string,
    comments?: string
  ): Promise<PackageApproval> {
    try {
      const packageApprovals = await this.getPackageApprovals();
      const packageApproval = packageApprovals[packageApprovalId];

      if (!packageApproval) {
        throw new Error('Package approval not found');
      }

      packageApproval.status = decision;
      packageApproval.reviewerId = reviewerId;
      packageApproval.reviewerName = reviewerName;
      packageApproval.reason = reason;
      packageApproval.comments = comments;
      packageApproval.updatedAt = new Date().toISOString();

      if (decision === 'approved') {
        packageApproval.approvedAt = new Date().toISOString();
        packageApproval.isLocked = true;
        packageApproval.lockTimestamp = new Date().toISOString();
        packageApproval.deliveryApproved = true;
      } else if (decision === 'rejected') {
        packageApproval.rejectedAt = new Date().toISOString();
      }

      packageApprovals[packageApprovalId] = packageApproval;
      this.savePackageApprovals(packageApprovals);

      // Log audit entry
      await this.logAudit('package_approved', {
        packageApprovalId,
        packageId: packageApproval.packageId,
        requestId: packageApproval.requestId,
        decision,
        reviewerId,
        reviewerName,
        isLocked: packageApproval.isLocked,
      });

      return packageApproval;
    } catch (error) {
      console.error('Failed to submit package approval:', error);
      throw new Error('Failed to submit package approval');
    }
  }

  /**
   * Get package approval by ID
   */
  async getPackageApproval(packageApprovalId: string): Promise<PackageApproval | null> {
    try {
      const packageApprovals = await this.getPackageApprovals();
      return packageApprovals[packageApprovalId] || null;
    } catch (error) {
      console.error('Failed to get package approval:', error);
      return null;
    }
  }

  /**
   * Get package approvals by request ID
   */
  async getPackageApprovalsByRequest(requestId: string): Promise<PackageApproval[]> {
    try {
      const packageApprovals = await this.getPackageApprovals();
      return Object.values(packageApprovals)
        .filter(pa => pa.requestId === requestId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get package approvals by request:', error);
      return [];
    }
  }

  /**
   * Get all pending package approvals
   */
  async getPendingPackageApprovals(): Promise<PackageApproval[]> {
    try {
      const packageApprovals = await this.getPackageApprovals();
      return Object.values(packageApprovals)
        .filter(pa => pa.status === 'pending' || pa.status === 'under_review')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get pending package approvals:', error);
      return [];
    }
  }

  /**
   * Lock package for delivery
   */
  async lockPackage(packageApprovalId: string): Promise<PackageApproval> {
    try {
      const packageApprovals = await this.getPackageApprovals();
      const packageApproval = packageApprovals[packageApprovalId];

      if (!packageApproval) {
        throw new Error('Package approval not found');
      }

      if (packageApproval.status !== 'approved') {
        throw new Error('Package must be approved before locking');
      }

      packageApproval.isLocked = true;
      packageApproval.lockTimestamp = new Date().toISOString();
      packageApproval.updatedAt = new Date().toISOString();

      packageApprovals[packageApprovalId] = packageApproval;
      this.savePackageApprovals(packageApprovals);

      // Log audit entry
      await this.logAudit('package_locked', {
        packageApprovalId,
        packageId: packageApproval.packageId,
        requestId: packageApproval.requestId,
        lockTimestamp: packageApproval.lockTimestamp,
      });

      return packageApproval;
    } catch (error) {
      console.error('Failed to lock package:', error);
      throw new Error('Failed to lock package');
    }
  }

  /**
   * Get legal review summary statistics
   */
  async getLegalReviewSummary(): Promise<LegalReviewSummary> {
    try {
      const [threads, changeRequests, packageApprovals] = await Promise.all([
        this.getCommentThreads(),
        this.getChangeRequests(),
        this.getPackageApprovals(),
      ]);

      const threadsList = Object.values(threads);
      const changeRequestsList = Object.values(changeRequests);
      const packageApprovalsList = Object.values(packageApprovals);

      return {
        totalThreads: threadsList.length,
        openThreads: threadsList.filter(t => t.status === 'open').length,
        resolvedThreads: threadsList.filter(t => t.status === 'resolved').length,
        pendingChangeRequests: changeRequestsList.filter(cr => cr.status === 'pending').length,
        completedChangeRequests: changeRequestsList.filter(cr => cr.status === 'completed').length,
        packagesAwaitingApproval: packageApprovalsList.filter(pa => 
          pa.status === 'pending' || pa.status === 'under_review'
        ).length,
        approvedPackages: packageApprovalsList.filter(pa => pa.status === 'approved').length,
        averageReviewTime: this.calculateAverageReviewTime(packageApprovalsList),
      };
    } catch (error) {
      console.error('Failed to get legal review summary:', error);
      return {
        totalThreads: 0,
        openThreads: 0,
        resolvedThreads: 0,
        pendingChangeRequests: 0,
        completedChangeRequests: 0,
        packagesAwaitingApproval: 0,
        approvedPackages: 0,
        averageReviewTime: 0,
      };
    }
  }

  // Private helper methods

  private async getCommentThreads(): Promise<Record<string, CommentThread>> {
    try {
      const stored = localStorage.getItem(this.COMMENT_THREADS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load comment threads:', error);
      return {};
    }
  }

  private saveCommentThreads(threads: Record<string, CommentThread>): void {
    try {
      localStorage.setItem(this.COMMENT_THREADS_KEY, JSON.stringify(threads));
    } catch (error) {
      console.error('Failed to save comment threads:', error);
    }
  }

  private async getChangeRequests(): Promise<Record<string, ChangeRequest>> {
    try {
      const stored = localStorage.getItem(this.CHANGE_REQUESTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load change requests:', error);
      return {};
    }
  }

  private saveChangeRequests(changeRequests: Record<string, ChangeRequest>): void {
    try {
      localStorage.setItem(this.CHANGE_REQUESTS_KEY, JSON.stringify(changeRequests));
    } catch (error) {
      console.error('Failed to save change requests:', error);
    }
  }

  private async getPackageApprovals(): Promise<Record<string, PackageApproval>> {
    try {
      const stored = localStorage.getItem(this.PACKAGE_APPROVALS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load package approvals:', error);
      return {};
    }
  }

  private savePackageApprovals(packageApprovals: Record<string, PackageApproval>): void {
    try {
      localStorage.setItem(this.PACKAGE_APPROVALS_KEY, JSON.stringify(packageApprovals));
    } catch (error) {
      console.error('Failed to save package approvals:', error);
    }
  }

  private calculateAverageReviewTime(packageApprovals: PackageApproval[]): number {
    const completedApprovals = packageApprovals.filter(pa => 
      pa.approvedAt && (pa.status === 'approved' || pa.status === 'rejected')
    );

    if (completedApprovals.length === 0) return 0;

    const totalHours = completedApprovals.reduce((sum, pa) => {
      const created = new Date(pa.createdAt).getTime();
      const completed = new Date(pa.approvedAt || pa.rejectedAt!).getTime();
      const hours = (completed - created) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round((totalHours / completedApprovals.length) * 100) / 100;
  }

  private async logAudit(action: string, details: any): Promise<void> {
    try {
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        service: 'LegalReviewService',
      };

      const stored = localStorage.getItem(this.AUDIT_KEY);
      const auditLog = stored ? JSON.parse(stored) : [];
      auditLog.push(auditEntry);

      // Keep only last 1000 entries
      if (auditLog.length > 1000) {
        auditLog.splice(0, auditLog.length - 1000);
      }

      localStorage.setItem(this.AUDIT_KEY, JSON.stringify(auditLog));
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }
}

// Export singleton instance
export const legalReviewService = new LegalReviewService();
export { LegalReviewService };