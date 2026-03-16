import React, { useEffect, useState } from 'react';
import {
  Clear,
  ExpandLess,
  ExpandMore,
  FilterList,
  History,
  Save,
  Search,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import {
  EnhancedSearchOptions,
  SavedSearch,
} from '../../../services/enhancedAIRecordService';

interface AdvancedSearchInterfaceProps {
  onSearch: (options: EnhancedSearchOptions) => void;
  onSaveSearch?: (
    search: Omit<SavedSearch, 'id' | 'createdAt' | 'lastUsed'>
  ) => void;
  savedSearches?: SavedSearch[];
  onLoadSavedSearch?: (search: SavedSearch) => void;
  loading?: boolean;
  resultCount?: number;
}

const AGENCIES = [
  'Police',
  'Fire',
  'Public Works',
  'Planning',
  'Health',
  'Parks',
];
const RECORD_TYPES = [
  'Use of Force Report',
  'Traffic Citation',
  'Fire Incident Report',
  'Building Permit',
  'Health Inspection',
  'Emergency Response',
  'Training Record',
  'Personnel File',
  'Equipment Log',
  'Budget Report',
];

export const AdvancedSearchInterface: React.FC<
  AdvancedSearchInterfaceProps
> = ({
  onSearch,
  onSaveSearch,
  savedSearches = [],
  onLoadSavedSearch,
  loading = false,
  resultCount,
}) => {
  // Search state
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<
    'semantic' | 'keyword' | 'hybrid'
  >('hybrid');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'confidence'>(
    'relevance'
  );
  const [includeSnippets, setIncludeSnippets] = useState(true);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState<Dayjs | null>(null);
  const [dateEnd, setDateEnd] = useState<Dayjs | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [maxResults, setMaxResults] = useState(20);

  // Saved search state
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Quick search suggestions
  const [quickSuggestions] = useState([
    'police use of force reports',
    'traffic citations highway 99',
    'fire emergency response times',
    'building permits downtown',
    'officer training records 2025',
  ]);

  const buildSearchOptions = (): EnhancedSearchOptions => {
    const options: EnhancedSearchOptions = {
      query,
      searchMode,
      sortBy,
      includeSnippets,
      filters: {
        maxResults,
        confidenceThreshold: confidenceThreshold / 100,
      },
    };

    // Add date range if specified
    if (dateStart && dateEnd) {
      options.filters!.dateRange = {
        start: dateStart.format('YYYY-MM-DD'),
        end: dateEnd.format('YYYY-MM-DD'),
      };
    }

    // Add agency filter if specified
    if (selectedAgencies.length > 0) {
      options.filters!.agencies = selectedAgencies;
    }

    // Add record type filter if specified
    if (selectedRecordTypes.length > 0) {
      options.filters!.recordTypes = selectedRecordTypes;
    }

    return options;
  };

  const handleSearch = () => {
    if (query.trim()) {
      const options = buildSearchOptions();
      onSearch(options);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedAgencies([]);
    setSelectedRecordTypes([]);
    setDateStart(null);
    setDateEnd(null);
    setConfidenceThreshold(70);
    setMaxResults(20);
    setSearchMode('hybrid');
    setSortBy('relevance');
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      const searchToSave = {
        name: saveSearchName,
        query,
        filters: buildSearchOptions().filters,
        searchMode,
        resultCount: resultCount || 0,
        userId: 'current-user', // In production, get from auth context
      };
      onSaveSearch(searchToSave);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadSavedSearch = (search: SavedSearch) => {
    setQuery(search.query);
    setSearchMode(search.searchMode || 'hybrid');

    if (search.filters) {
      setSelectedAgencies(search.filters.agencies || []);
      setSelectedRecordTypes(search.filters.recordTypes || []);
      setConfidenceThreshold((search.filters.confidenceThreshold || 0.7) * 100);
      setMaxResults(search.filters.maxResults || 20);

      if (search.filters.dateRange) {
        setDateStart(dayjs(search.filters.dateRange.start));
        setDateEnd(dayjs(search.filters.dateRange.end));
      }
    }

    if (onLoadSavedSearch) {
      onLoadSavedSearch(search);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card elevation={2}>
        <CardContent>
          {/* Main Search Input */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant='outlined'
              placeholder='Search records using natural language or keywords...'
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'action.active' }} />
                ),
                endAdornment: (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant='contained'
                      onClick={handleSearch}
                      disabled={loading || !query.trim()}
                      sx={{ minWidth: 100 }}
                    >
                      Search
                    </Button>
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  paddingRight: '4px',
                },
              }}
            />
          </Box>

          {/* Quick Suggestions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Quick searches:
            </Typography>
            <Stack
              direction='row'
              spacing={1}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {quickSuggestions.map(suggestion => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  variant='outlined'
                  size='small'
                  onClick={() => handleQuickSuggestion(suggestion)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Box>

          {/* Search Mode and Options */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Search Mode</InputLabel>
                <Select
                  value={searchMode}
                  label='Search Mode'
                  onChange={e => setSearchMode(e.target.value as any)}
                >
                  <MenuItem value='hybrid'>Hybrid (Recommended)</MenuItem>
                  <MenuItem value='semantic'>Semantic Search</MenuItem>
                  <MenuItem value='keyword'>Keyword Matching</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label='Sort By'
                  onChange={e => setSortBy(e.target.value as any)}
                >
                  <MenuItem value='relevance'>Relevance</MenuItem>
                  <MenuItem value='date'>Date</MenuItem>
                  <MenuItem value='confidence'>Confidence</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeSnippets}
                    onChange={e => setIncludeSnippets(e.target.checked)}
                  />
                }
                label='Include Highlights'
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Button
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              variant='outlined'
              size='small'
            >
              Filters {showFilters ? <ExpandLess /> : <ExpandMore />}
            </Button>
            <Button
              startIcon={<History />}
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              variant='outlined'
              size='small'
            >
              Saved Searches ({savedSearches.length})
            </Button>
            <Button
              startIcon={<Save />}
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              variant='outlined'
              size='small'
              disabled={!query.trim()}
            >
              Save Search
            </Button>
            <Button
              startIcon={<Clear />}
              onClick={handleClearAll}
              variant='outlined'
              size='small'
            >
              Clear All
            </Button>
          </Box>

          {/* Filters Section */}
          <Collapse in={showFilters}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Advanced Filters
              </Typography>

              <Grid container spacing={3}>
                {/* Date Range */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label='Start Date'
                    value={dateStart}
                    onChange={setDateStart}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label='End Date'
                    value={dateEnd}
                    onChange={setDateEnd}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                </Grid>

                {/* Agencies */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Agencies</InputLabel>
                    <Select
                      multiple
                      value={selectedAgencies}
                      label='Agencies'
                      onChange={e =>
                        setSelectedAgencies(e.target.value as string[])
                      }
                      renderValue={selected => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {(selected as string[]).map(value => (
                            <Chip key={value} label={value} size='small' />
                          ))}
                        </Box>
                      )}
                    >
                      {AGENCIES.map(agency => (
                        <MenuItem key={agency} value={agency}>
                          {agency}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Record Types */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Record Types</InputLabel>
                    <Select
                      multiple
                      value={selectedRecordTypes}
                      label='Record Types'
                      onChange={e =>
                        setSelectedRecordTypes(e.target.value as string[])
                      }
                      renderValue={selected => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {(selected as string[]).map(value => (
                            <Chip key={value} label={value} size='small' />
                          ))}
                        </Box>
                      )}
                    >
                      {RECORD_TYPES.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Confidence Threshold */}
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>
                    Confidence Threshold: {confidenceThreshold}%
                  </Typography>
                  <Slider
                    value={confidenceThreshold}
                    onChange={(_, value) =>
                      setConfidenceThreshold(value as number)
                    }
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' },
                    ]}
                  />
                </Grid>

                {/* Max Results */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size='small'
                    type='number'
                    label='Max Results'
                    value={maxResults}
                    onChange={e =>
                      setMaxResults(parseInt(e.target.value) || 20)
                    }
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>

          {/* Save Search Dialog */}
          <Collapse in={showSaveDialog}>
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Save Current Search
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size='small'
                  placeholder='Enter search name...'
                  value={saveSearchName}
                  onChange={e => setSaveSearchName(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant='contained'
                  onClick={handleSaveSearch}
                  disabled={!saveSearchName.trim()}
                >
                  Save
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Collapse>

          {/* Saved Searches */}
          <Collapse in={showSavedSearches}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant='h6' gutterBottom>
                Saved Searches
              </Typography>
              {savedSearches.length === 0 ? (
                <Typography color='text.secondary'>
                  No saved searches yet. Save your current search to reuse it
                  later.
                </Typography>
              ) : (
                <Grid container spacing={1}>
                  {savedSearches.map(search => (
                    <Grid item xs={12} sm={6} key={search.id}>
                      <Card variant='outlined' sx={{ cursor: 'pointer' }}>
                        <CardContent
                          sx={{ p: 2, '&:last-child': { pb: 2 } }}
                          onClick={() => handleLoadSavedSearch(search)}
                        >
                          <Typography variant='subtitle2' noWrap>
                            {search.name}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            noWrap
                          >
                            {search.query}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {search.resultCount} results •{' '}
                            {dayjs(search.lastUsed).format('MMM D')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default AdvancedSearchInterface;
