import React, { useCallback, useEffect, useState } from 'react';
import {
  Clear,
  Download,
  FilterList,
  Refresh,
  Search,
  SelectAll,
  Share,
  Sort,
  Speed,
  Timeline,
  TrendingUp,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  enhancedAIRecordService,
  EnhancedMatchResult,
  EnhancedSearchOptions,
  SavedSearch,
} from '../../../services/enhancedAIRecordService';

import { AdvancedSearchInterface } from './AdvancedSearchInterface';
import { RecordPreviewPanel } from './RecordPreviewPanel';
import { SearchResultCard } from './SearchResultCard';

interface EnhancedSearchResultsProps {
  requestId?: string;
  initialQuery?: string;
  onRecordSelect?: (recordIds: string[]) => void;
}

export const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  requestId,
  initialQuery = '',
  onRecordSelect,
}) => {
  // Search state
  const [searchResults, setSearchResults] =
    useState<EnhancedMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  // UI state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );
  const [starredRecords, setStarredRecords] = useState<Set<string>>(new Set());
  const [previewRecordId, setPreviewRecordId] = useState<string | null>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  // Auto-search if initial query provided
  useEffect(() => {
    if (initialQuery) {
      handleSearch({
        query: initialQuery,
        searchMode: 'hybrid',
        sortBy: 'relevance',
        includeSnippets: true,
      });
    }
  }, [initialQuery]);

  const loadSavedSearches = async () => {
    setLoadingSavedSearches(true);
    try {
      const searches =
        await enhancedAIRecordService.getSavedSearches('current-user');
      setSavedSearches(searches);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    } finally {
      setLoadingSavedSearches(false);
    }
  };

  const handleSearch = async (options: EnhancedSearchOptions) => {
    setLoading(true);
    setError(null);
    setCurrentQuery(options.query);

    try {
      const results = await enhancedAIRecordService.searchRecords(options);
      setSearchResults(results);

      // Clear previous selections
      setSelectedRecords(new Set());
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async (
    search: Omit<SavedSearch, 'id' | 'createdAt' | 'lastUsed'>
  ) => {
    try {
      await enhancedAIRecordService.saveSearch({
        ...search,
        resultCount: searchResults?.candidates.length || 0,
      });
      await loadSavedSearches();
    } catch (err) {
      console.error('Failed to save search:', err);
    }
  };

  const handleLoadSavedSearch = async (search: SavedSearch) => {
    const options: EnhancedSearchOptions = {
      query: search.query,
      searchMode: search.searchMode || 'hybrid',
      sortBy: 'relevance',
      includeSnippets: true,
      filters: search.filters,
    };

    await handleSearch(options);
  };

  const handleRecordSelect = useCallback(
    (recordId: string, selected: boolean) => {
      setSelectedRecords(prev => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(recordId);
        } else {
          newSet.delete(recordId);
        }

        // Notify parent component
        if (onRecordSelect) {
          onRecordSelect(Array.from(newSet));
        }

        return newSet;
      });
    },
    [onRecordSelect]
  );

  const handleSelectAll = () => {
    if (!searchResults) return;

    const allRecordIds = searchResults.candidates.map(c => c.id);
    const newSelected =
      selectedRecords.size === allRecordIds.length
        ? new Set<string>()
        : new Set<string>(allRecordIds);

    setSelectedRecords(newSelected);

    if (onRecordSelect) {
      onRecordSelect(Array.from(newSelected));
    }
  };

  const handleStarRecord = (recordId: string) => {
    setStarredRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handlePreviewRecord = (recordId: string) => {
    setPreviewRecordId(recordId);
  };

  const handleBulkDownload = () => {
    console.log('Bulk downloading records:', Array.from(selectedRecords));
    // In production, trigger bulk download
  };

  const renderSearchStats = () => {
    if (!searchResults) return null;

    const { searchStats, candidates } = searchResults;

    return (
      <Paper variant='outlined' sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems='center'>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Search color='primary' />
              <Box>
                <Typography variant='h6'>{candidates.length}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  Results Found
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Speed color='secondary' />
              <Box>
                <Typography variant='h6'>
                  {Math.round(searchStats.processingTime)}ms
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Search Time
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <TrendingUp color='success' />
              <Box>
                <Typography variant='h6'>
                  {Math.round(candidates[0]?.confidenceScore || 0)}%
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Top Confidence
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Timeline color='info' />
              <Box>
                <Typography variant='h6' sx={{ textTransform: 'capitalize' }}>
                  {searchStats.queryComplexity}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Query Complexity
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderResultsHeader = () => {
    if (!searchResults) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant='h6'>
            Search Results ({searchResults.candidates.length})
          </Typography>
          {selectedRecords.size > 0 && (
            <Chip
              label={`${selectedRecords.size} selected`}
              color='primary'
              size='small'
            />
          )}
        </Box>

        <Stack direction='row' spacing={1} alignItems='center'>
          {/* Bulk Actions */}
          {selectedRecords.size > 0 && (
            <>
              <Button
                startIcon={<Download />}
                onClick={handleBulkDownload}
                size='small'
              >
                Download ({selectedRecords.size})
              </Button>
              <Divider orientation='vertical' flexItem />
            </>
          )}

          {/* Select All */}
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  searchResults.candidates.length > 0 &&
                  selectedRecords.size === searchResults.candidates.length
                }
                indeterminate={
                  selectedRecords.size > 0 &&
                  selectedRecords.size < searchResults.candidates.length
                }
                onChange={handleSelectAll}
              />
            }
            label='Select All'
            sx={{ mr: 2 }}
          />

          {/* Sort Menu */}
          <Tooltip title='Sort Options'>
            <IconButton
              onClick={e => setSortMenuAnchor(e.currentTarget)}
              size='small'
            >
              <Sort />
            </IconButton>
          </Tooltip>

          {/* View Toggle */}
          <Tooltip title='List View'>
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
              size='small'
            >
              <ViewList />
            </IconButton>
          </Tooltip>
          <Tooltip title='Grid View'>
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
              size='small'
            >
              <ViewModule />
            </IconButton>
          </Tooltip>

          {/* Refresh */}
          <Tooltip title='Refresh Results'>
            <IconButton
              onClick={() =>
                handleSearch({
                  query: currentQuery,
                  searchMode: 'hybrid',
                  sortBy: 'relevance',
                  includeSnippets: true,
                })
              }
              size='small'
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    );
  };

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {/* Search Interface */}
      <AdvancedSearchInterface
        onSearch={handleSearch}
        onSaveSearch={handleSaveSearch}
        savedSearches={savedSearches}
        onLoadSavedSearch={handleLoadSavedSearch}
        loading={loading}
        resultCount={searchResults?.candidates.length}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity='error' sx={{ my: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Statistics */}
      {renderSearchStats()}

      {/* Results Section */}
      {loading && (
        <Box sx={{ mt: 4 }}>
          <Skeleton variant='rectangular' height={60} sx={{ mb: 2 }} />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              variant='rectangular'
              height={200}
              sx={{ mb: 2 }}
            />
          ))}
        </Box>
      )}

      {searchResults && !loading && (
        <Box sx={{ mt: 4 }}>
          {renderResultsHeader()}

          {/* No Results */}
          {searchResults.candidates.length === 0 && (
            <Alert severity='info' sx={{ my: 3 }}>
              No records found matching your search criteria. Try adjusting your
              search terms or filters.
              {searchResults.suggestions &&
                searchResults.suggestions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant='body2'>
                      Try these suggestions:
                    </Typography>
                    <Stack
                      direction='row'
                      spacing={1}
                      sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}
                    >
                      {searchResults.suggestions.map((suggestion, index) => (
                        <Chip
                          key={index}
                          label={suggestion}
                          size='small'
                          clickable
                          onClick={() =>
                            handleSearch({
                              query: suggestion,
                              searchMode: 'hybrid',
                              sortBy: 'relevance',
                              includeSnippets: true,
                            })
                          }
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
            </Alert>
          )}

          {/* Results Grid/List */}
          {searchResults.candidates.length > 0 && (
            <Box
              sx={
                viewMode === 'grid'
                  ? {
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(400px, 1fr))',
                      gap: 2,
                    }
                  : {}
              }
            >
              {searchResults.candidates.map(result => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onPreview={handlePreviewRecord}
                  onSelect={handleRecordSelect}
                  onStar={handleStarRecord}
                  selected={selectedRecords.has(result.id)}
                  starred={starredRecords.has(result.id)}
                  showDetails={true}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem onClick={() => setSortMenuAnchor(null)}>Relevance</MenuItem>
        <MenuItem onClick={() => setSortMenuAnchor(null)}>
          Date (Newest)
        </MenuItem>
        <MenuItem onClick={() => setSortMenuAnchor(null)}>
          Date (Oldest)
        </MenuItem>
        <MenuItem onClick={() => setSortMenuAnchor(null)}>
          Confidence Score
        </MenuItem>
      </Menu>

      {/* Record Preview Panel */}
      <RecordPreviewPanel
        recordId={previewRecordId}
        open={Boolean(previewRecordId)}
        onClose={() => setPreviewRecordId(null)}
        searchQuery={currentQuery}
      />
    </Container>
  );
};

export default EnhancedSearchResults;
