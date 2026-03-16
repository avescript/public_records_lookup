import { MatchCandidate } from '../services/aiMatchingService';

/**
 * Enhanced Search Types for V2-2 Enhanced Search & Filters
 */

export interface SearchSnippet {
  text: string;
  highlights: {
    start: number;
    end: number;
    term: string;
  }[];
  context: string;
  score: number;
}

export interface EnhancedMatchCandidate extends MatchCandidate {
  confidenceScore: number; // 0-100 confidence score
  semanticScore: number; // Semantic similarity score
  keywordScore: number; // Keyword matching score
  snippets: SearchSnippet[];
  recordSummary?: string; // AI-generated summary
  contentPreview?: string; // First 200 chars of content
  relatedRecords?: string[]; // IDs of related records
  // Additional enhanced properties
  snippet?: string; // For backward compatibility
  fileSize?: number; // File size in bytes
  lastModified?: string; // ISO timestamp
  documentType?: string; // Type of document
  fullContent?: string; // Full document content
}

export interface EnhancedSearchOptions {
  query: string;
  maxResults?: number;
  includeSnippets?: boolean;
  semanticSearch?: boolean;
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    agencies?: string[];
    documentTypes?: string[];
    confidenceThreshold?: number;
  };
  sorting?: {
    field: 'relevance' | 'date' | 'confidence';
    order: 'asc' | 'desc';
  };
  facets?: string[]; // Fields to generate facets for
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  options: EnhancedSearchOptions;
  createdAt: Date;
  lastUsed: Date;
  resultCount: number;
}

export interface SearchStats {
  totalSearched: number;
  semanticMatches: number;
  keywordMatches: number;
  hybridMatches: number;
  processingTime: number;
  queryComplexity: 'simple' | 'moderate' | 'complex';
}

export interface RecordComparisonData {
  id: string;
  title: string;
  snippet?: string;
  fullContent?: string;
  confidence: number;
  documentType: string;
  fileSize?: number;
  lastModified?: string;
  metadata?: any;
}
