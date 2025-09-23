'use client';

import React, { useEffect, useState } from 'react';
import {
  Article as ArticleIcon,
  Assessment as AssessmentIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import { MatchCandidate, MatchResult } from '../../../services/aiMatchingService';
import { candidateDecisionService, CandidateDecision } from '../../../services/candidateDecisionService';

interface MatchResultsProps {
  open: boolean;
  onClose: () => void;
  matchResult: MatchResult | null;
  loading?: boolean;
  error?: string;
  onAcceptMatch?: (candidateId: string) => void;
  onRejectMatch?: (candidateId: string) => void;
  onViewDetails?: (candidate: MatchCandidate) => void;
}

export function MatchResults({
  open,
  onClose,
  matchResult,
  loading = false,
  error,
  onAcceptMatch,
  onRejectMatch,
  onViewDetails,
}: MatchResultsProps) {
  // State for tracking candidate decisions
  const [decisions, setDecisions] = useState<Map<string, CandidateDecision>>(new Map());
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Load existing decisions when matchResult changes
  useEffect(() => {
    const loadDecisions = async () => {
      if (!matchResult?.requestId) return;

      setLoadingDecisions(true);
      setDecisionError(null);

      try {
        const history = await candidateDecisionService.getDecisionHistory(matchResult.requestId);
        const decisionsMap = new Map<string, CandidateDecision>();
        
        if (history) {
          history.decisions.forEach(decision => {
            decisionsMap.set(decision.candidateId, decision);
          });
        }
        
        setDecisions(decisionsMap);
      } catch (err) {
        setDecisionError('Failed to load decision history');
        console.error('Error loading decisions:', err);
      } finally {
        setLoadingDecisions(false);
      }
    };

    loadDecisions();
  }, [matchResult?.requestId]);

  // Handle accept/reject with decision persistence
  const handleAcceptCandidate = async (candidateId: string) => {
    if (!matchResult?.requestId) return;

    try {
      setDecisionError(null);
      await candidateDecisionService.acceptCandidate(
        matchResult.requestId,
        candidateId,
        'current-user' // TODO: Get from auth context
      );

      // Update local state
      const decision: CandidateDecision = {
        candidateId,
        requestId: matchResult.requestId,
        status: 'accepted',
        decidedBy: 'current-user',
        decidedAt: new Date().toISOString(),
      };
      
      setDecisions(prev => new Map(prev.set(candidateId, decision)));

      // Call parent handler if provided
      onAcceptMatch?.(candidateId);
    } catch (err) {
      setDecisionError('Failed to accept candidate');
      console.error('Error accepting candidate:', err);
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    if (!matchResult?.requestId) return;

    try {
      setDecisionError(null);
      await candidateDecisionService.rejectCandidate(
        matchResult.requestId,
        candidateId,
        'current-user' // TODO: Get from auth context
      );

      // Update local state
      const decision: CandidateDecision = {
        candidateId,
        requestId: matchResult.requestId,
        status: 'rejected',
        decidedBy: 'current-user',
        decidedAt: new Date().toISOString(),
      };
      
      setDecisions(prev => new Map(prev.set(candidateId, decision)));

      // Call parent handler if provided
      onRejectMatch?.(candidateId);
    } catch (err) {
      setDecisionError('Failed to reject candidate');
      console.error('Error rejecting candidate:', err);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const formatDistance = (distance: number) => {
    return distance.toFixed(3);
  };

  const renderExplanation = () => {
    if (!matchResult?.explanation) return null;

    const { explanation } = matchResult;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Analysis
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Query Terms
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {explanation.queryTerms.map((term, index) => (
                <Chip key={index} label={term} size="small" variant="outlined" />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Matched Phrases
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {explanation.matchedPhrases.map((phrase, index) => (
                <Chip key={index} label={phrase} size="small" color="primary" />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Analysis Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {explanation.reasoningSummary}
            </Typography>
          </Grid>
          
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Semantic Similarity
            </Typography>
            <Typography variant="h6">
              {formatScore(explanation.semanticSimilarity)}
            </Typography>
          </Grid>
          
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Keyword Overlap
            </Typography>
            <Typography variant="h6">
              {formatScore(explanation.keywordOverlap)}
            </Typography>
          </Grid>
          
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Contextual Relevance
            </Typography>
            <Typography variant="h6">
              {formatScore(explanation.contextualRelevance)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderCandidateCard = (candidate: MatchCandidate) => {
    const decision = decisions.get(candidate.id);
    const hasDecision = decision !== undefined;
    const isAccepted = decision?.status === 'accepted';
    const isRejected = decision?.status === 'rejected';

    return (
      <Card key={candidate.id} elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 2 }}>
              {candidate.title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              {/* Decision Status Chip */}
              {hasDecision && (
                <Chip
                  icon={isAccepted ? <CheckCircleIcon /> : <CloseIcon />}
                  label={isAccepted ? 'Accepted' : 'Rejected'}
                  color={isAccepted ? 'success' : 'error'}
                  size="small"
                  variant="filled"
                />
              )}
              <Chip
                label={`${formatScore(candidate.relevanceScore)} match`}
                color={getConfidenceColor(candidate.confidence)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                Distance: {formatDistance(candidate.distanceScore)}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            {candidate.description}
          </Typography>

          {/* Show decision details if available */}
          {hasDecision && decision.decidedAt && (
            <Alert 
              severity={isAccepted ? 'success' : 'info'} 
              sx={{ mb: 2 }}
              variant="outlined"
            >
              <Typography variant="body2">
                {isAccepted ? 'Accepted' : 'Rejected'} by {decision.decidedBy} on{' '}
                {format(new Date(decision.decidedAt), 'MMM d, yyyy \'at\' h:mm a')}
                {decision.notes && (
                  <>
                    <br />
                    <em>Notes: {decision.notes}</em>
                  </>
                )}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2">{candidate.source}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Agency
              </Typography>
              <Typography variant="body2">{candidate.agency}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Record Type
              </Typography>
              <Typography variant="body2">{candidate.recordType}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Date Created
              </Typography>
              <Typography variant="body2">
                {format(new Date(candidate.dateCreated), 'MMM d, yyyy')}
              </Typography>
            </Grid>
          </Grid>

          {candidate.keyPhrases.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Key Matching Phrases
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {candidate.keyPhrases.map((phrase, index) => (
                  <Chip key={index} label={phrase} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {candidate.metadata && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                File Details
              </Typography>
              <Typography variant="body2">
                {candidate.metadata.fileSize}
                {candidate.metadata.pageCount && ` • ${candidate.metadata.pageCount} pages`}
                {candidate.metadata.classification && ` • ${candidate.metadata.classification}`}
              </Typography>
            </Box>
          )}
        </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => onViewDetails && onViewDetails(candidate)}
            sx={{ mr: 1 }}
          >
            View Details
          </Button>
          
          {!hasDecision ? (
            // Show accept/reject buttons if no decision made
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => handleAcceptCandidate(candidate.id)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => handleRejectCandidate(candidate.id)}
                disabled={loading}
              >
                Reject
              </Button>
            </>
          ) : (
            // Show decision status and allow changing decision
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isAccepted ? (
                <>
                  <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                    Accepted
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => handleRejectCandidate(candidate.id)}
                    disabled={loading}
                  >
                    Reject Instead
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="error.main" sx={{ mr: 1 }}>
                    Rejected
                  </Typography>
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={() => handleAcceptCandidate(candidate.id)}
                    disabled={loading}
                  >
                    Accept Instead
                  </Button>
                </>
              )}
            </Box>
          )}
        </CardActions>
      </Card>
    );
  };

  const renderEmptyState = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Matches Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No relevant records were found that match this request.
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 400, mx: 'auto' }}>
          Try refining your request description or check if the records you&apos;re looking for have been digitized.
        </Alert>
      </Box>
    );
  };

  const renderSearchMetadata = () => {
    if (!matchResult?.searchMetadata) return null;

    const { searchMetadata } = matchResult;

    return (
      <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', mb: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Search completed in {searchMetadata.processingTimeMs}ms • 
          Scanned {searchMetadata.totalCandidatesScanned} records • 
          Confidence threshold: {formatScore(searchMetadata.confidenceThreshold)}
        </Typography>
      </Paper>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          AI Record Matches
          {matchResult && (
            <Chip
              label={`${matchResult.candidates.length} matches`}
              size="small"
              color="primary"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Searching for matching records...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {matchResult && !loading && (
          <>
            {renderSearchMetadata()}
            {renderExplanation()}
            
            {matchResult.candidates.length === 0 ? (
              renderEmptyState()
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Candidate Records ({matchResult.candidates.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Results ranked by relevance. Review each match and accept the ones that are relevant to this request.
                </Typography>
                
                {matchResult.candidates.map(renderCandidateCard)}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}