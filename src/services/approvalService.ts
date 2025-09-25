/**
 * Approval Service
 * Manages the human approval workflow for redacted documents (US-042)
 * Follows established service patterns with comprehensive error handling
 */

export interface ApprovalDecision {
  id: string;
  recordId: string;
  fileName: string;
  reviewerId: string;
  reviewerName: string;
  decision: 'approved' | 'rejected' | 'needs_revision';
  reason?: string;
  comments?: string;
  timestamp: string;
  redactionVersionId: string;
  reviewDuration?: number; // minutes spent reviewing
}

export interface ApprovalWorkflow {
  recordId: string;
  fileName: string;
  status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'revision_needed';
  assignedReviewer?: string;
  currentDecision?: ApprovalDecision;
  reviewHistory: ApprovalDecision[];
  submittedAt: string;
  completedAt?: string;
  totalRedactions: number;
  redactionVersionId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ApprovalSummary {
  totalPending: number;
  totalUnderReview: number;
  totalApproved: number;
  totalRejected: number;
  averageReviewTime: number; // in minutes
  overdueReviews: number;
}

class ApprovalService {
  private readonly STORAGE_KEY = 'public_records_approvals';
  private readonly WORKFLOW_KEY = 'approval_workflows';

  /**
   * Submit document for approval review
   */
  async submitForApproval(
    recordId: string,
    fileName: string,
    redactionVersionId: string,
    totalRedactions: number,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<ApprovalWorkflow> {
    try {
      const workflow: ApprovalWorkflow = {
        recordId,
        fileName,
        status: 'pending_review',
        reviewHistory: [],
        submittedAt: new Date().toISOString(),
        totalRedactions,
        redactionVersionId,
        priority,
      };

      const workflows = await this.getWorkflows();
      workflows[`${recordId}_${fileName}`] = workflow;
      this.saveWorkflows(workflows);

      return workflow;
    } catch (error) {
      console.error('Failed to submit for approval:', error);
      throw new Error('Failed to submit document for approval');
    }
  }

  /**
   * Assign reviewer to a pending document
   */
  async assignReviewer(
    recordId: string,
    fileName: string,
    reviewerId: string
  ): Promise<ApprovalWorkflow> {
    try {
      const workflows = await this.getWorkflows();
      const key = `${recordId}_${fileName}`;
      const workflow = workflows[key];

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'pending_review') {
        throw new Error('Document is not available for assignment');
      }

      workflow.assignedReviewer = reviewerId;
      workflow.status = 'under_review';
      
      workflows[key] = workflow;
      this.saveWorkflows(workflows);

      return workflow;
    } catch (error) {
      console.error('Failed to assign reviewer:', error);
      throw new Error('Failed to assign reviewer');
    }
  }

  /**
   * Submit approval decision
   */
  async submitDecision(
    recordId: string,
    fileName: string,
    decision: 'approved' | 'rejected' | 'needs_revision',
    reviewerId: string,
    reviewerName: string,
    reason?: string,
    comments?: string,
    reviewDuration?: number
  ): Promise<ApprovalDecision> {
    try {
      const workflows = await this.getWorkflows();
      const key = `${recordId}_${fileName}`;
      const workflow = workflows[key];

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'under_review') {
        throw new Error('Document is not under review');
      }

      const approvalDecision: ApprovalDecision = {
        id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recordId,
        fileName,
        reviewerId,
        reviewerName,
        decision,
        reason,
        comments,
        timestamp: new Date().toISOString(),
        redactionVersionId: workflow.redactionVersionId,
        reviewDuration,
      };

      // Update workflow status based on decision
      switch (decision) {
        case 'approved':
          workflow.status = 'approved';
          workflow.completedAt = new Date().toISOString();
          break;
        case 'rejected':
          workflow.status = 'rejected';
          workflow.completedAt = new Date().toISOString();
          break;
        case 'needs_revision':
          workflow.status = 'revision_needed';
          break;
      }

      workflow.currentDecision = approvalDecision;
      workflow.reviewHistory.push(approvalDecision);
      
      workflows[key] = workflow;
      this.saveWorkflows(workflows);

      // Also save individual decision
      const decisions = await this.getDecisions();
      decisions[approvalDecision.id] = approvalDecision;
      this.saveDecisions(decisions);

      return approvalDecision;
    } catch (error) {
      console.error('Failed to submit decision:', error);
      throw new Error('Failed to submit approval decision');
    }
  }

  /**
   * Get workflow for a document
   */
  async getWorkflow(recordId: string, fileName: string): Promise<ApprovalWorkflow | null> {
    try {
      const workflows = await this.getWorkflows();
      return workflows[`${recordId}_${fileName}`] || null;
    } catch (error) {
      console.error('Failed to get workflow:', error);
      return null;
    }
  }

  /**
   * Get all workflows with optional filtering
   */
  async getAllWorkflows(
    status?: ApprovalWorkflow['status'],
    reviewerId?: string
  ): Promise<ApprovalWorkflow[]> {
    try {
      const workflows = await this.getWorkflows();
      let results = Object.values(workflows);

      if (status) {
        results = results.filter(w => w.status === status);
      }

      if (reviewerId) {
        results = results.filter(w => w.assignedReviewer === reviewerId);
      }

      // Sort by priority and submission date
      return results.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
    } catch (error) {
      console.error('Failed to get workflows:', error);
      return [];
    }
  }

  /**
   * Get approval summary statistics
   */
  async getApprovalSummary(): Promise<ApprovalSummary> {
    try {
      const workflows = await this.getAllWorkflows();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const summary: ApprovalSummary = {
        totalPending: workflows.filter(w => w.status === 'pending_review').length,
        totalUnderReview: workflows.filter(w => w.status === 'under_review').length,
        totalApproved: workflows.filter(w => w.status === 'approved').length,
        totalRejected: workflows.filter(w => w.status === 'rejected').length,
        averageReviewTime: 0,
        overdueReviews: 0,
      };

      // Calculate average review time from completed workflows
      const completedWorkflows = workflows.filter(w => 
        w.status === 'approved' || w.status === 'rejected'
      );

      if (completedWorkflows.length > 0) {
        const totalReviewTime = completedWorkflows.reduce((sum, workflow) => {
          if (workflow.completedAt) {
            const reviewTime = new Date(workflow.completedAt).getTime() - 
                             new Date(workflow.submittedAt).getTime();
            return sum + (reviewTime / (1000 * 60)); // Convert to minutes
          }
          return sum;
        }, 0);

        summary.averageReviewTime = Math.round(totalReviewTime / completedWorkflows.length);
      }

      // Count overdue reviews (under review for more than 24 hours)
      summary.overdueReviews = workflows.filter(w => 
        w.status === 'under_review' && 
        new Date(w.submittedAt) < oneDayAgo
      ).length;

      return summary;
    } catch (error) {
      console.error('Failed to get approval summary:', error);
      return {
        totalPending: 0,
        totalUnderReview: 0,
        totalApproved: 0,
        totalRejected: 0,
        averageReviewTime: 0,
        overdueReviews: 0,
      };
    }
  }

  /**
   * Get decisions by reviewer
   */
  async getDecisionsByReviewer(reviewerId: string): Promise<ApprovalDecision[]> {
    try {
      const decisions = await this.getDecisions();
      return Object.values(decisions)
        .filter(d => d.reviewerId === reviewerId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get decisions by reviewer:', error);
      return [];
    }
  }

  // Private helper methods
  private async getWorkflows(): Promise<Record<string, ApprovalWorkflow>> {
    try {
      const stored = localStorage.getItem(this.WORKFLOW_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load workflows from storage:', error);
      return {};
    }
  }

  private saveWorkflows(workflows: Record<string, ApprovalWorkflow>): void {
    try {
      localStorage.setItem(this.WORKFLOW_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to save workflows to storage:', error);
      throw new Error('Failed to persist workflow data');
    }
  }

  private async getDecisions(): Promise<Record<string, ApprovalDecision>> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load decisions from storage:', error);
      return {};
    }
  }

  private saveDecisions(decisions: Record<string, ApprovalDecision>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(decisions));
    } catch (error) {
      console.error('Failed to save decisions to storage:', error);
      throw new Error('Failed to persist decision data');
    }
  }
}

// Export singleton instance
export const approvalService = new ApprovalService();
export { ApprovalService };