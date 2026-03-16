// Enhanced Search Components - V2-2 Advanced Search & Filters
export { AdvancedSearchInterface } from './AdvancedSearchInterface';
export { EnhancedSearchResults } from './EnhancedSearchResults';
export { RecordPreviewPanel } from './RecordPreviewPanel';
export { SearchResultCard } from './SearchResultCard';

// Re-export types from service
export type {
  EnhancedMatchCandidate,
  EnhancedMatchResult,
  EnhancedSearchOptions,
  SavedSearch,
  SearchSnippet,
} from '../../../services/enhancedAIRecordService';
