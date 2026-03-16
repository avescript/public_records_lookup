import {
  EnhancedMatchCandidate,
  EnhancedSearchOptions,
} from './enhanced-search';

/**
 * Chat message types and interfaces
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchQuery: AISearchQuery | null;
  searchResults: EnhancedMatchCandidate[] | null;
  suggestions?: SearchSuggestion[];
  isTyping?: boolean;
}

/**
 * Chat conversation state
 */
export interface ChatConversation {
  id: string;
  requestId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  context: ConversationContext;
  isActive: boolean;
}

/**
 * Conversation context for maintaining search state
 */
export interface ConversationContext {
  requestType: string;
  searchHistory: AISearchQuery[];
  currentResults: EnhancedMatchCandidate[];
  filters: Partial<EnhancedSearchOptions>;
}

/**
 * AI search query with conversational context
 */
export interface AISearchQuery extends Partial<EnhancedSearchOptions> {
  query: string;
  searchMode: 'semantic' | 'keyword' | 'hybrid';
  maxResults?: number;
  includeSnippets?: boolean;
  conversational?: boolean;
  intent?: 'search' | 'filter' | 'help' | 'clarification' | 'general';
  confidence?: number;
}

/**
 * Search intent analysis result
 */
export interface SearchIntent {
  shouldSearch: boolean;
  searchTerms: string[];
  dateReferences: string[];
  departmentReferences: string[];
  confidence: number;
  intent: 'search' | 'filter' | 'help' | 'clarification' | 'general';
  filters: Partial<EnhancedSearchOptions>;
}

/**
 * Chat response from AI service
 */
export interface ChatResponse {
  message: ChatMessage;
  searchPerformed: boolean;
  searchCount: number;
  suggestions: SearchSuggestion[];
}

/**
 * Search suggestion for user interaction
 */
export interface SearchSuggestion {
  query: string;
  description: string;
  type?: 'refinement' | 'alternative' | 'expansion';
}

/**
 * Chat UI state for components
 */
export interface ChatUIState {
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  conversationId: string | null;
  showSuggestions: boolean;
  expandedResults: Set<string>;
}

/**
 * Chat configuration
 */
export interface ChatConfig {
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  enableSearch?: boolean;
  enableSuggestions?: boolean;
  maxConversationLength?: number;
}

/**
 * Chat analytics data
 */
export interface ChatAnalytics {
  conversationId: string;
  totalMessages: number;
  searchQueries: number;
  resultsFound: number;
  averageResponseTime: number;
  userSatisfaction?: number;
  completedTasks: string[];
}

/**
 * Export format options
 */
export interface ChatExportOptions {
  format: 'markdown' | 'json' | 'pdf';
  includeSearchResults: boolean;
  includeTimestamps: boolean;
  includeMetadata: boolean;
}

/**
 * Chat message formatting options
 */
export interface MessageFormatOptions {
  markdown: boolean;
  highlightCode: boolean;
  linkifyUrls: boolean;
  maxLength?: number;
}

/**
 * Search result display preferences
 */
export interface ResultDisplayPreferences {
  showSnippets: boolean;
  showConfidence: boolean;
  showMetadata: boolean;
  maxResults: number;
  sortBy: 'relevance' | 'date' | 'confidence';
}

/**
 * Conversation template for common scenarios
 */
export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  initialMessage: string;
  suggestedQueries: string[];
  category: 'police' | 'fire' | 'public-works' | 'planning' | 'general';
}

/**
 * Chat feedback data
 */
export interface ChatFeedback {
  conversationId: string;
  messageId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  helpful: boolean;
  timestamp: Date;
}
