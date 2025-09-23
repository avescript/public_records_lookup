// Decision persistence service for AI match candidates
// Handles accept/reject decisions and tracks decision history

export interface CandidateDecision {
  candidateId: string;
  requestId: string;
  status: 'accepted' | 'rejected';
  decidedBy: string; // Staff member ID or email
  decidedAt: string; // ISO timestamp
  notes?: string; // Optional decision notes
}

export interface DecisionHistory {
  requestId: string;
  decisions: CandidateDecision[];
  lastUpdated: string;
}

// Mock implementation for Phase 0 development
// In production, this would integrate with Firebase/Firestore
class CandidateDecisionService {
  private decisions: Map<string, DecisionHistory> = new Map();

  /**
   * Records a decision for a specific candidate
   */
  async recordDecision(decision: Omit<CandidateDecision, 'decidedAt'>): Promise<void> {
    try {
      const fullDecision: CandidateDecision = {
        ...decision,
        decidedAt: new Date().toISOString(),
      };

      // Get or create decision history for this request
      const requestId = decision.requestId;
      let history = this.decisions.get(requestId) || {
        requestId,
        decisions: [],
        lastUpdated: new Date().toISOString(),
      };

      // Remove any existing decision for this candidate (allow changing decisions)
      history.decisions = history.decisions.filter(
        d => d.candidateId !== decision.candidateId
      );

      // Add the new decision
      history.decisions.push(fullDecision);
      history.lastUpdated = new Date().toISOString();

      this.decisions.set(requestId, history);

      console.log(`Decision recorded: ${decision.status} for candidate ${decision.candidateId}`);
    } catch (error) {
      console.error('Failed to record decision:', error);
      throw new Error('Failed to save decision. Please try again.');
    }
  }

  /**
   * Gets all decisions for a specific request
   */
  async getDecisionHistory(requestId: string): Promise<DecisionHistory | null> {
    try {
      return this.decisions.get(requestId) || null;
    } catch (error) {
      console.error('Failed to get decision history:', error);
      throw new Error('Failed to load decision history.');
    }
  }

  /**
   * Gets the decision status for a specific candidate
   */
  async getCandidateDecision(requestId: string, candidateId: string): Promise<CandidateDecision | null> {
    try {
      const history = await this.getDecisionHistory(requestId);
      if (!history) return null;

      return history.decisions.find(d => d.candidateId === candidateId) || null;
    } catch (error) {
      console.error('Failed to get candidate decision:', error);
      return null;
    }
  }

  /**
   * Accepts a match candidate
   */
  async acceptCandidate(
    requestId: string, 
    candidateId: string, 
    decidedBy: string, 
    notes?: string
  ): Promise<void> {
    await this.recordDecision({
      candidateId,
      requestId,
      status: 'accepted',
      decidedBy,
      notes,
    });
  }

  /**
   * Rejects a match candidate
   */
  async rejectCandidate(
    requestId: string, 
    candidateId: string, 
    decidedBy: string, 
    notes?: string
  ): Promise<void> {
    await this.recordDecision({
      candidateId,
      requestId,
      status: 'rejected',
      decidedBy,
      notes,
    });
  }

  /**
   * Gets summary statistics for decisions on a request
   */
  async getDecisionSummary(requestId: string): Promise<{
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  }> {
    try {
      const history = await this.getDecisionHistory(requestId);
      if (!history) {
        return { total: 0, accepted: 0, rejected: 0, pending: 0 };
      }

      const accepted = history.decisions.filter(d => d.status === 'accepted').length;
      const rejected = history.decisions.filter(d => d.status === 'rejected').length;
      const total = history.decisions.length;

      return {
        total,
        accepted,
        rejected,
        pending: Math.max(0, total - accepted - rejected), // Assuming some total number of candidates
      };
    } catch (error) {
      console.error('Failed to get decision summary:', error);
      return { total: 0, accepted: 0, rejected: 0, pending: 0 };
    }
  }

  /**
   * Clears all decisions (for testing purposes)
   */
  async clearAllDecisions(): Promise<void> {
    this.decisions.clear();
  }
}

// Export singleton instance
export const candidateDecisionService = new CandidateDecisionService();

// Export class for testing
export { CandidateDecisionService };