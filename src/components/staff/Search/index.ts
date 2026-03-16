// Re-export from the correct location
export { AdvancedSearchInterface as EnhancedSearchInterface } from '../staff/EnhancedSearch/AdvancedSearchInterface';
export { EnhancedSearchResults } from '../staff/EnhancedSearch/EnhancedSearchResults';
export { RecordPreviewPanel } from '../staff/EnhancedSearch/RecordPreviewPanel';
export { SearchResultCard } from '../staff/EnhancedSearch/SearchResultCard';

// Re-export types
export type {
  EnhancedMatchCandidate,
  EnhancedMatchResult,
  EnhancedSearchOptions,
  SavedSearch,
  SearchSnippet,
} from '../../services/enhancedAIRecordService';
