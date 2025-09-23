import { candidateDecisionService, CandidateDecision } from '../candidateDecisionService';

describe('candidateDecisionService', () => {
  const mockRequestId = 'request-123';
  const mockCandidateId = 'candidate-456';
  const mockUser = 'test-user@example.com';

  beforeEach(() => {
    // Clear all decisions before each test
    candidateDecisionService.clearAllDecisions();
    // Clear console.error calls in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('recordDecision', () => {
    it('should record a new acceptance decision', async () => {
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
        notes: 'Great match for our criteria',
      });

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision).toEqual({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
        decidedAt: expect.any(String),
        notes: 'Great match for our criteria',
      });
    });

    it('should record a new rejection decision', async () => {
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'rejected',
        decidedBy: mockUser,
        notes: 'Does not meet location requirements',
      });

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision).toEqual({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'rejected',
        decidedBy: mockUser,
        decidedAt: expect.any(String),
        notes: 'Does not meet location requirements',
      });
    });

    it('should record a decision without notes', async () => {
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
      });

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision?.notes).toBeUndefined();
    });

    it('should update existing decision for same candidate', async () => {
      // Record initial decision
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
        notes: 'Initial acceptance',
      });

      // Update decision
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'rejected',
        decidedBy: mockUser,
        notes: 'Changed mind after review',
      });

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision?.status).toBe('rejected');
      expect(decision?.notes).toBe('Changed mind after review');

      // Verify only one decision exists for this candidate
      const history = await candidateDecisionService.getDecisionHistory(mockRequestId);
      expect(history?.decisions).toHaveLength(1);
    });
  });

  describe('getCandidateDecision', () => {
    it('should return existing decision for candidate', async () => {
      // Record a decision first
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
        notes: 'Test decision',
      });

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision).toEqual({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
        decidedAt: expect.any(String),
        notes: 'Test decision',
      });
    });

    it('should return null for non-existent decision', async () => {
      const decision = await candidateDecisionService.getCandidateDecision(
        'non-existent-request',
        'non-existent-candidate'
      );

      expect(decision).toBeNull();
    });
  });

  describe('getDecisionHistory', () => {
    it('should return all decisions for a request', async () => {
      // Record multiple decisions
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: 'candidate-1',
        status: 'accepted',
        decidedBy: mockUser,
      });
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: 'candidate-2',
        status: 'rejected',
        decidedBy: mockUser,
      });
      await candidateDecisionService.recordDecision({
        requestId: 'other-request',
        candidateId: 'candidate-3',
        status: 'accepted',
        decidedBy: mockUser,
      });

      const history = await candidateDecisionService.getDecisionHistory(mockRequestId);

      expect(history).not.toBeNull();
      expect(history?.decisions).toHaveLength(2);
      expect(history?.decisions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ candidateId: 'candidate-1' }),
          expect.objectContaining({ candidateId: 'candidate-2' }),
        ])
      );
      // Should not include decision from other request
      expect(history?.decisions).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ candidateId: 'candidate-3' }),
        ])
      );
    });

    it('should return null for request with no decisions', async () => {
      const history = await candidateDecisionService.getDecisionHistory('no-decisions-request');
      expect(history).toBeNull();
    });

    it('should have lastUpdated timestamp', async () => {
      await candidateDecisionService.recordDecision({
        requestId: mockRequestId,
        candidateId: mockCandidateId,
        status: 'accepted',
        decidedBy: mockUser,
      });

      const history = await candidateDecisionService.getDecisionHistory(mockRequestId);

      expect(history?.lastUpdated).toBeDefined();
      expect(() => new Date(history!.lastUpdated)).not.toThrow();
    });
  });

  describe('acceptCandidate', () => {
    it('should create acceptance decision', async () => {
      await candidateDecisionService.acceptCandidate(
        mockRequestId,
        mockCandidateId,
        mockUser,
        'Excellent qualifications'
      );

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision?.status).toBe('accepted');
      expect(decision?.decidedBy).toBe(mockUser);
      expect(decision?.notes).toBe('Excellent qualifications');
    });

    it('should create acceptance decision without notes', async () => {
      await candidateDecisionService.acceptCandidate(
        mockRequestId,
        mockCandidateId,
        mockUser
      );

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision?.status).toBe('accepted');
      expect(decision?.notes).toBeUndefined();
    });
  });

  describe('rejectCandidate', () => {
    it('should create rejection decision', async () => {
      await candidateDecisionService.rejectCandidate(
        mockRequestId,
        mockCandidateId,
        mockUser,
        'Missing required experience'
      );

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(decision?.status).toBe('rejected');
      expect(decision?.decidedBy).toBe(mockUser);
      expect(decision?.notes).toBe('Missing required experience');
    });
  });

  describe('getDecisionSummary', () => {
    it('should return correct summary for request with mixed decisions', async () => {
      // Record various decisions
      await candidateDecisionService.acceptCandidate(mockRequestId, 'candidate-1', mockUser);
      await candidateDecisionService.acceptCandidate(mockRequestId, 'candidate-2', mockUser);
      await candidateDecisionService.rejectCandidate(mockRequestId, 'candidate-3', mockUser);
      await candidateDecisionService.rejectCandidate(mockRequestId, 'candidate-4', mockUser);
      await candidateDecisionService.rejectCandidate(mockRequestId, 'candidate-5', mockUser);

      const summary = await candidateDecisionService.getDecisionSummary(mockRequestId);

      expect(summary).toEqual({
        total: 5,
        accepted: 2,
        rejected: 3,
        pending: 0,
      });
    });

    it('should return correct summary for request with only acceptances', async () => {
      await candidateDecisionService.acceptCandidate(mockRequestId, 'candidate-1', mockUser);
      await candidateDecisionService.acceptCandidate(mockRequestId, 'candidate-2', mockUser);

      const summary = await candidateDecisionService.getDecisionSummary(mockRequestId);

      expect(summary).toEqual({
        total: 2,
        accepted: 2,
        rejected: 0,
        pending: 0,
      });
    });

    it('should return correct summary for request with only rejections', async () => {
      await candidateDecisionService.rejectCandidate(mockRequestId, 'candidate-1', mockUser);
      await candidateDecisionService.rejectCandidate(mockRequestId, 'candidate-2', mockUser);

      const summary = await candidateDecisionService.getDecisionSummary(mockRequestId);

      expect(summary).toEqual({
        total: 2,
        accepted: 0,
        rejected: 2,
        pending: 0,
      });
    });

    it('should return zero summary for request with no decisions', async () => {
      const summary = await candidateDecisionService.getDecisionSummary('no-decisions-request');

      expect(summary).toEqual({
        total: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
      });
    });
  });

  describe('clearAllDecisions', () => {
    it('should clear all decisions', async () => {
      // Record decisions for multiple requests
      await candidateDecisionService.acceptCandidate(mockRequestId, 'candidate-1', mockUser);
      await candidateDecisionService.acceptCandidate('other-request', 'candidate-2', mockUser);

      // Clear all decisions
      await candidateDecisionService.clearAllDecisions();

      // Verify all decisions are cleared
      const history1 = await candidateDecisionService.getDecisionHistory(mockRequestId);
      const history2 = await candidateDecisionService.getDecisionHistory('other-request');
      
      expect(history1).toBeNull();
      expect(history2).toBeNull();
    });
  });

  describe('edge cases and validation', () => {
    it('should handle valid ISO date strings', async () => {
      await candidateDecisionService.acceptCandidate(
        mockRequestId,
        mockCandidateId,
        mockUser
      );

      const decision = await candidateDecisionService.getCandidateDecision(
        mockRequestId,
        mockCandidateId
      );

      expect(() => new Date(decision!.decidedAt)).not.toThrow();
      expect(new Date(decision!.decidedAt).toISOString()).toBe(decision!.decidedAt);
    });

    it('should handle empty request and candidate IDs gracefully', async () => {
      const decision = await candidateDecisionService.getCandidateDecision('', '');
      expect(decision).toBeNull();
    });
  });
});