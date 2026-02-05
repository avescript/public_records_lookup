// Enhanced Search Components
export { default as AdvancedSearchInterface } from './AdvancedSearchInterface';
export { default as EnhancedSearchResults } from './EnhancedSearchResults';
export { default as RecordPreviewPanel } from './RecordPreviewPanel';
export { default as SearchResultCard } from './SearchResultCard';

// AI Chat Components
export { default as AISearchChat } from './AISearchChat';
export { default as ChatWidget } from './ChatWidget';

// Re-export types
export type {
  AISearchQuery,
  ChatConversation,
  ChatMessage,
  ChatResponse,
  SearchIntent,
  SearchSuggestion,
} from '../../types/chat';
export type {
  EnhancedMatchCandidate,
  EnhancedSearchOptions,
  SavedSearch,
  SearchStats,
} from '../../types/enhanced-search';
