'use client';

import React from 'react';
import {
  Article as ArticleIcon,
  Assessment as AssessmentIcon,
  Check as CheckIcon,
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

import { MatchCandidate,MatchResult } from '../../../services/aiMatchingService';

interface MatchResultsProps {
  open: boolean;
  onClose: () => void;
  matchResult: MatchResult | null;
  loading?: boolean;
  error?: string;
  onAcceptMatch?: (candidateId: string) => void;
  onRejectMatch?: (candidateId: string) => void;
}

export function MatchResults({
  open,
  onClose,
  matchResult,
  loading = false,
  error,
  onAcceptMatch,
  onRejectMatch,
}: MatchResultsProps) {
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
    return (
      <Card key={candidate.id} elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 2 }}>
              {candidate.title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
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

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            startIcon={<VisibilityIcon />}
            size="small"
            disabled
          >
            Preview
          </Button>
          <Box>
            {onRejectMatch && (
              <Button
                startIcon={<CloseIcon />}
                size="small"
                color="error"
                onClick={() => onRejectMatch(candidate.id)}
                sx={{ mr: 1 }}
              >
                Reject
              </Button>
            )}
            {onAcceptMatch && (
              <Button
                startIcon={<CheckIcon />}
                size="small"
                color="success"
                variant="contained"
                onClick={() => onAcceptMatch(candidate.id)}
              >
                Accept
              </Button>
            )}
          </Box>
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