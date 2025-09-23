import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchResults } from '../index';
import { MatchResult, MatchCandidate } from '../../../../services/aiMatchingService';
import { candidateDecisionService } from '../../../../services/candidateDecisionService';

// Mock the decision service
jest.mock('../../../../services/candidateDecisionService', () => ({
  candidateDecisionService: {
    getDecisionHistory: jest.fn(),
    acceptCandidate: jest.fn(),
    rejectCandidate: jest.fn(),
    clearAllDecisions: jest.fn(),
  },
}));

const mockCandidateDecisionService = candidateDecisionService as jest.Mocked<typeof candidateDecisionService>;

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2024-01-15 at 2:30 PM'),
}));

describe('MatchResults Component', () => {
  const mockCandidate: MatchCandidate = {
    id: 'candidate-123',
    title: 'Software Engineer Incident Report',
    description: 'Incident report involving software engineer with 5+ years in React and Node.js',
    source: 'Police Reports',
    relevanceScore: 0.92,
    confidence: 'high' as const,
    keyPhrases: ['software engineer', 'react', 'node.js'],
    distanceScore: 0.15,
    recordType: 'incident_report',
    dateCreated: '2024-01-10T00:00:00Z',
    agency: 'SFPD',
    metadata: {
      fileSize: '2.5MB',
      pageCount: 3,
      lastModified: '2024-01-10T00:00:00Z',
      classification: 'public',
    },
  };

  const mockMatchResult: MatchResult = {
    requestId: 'request-456',
    candidates: [mockCandidate],
    explanation: {
      queryTerms: ['software engineer', 'react', 'node.js'],
      matchedPhrases: ['software engineer', 'react'],
      semanticSimilarity: 0.92,
      keywordOverlap: 0.8,
      contextualRelevance: 0.85,
      reasoningSummary: 'High relevance match based on job title and technical skills',
    },
    searchMetadata: {
      totalCandidatesScanned: 150,
      processingTimeMs: 250,
      confidenceThreshold: 0.7,
      searchTimestamp: '2024-01-15T10:00:00Z',
    },
  };

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    matchResult: mockMatchResult,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCandidateDecisionService.getDecisionHistory.mockResolvedValue(null);
  });

  describe('Basic Rendering', () => {
    it('should render match results dialog when open', () => {
      render(<MatchResults {...defaultProps} />);
      
      expect(screen.getByText('AI Record Matches')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer Incident Report')).toBeInTheDocument();
      expect(screen.getByText('92% match')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<MatchResults {...defaultProps} open={false} />);
      
      expect(screen.queryByText('AI Record Matches')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<MatchResults {...defaultProps} loading={true} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(<MatchResults {...defaultProps} error="Search failed" />);
      
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });

    it('should show no results message when candidates array is empty', () => {
      const emptyResult = { 
        ...mockMatchResult, 
        candidates: [],
        searchMetadata: {
          ...mockMatchResult.searchMetadata,
          totalCandidatesScanned: 0,
        },
      };
      render(<MatchResults {...defaultProps} matchResult={emptyResult} />);
      
      // Should show 0 matches in the chip
      expect(screen.getByText('0 matches')).toBeInTheDocument();
    });
  });

  describe('Decision Loading', () => {
    it('should load existing decisions on mount', async () => {
      const mockDecision = {
        candidateId: 'candidate-123',
        requestId: 'request-456',
        status: 'accepted' as const,
        decidedBy: 'test-user',
        decidedAt: '2024-01-15T14:30:00Z',
        notes: 'Great candidate',
      };

      mockCandidateDecisionService.getDecisionHistory.mockResolvedValue({
        requestId: 'request-456',
        decisions: [mockDecision],
        lastUpdated: '2024-01-15T14:30:00Z',
      });

      render(<MatchResults {...defaultProps} />);

      await waitFor(() => {
        expect(mockCandidateDecisionService.getDecisionHistory).toHaveBeenCalledWith('request-456');
      });

      // Should show decision status - use getAllByText since text appears in multiple places
      const acceptedElements = screen.getAllByText('Accepted');
      expect(acceptedElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Accepted by test-user on 2024-01-15 at 2:30 PM')).toBeInTheDocument();
    });

    it('should handle decision loading errors gracefully', async () => {
      mockCandidateDecisionService.getDecisionHistory.mockRejectedValue(
        new Error('Failed to load decisions')
      );

      render(<MatchResults {...defaultProps} />);

      await waitFor(() => {
        expect(mockCandidateDecisionService.getDecisionHistory).toHaveBeenCalled();
      });

      // Should still render the component without crashing
      expect(screen.getByText('Software Engineer Incident Report')).toBeInTheDocument();
    });
  });

  describe('Decision Actions', () => {
    it('should show accept and reject buttons for undecided candidates', () => {
      render(<MatchResults {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('should handle accept action successfully', async () => {
      mockCandidateDecisionService.acceptCandidate.mockResolvedValue();
      
      render(<MatchResults {...defaultProps} />);
      
      const acceptButton = screen.getByRole('button', { name: /accept/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockCandidateDecisionService.acceptCandidate).toHaveBeenCalledWith(
          'request-456',
          'candidate-123',
          'current-user'
        );
      });
    });

    it('should handle reject action successfully', async () => {
      mockCandidateDecisionService.rejectCandidate.mockResolvedValue();
      
      render(<MatchResults {...defaultProps} />);
      
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(mockCandidateDecisionService.rejectCandidate).toHaveBeenCalledWith(
          'request-456',
          'candidate-123',
          'current-user'
        );
      });
    });

    it('should call parent onAcceptMatch handler when provided', async () => {
      const onAcceptMatch = jest.fn();
      mockCandidateDecisionService.acceptCandidate.mockResolvedValue();
      
      render(<MatchResults {...defaultProps} onAcceptMatch={onAcceptMatch} />);
      
      const acceptButton = screen.getByRole('button', { name: /accept/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(onAcceptMatch).toHaveBeenCalledWith('candidate-123');
      });
    });

    it('should call parent onRejectMatch handler when provided', async () => {
      const onRejectMatch = jest.fn();
      mockCandidateDecisionService.rejectCandidate.mockResolvedValue();
      
      render(<MatchResults {...defaultProps} onRejectMatch={onRejectMatch} />);
      
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(onRejectMatch).toHaveBeenCalledWith('candidate-123');
      });
    });

    it('should handle accept action errors', async () => {
      mockCandidateDecisionService.acceptCandidate.mockRejectedValue(
        new Error('Failed to accept candidate')
      );
      
      render(<MatchResults {...defaultProps} />);
      
      const acceptButton = screen.getByRole('button', { name: /accept/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockCandidateDecisionService.acceptCandidate).toHaveBeenCalled();
      });

      // Component should handle error gracefully (no crash)
      expect(screen.getByText('Software Engineer Incident Report')).toBeInTheDocument();
    });

    it('should handle reject action errors', async () => {
      mockCandidateDecisionService.rejectCandidate.mockRejectedValue(
        new Error('Failed to reject candidate')
      );
      
      render(<MatchResults {...defaultProps} />);
      
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(mockCandidateDecisionService.rejectCandidate).toHaveBeenCalled();
      });

      // Component should handle error gracefully (no crash)
      expect(screen.getByText('Software Engineer Incident Report')).toBeInTheDocument();
    });
  });

  describe('Decision Status Display', () => {
    it('should show accepted status and allow changing to reject', async () => {
      const mockDecision = {
        candidateId: 'candidate-123',
        requestId: 'request-456',
        status: 'accepted' as const,
        decidedBy: 'test-user',
        decidedAt: '2024-01-15T14:30:00Z',
      };

      mockCandidateDecisionService.getDecisionHistory.mockResolvedValue({
        requestId: 'request-456',
        decisions: [mockDecision],
        lastUpdated: '2024-01-15T14:30:00Z',
      });

      render(<MatchResults {...defaultProps} />);

      await waitFor(() => {
        // Look for Accepted text in the chip
        const acceptedElements = screen.getAllByText('Accepted');
        expect(acceptedElements.length).toBeGreaterThan(0);
      });

      // Should show "Reject Instead" button
      expect(screen.getByRole('button', { name: /reject instead/i })).toBeInTheDocument();
    });

    it('should show rejected status and allow changing to accept', async () => {
      const mockDecision = {
        candidateId: 'candidate-123',
        requestId: 'request-456',
        status: 'rejected' as const,
        decidedBy: 'test-user',
        decidedAt: '2024-01-15T14:30:00Z',
      };

      mockCandidateDecisionService.getDecisionHistory.mockResolvedValue({
        requestId: 'request-456',
        decisions: [mockDecision],
        lastUpdated: '2024-01-15T14:30:00Z',
      });

      render(<MatchResults {...defaultProps} />);

      await waitFor(() => {
        // Look for Rejected text in the chip
        const rejectedElements = screen.getAllByText('Rejected');
        expect(rejectedElements.length).toBeGreaterThan(0);
      });

      // Should show "Accept Instead" button
      expect(screen.getByRole('button', { name: /accept instead/i })).toBeInTheDocument();
    });

    it('should display decision notes when available', async () => {
      const mockDecision = {
        candidateId: 'candidate-123',
        requestId: 'request-456',
        status: 'accepted' as const,
        decidedBy: 'test-user',
        decidedAt: '2024-01-15T14:30:00Z',
        notes: 'Excellent technical skills',
      };

      mockCandidateDecisionService.getDecisionHistory.mockResolvedValue({
        requestId: 'request-456',
        decisions: [mockDecision],
        lastUpdated: '2024-01-15T14:30:00Z',
      });

      render(<MatchResults {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Notes: Excellent technical skills')).toBeInTheDocument();
      });
    });

    it('should show decision status chip with correct colors', async () => {
      const acceptedDecision = {
        candidateId: 'candidate-123',
        requestId: 'request-456',
        status: 'accepted' as const,
        decidedBy: 'test-user',
        decidedAt: '2024-01-15T14:30:00Z',
      };

      mockCandidateDecisionService.getDecisionHistory.mockResolvedValue({
        requestId: 'request-456',
        decisions: [acceptedDecision],
        lastUpdated: '2024-01-15T14:30:00Z',
      });

      render(<MatchResults {...defaultProps} />);

      await waitFor(() => {
        // Find chip by its text content within the chip component
        const chips = screen.getAllByText('Accepted');
        const chipElement = chips.find(el => el.closest('.MuiChip-root'));
        expect(chipElement).toBeInTheDocument();
      });
    });
  });

  describe('View Details Button', () => {
    it('should call onViewDetails when provided', () => {
      const onViewDetails = jest.fn();
      
      render(<MatchResults {...defaultProps} onViewDetails={onViewDetails} />);
      
      const viewButton = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(viewButton);

      expect(onViewDetails).toHaveBeenCalledWith(mockCandidate);
    });

    it('should not crash when onViewDetails is not provided', () => {
      render(<MatchResults {...defaultProps} />);
      
      const viewButton = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(viewButton);

      // Should not crash - test passes if no error thrown
      expect(screen.getByText('Software Engineer Incident Report')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null matchResult gracefully', () => {
      render(<MatchResults {...defaultProps} matchResult={null} />);
      
      expect(screen.getByText('AI Record Matches')).toBeInTheDocument();
      // Should show dialog but no candidate count chip since no matchResult
    });

    it('should not attempt to load decisions when requestId is missing', () => {
      const matchResultWithoutId = { ...mockMatchResult, requestId: undefined as any };
      
      render(<MatchResults {...defaultProps} matchResult={matchResultWithoutId} />);
      
      expect(mockCandidateDecisionService.getDecisionHistory).not.toHaveBeenCalled();
    });

    it('should disable buttons when loading is true', () => {
      render(<MatchResults {...defaultProps} loading={true} />);
      
      // When loading, candidates aren't rendered, so buttons don't exist
      expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
      
      // Should show loading indicator instead
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Multiple Candidates', () => {
    it('should render multiple candidates with individual decision states', async () => {
      const candidate2: MatchCandidate = {
        ...mockCandidate,
        id: 'candidate-456',
        title: 'Senior Developer Incident Report',
      };

      const multiCandidateResult = {
        ...mockMatchResult,
        candidates: [mockCandidate, candidate2],
        searchMetadata: {
          ...mockMatchResult.searchMetadata,
          totalCandidatesScanned: 300,
        },
      };

      const mockDecisions = [
        {
          candidateId: 'candidate-123',
          requestId: 'request-456',
          status: 'accepted' as const,
          decidedBy: 'test-user',
          decidedAt: '2024-01-15T14:30:00Z',
        },
      ];

      mockCandidateDecisionService.getDecisionHistory.mockResolvedValue({
        requestId: 'request-456',
        decisions: mockDecisions,
        lastUpdated: '2024-01-15T14:30:00Z',
      });

      render(<MatchResults {...defaultProps} matchResult={multiCandidateResult} />);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer Incident Report')).toBeInTheDocument();
        expect(screen.getByText('Senior Developer Incident Report')).toBeInTheDocument();
      });

      // First candidate should show as accepted
      const acceptedElements = screen.getAllByText('Accepted');
      expect(acceptedElements.length).toBeGreaterThan(0);

      // Second candidate should still have accept/reject buttons
      const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
      expect(acceptButtons.length).toBeGreaterThan(0);
    });
  });
});