'use client';

import React, { useEffect, useState } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@/components/migration';
import enhancedAIMatchingService from '@/services/enhancedAIMatchingService';
import { MatchCandidate, MatchResult } from '@/services/aiMatchingService';

// Import sub-components
import { ChatAssistant } from './ChatAssistant';
import { RecordMatchingPanel } from './RecordMatchingPanel';
import { RecordPreview } from './RecordPreview';

interface LocateStepProps {
  requestId: string;
  requestTitle: string;
  requestDescription: string;
  onRecordsSelected: (recordIds: string[]) => void;
  initialSelectedRecords?: string[];
}

export function LocateStep({
  requestId,
  requestTitle,
  requestDescription,
  onRecordsSelected,
  initialSelectedRecords = [],
}: LocateStepProps) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(requestDescription || '');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [selectedRecords, setSelectedRecords] =
    useState<string[]>(initialSelectedRecords);
  const [previewRecord, setPreviewRecord] = useState<MatchCandidate | null>(
    null
  );
  const [chatOpen, setChatOpen] = useState(false);

  // Initialize the AI matching service
  useEffect(() => {
    const initService = async () => {
      try {
        setInitializing(true);
        await enhancedAIMatchingService.initialize({
          requestCount: 100,
          documentsPerAgency: 85,
          includeEdgeCases: true,
        });
        setInitializing(false);

        // Auto-search on mount with request description
        if (requestDescription) {
          handleSearch(requestDescription);
        }
      } catch (err) {
        console.error('Failed to initialize AI matching service:', err);
        setError('Failed to initialize AI matching service');
        setInitializing(false);
      }
    };

    initService();
  }, [requestDescription]);

  const handleSearch = async (query?: string) => {
    const searchText = query || searchQuery;
    if (!searchText.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await enhancedAIMatchingService.findMatches(
        requestId,
        searchText,
        {
          maxResults: 20,
          minConfidence: 0.3,
        }
      );

      setMatchResult(result);

      // Auto-select high confidence matches (>0.85)
      const highConfidenceIds = result.candidates
        .filter(c => c.relevanceScore > 0.85)
        .map(c => c.id);

      if (highConfidenceIds.length > 0 && selectedRecords.length === 0) {
        setSelectedRecords(highConfidenceIds);
        onRecordsSelected(highConfidenceIds);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search for matching records');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordToggle = (recordId: string) => {
    const newSelection = selectedRecords.includes(recordId)
      ? selectedRecords.filter(id => id !== recordId)
      : [...selectedRecords, recordId];

    setSelectedRecords(newSelection);
    onRecordsSelected(newSelection);
  };

  const handleSelectAll = () => {
    if (matchResult) {
      const allIds = matchResult.candidates.map(c => c.id);
      setSelectedRecords(allIds);
      onRecordsSelected(allIds);
    }
  };

  const handleDeselectAll = () => {
    setSelectedRecords([]);
    onRecordsSelected([]);
  };

  const handlePreview = (record: MatchCandidate) => {
    setPreviewRecord(record);
  };

  const handleClosePreview = () => {
    setPreviewRecord(null);
  };

  const handleApplyQueryFromChat = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  if (initializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant='body1' color='textSecondary'>
          Initializing AI matching service...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant='h5' gutterBottom>
            Locate Relevant Records
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Use AI-powered search to find records matching this request. High
            confidence matches are automatically selected.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          startIcon={<ChatIcon />}
          onClick={() => setChatOpen(true)}
          sx={{ minWidth: 140 }}
        >
          AI Assistant
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder='Describe what records you need (e.g., "police reports involving use of force")'
            variant='outlined'
            disabled={loading}
          />
          <Button
            variant='contained'
            color='primary'
            onClick={() => handleSearch()}
            disabled={loading || !searchQuery.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {matchResult && (
        <Box>
          {/* Results Summary */}
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='body2' color='textSecondary'>
              Found {matchResult.candidates.length} matching records •{' '}
              {selectedRecords.length} selected •{' '}
              {matchResult.searchMetadata.processingTimeMs}ms
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size='small'
                onClick={handleSelectAll}
                disabled={
                  selectedRecords.length === matchResult.candidates.length
                }
              >
                Select All
              </Button>
              <Button
                size='small'
                onClick={handleDeselectAll}
                disabled={selectedRecords.length === 0}
              >
                Deselect All
              </Button>
            </Box>
          </Box>

          {/* Record Matching Panel */}
          <RecordMatchingPanel
            candidates={matchResult.candidates}
            selectedRecords={selectedRecords}
            onRecordToggle={handleRecordToggle}
            onPreview={handlePreview}
          />
        </Box>
      )}

      {/* Record Preview Dialog */}
      {previewRecord && (
        <RecordPreview
          record={previewRecord}
          open={!!previewRecord}
          onClose={handleClosePreview}
          isSelected={selectedRecords.includes(previewRecord.id)}
          onToggleSelection={() => handleRecordToggle(previewRecord.id)}
        />
      )}

      {/* No Results */}
      {matchResult && matchResult.candidates.length === 0 && (
        <Alert severity='info'>
          No matching records found. Try adjusting your search query or using
          different keywords.
        </Alert>
      )}

      {/* Initial State - No Search Yet */}
      {!matchResult && !loading && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant='h6' gutterBottom>
            Ready to Find Records
          </Typography>
          <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
            Enter a search query above to start finding relevant records using
            AI-powered matching.
          </Typography>
          <Button
            variant='contained'
            color='primary'
            onClick={() => handleSearch()}
            disabled={!searchQuery.trim()}
            startIcon={<SearchIcon />}
          >
            Start Search
          </Button>
        </Box>
      )}

      {/* AI Chat Assistant */}
      <ChatAssistant
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        requestDescription={requestDescription}
        onApplyQuery={handleApplyQueryFromChat}
      />
    </Box>
  );
}
