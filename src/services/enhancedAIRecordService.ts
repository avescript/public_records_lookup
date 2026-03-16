import {
  MatchCandidate,
  MatchExplanation,
  MatchResult,
} from './aiMatchingService';

// Enhanced AI Record Discovery Service for V2-2
export interface EnhancedSearchOptions {
  query: string;
  filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    agencies?: string[];
    recordTypes?: string[];
    confidenceThreshold?: number;
    maxResults?: number;
  };
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
  sortBy?: 'relevance' | 'date' | 'confidence';
  includeSnippets?: boolean;
}

export interface SearchSnippet {
  text: string;
  highlights: Array<{
    start: number;
    end: number;
    term: string;
  }>;
  contextBefore: string;
  contextAfter: string;
}

export interface EnhancedMatchCandidate extends MatchCandidate {
  confidenceScore: number; // 0-100 confidence score
  semanticScore: number; // Semantic similarity score
  keywordScore: number; // Keyword matching score
  snippets: SearchSnippet[];
  recordSummary?: string; // AI-generated summary
  contentPreview?: string; // First 200 chars of content
  relatedRecords?: string[]; // IDs of related records
}

export interface EnhancedMatchResult extends Omit<MatchResult, 'candidates'> {
  candidates: EnhancedMatchCandidate[];
  searchStats: {
    totalSearched: number;
    semanticMatches: number;
    keywordMatches: number;
    hybridMatches: number;
    processingTime: number;
    queryComplexity: 'simple' | 'moderate' | 'complex';
  };
  suggestions?: string[]; // Query refinement suggestions
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: EnhancedSearchOptions['filters'];
  searchMode: EnhancedSearchOptions['searchMode'];
  createdAt: string;
  lastUsed: string;
  resultCount: number;
  userId: string;
}

class EnhancedAIRecordService {
  private confidenceThreshold = 0.7;
  private semanticSearchEnabled = true;

  /**
   * Enhanced record discovery with AI-powered search
   */
  async searchRecords(
    options: EnhancedSearchOptions
  ): Promise<EnhancedMatchResult> {
    const startTime = performance.now();

    try {
      // Parse and analyze query
      const queryAnalysis = await this.analyzeQuery(options.query);

      // Perform search based on mode
      let candidates: EnhancedMatchCandidate[] = [];

      switch (options.searchMode || 'hybrid') {
        case 'semantic':
          candidates = await this.performSemanticSearch(options, queryAnalysis);
          break;
        case 'keyword':
          candidates = await this.performKeywordSearch(options, queryAnalysis);
          break;
        case 'hybrid':
        default:
          candidates = await this.performHybridSearch(options, queryAnalysis);
          break;
      }

      // Apply filters
      candidates = this.applyFilters(candidates, options.filters);

      // Sort results
      candidates = this.sortResults(candidates, options.sortBy || 'relevance');

      // Limit results
      const maxResults = options.filters?.maxResults || 20;
      candidates = candidates.slice(0, maxResults);

      // Generate snippets if requested
      if (options.includeSnippets) {
        candidates = await this.generateSnippets(candidates, options.query);
      }

      const processingTime = performance.now() - startTime;

      return {
        requestId: `search-${Date.now()}`,
        candidates,
        explanation: this.generateExplanation(options.query, candidates),
        searchMetadata: {
          totalCandidatesScanned: this.getMockRecordCount(),
          processingTimeMs: processingTime,
          confidenceThreshold:
            options.filters?.confidenceThreshold || this.confidenceThreshold,
          searchTimestamp: new Date().toISOString(),
        },
        searchStats: {
          totalSearched: this.getMockRecordCount(),
          semanticMatches: candidates.filter(c => c.semanticScore > 0.7).length,
          keywordMatches: candidates.filter(c => c.keywordScore > 0.7).length,
          hybridMatches: candidates.length,
          processingTime,
          queryComplexity: this.getQueryComplexity(options.query),
        },
        suggestions: await this.generateQuerySuggestions(
          options.query,
          candidates
        ),
      };
    } catch (error) {
      console.error('Enhanced record search failed:', error);
      throw new Error('Failed to search records');
    }
  }

  /**
   * Get record preview with highlighted content
   */
  async getRecordPreview(
    recordId: string,
    query?: string
  ): Promise<{
    id: string;
    title: string;
    content: string;
    highlights: Array<{ start: number; end: number; term: string }>;
    metadata: any;
    summary?: string;
  }> {
    // Mock implementation - in production would fetch actual record content
    const mockContent = this.getMockRecordContent(recordId);
    const highlights = query ? this.highlightTerms(mockContent, query) : [];
    const summary = await this.generateRecordSummary(mockContent);

    return {
      id: recordId,
      title: this.getRecordTitle(recordId),
      content: mockContent,
      highlights,
      metadata: this.getRecordMetadata(recordId),
      summary,
    };
  }

  /**
   * Save search query for reuse
   */
  async saveSearch(
    search: Omit<SavedSearch, 'id' | 'createdAt' | 'lastUsed'>
  ): Promise<SavedSearch> {
    const savedSearch: SavedSearch = {
      ...search,
      id: `saved-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    // In production, save to database
    console.log('Saving search:', savedSearch);

    return savedSearch;
  }

  /**
   * Get saved searches for user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    // Mock implementation - in production would fetch from database
    return [
      {
        id: 'saved-1',
        name: 'Police Use of Force Reports',
        query: 'use of force police reports body camera',
        filters: {
          agencies: ['Police'],
          recordTypes: ['Use of Force Report'],
          confidenceThreshold: 0.8,
        },
        searchMode: 'hybrid',
        createdAt: '2026-01-15T10:00:00Z',
        lastUsed: '2026-02-01T14:30:00Z',
        resultCount: 23,
        userId,
      },
      {
        id: 'saved-2',
        name: 'Traffic Citations Highway 99',
        query: 'traffic citations Highway 99 speed violations',
        filters: {
          agencies: ['Police'],
          recordTypes: ['Traffic Citation'],
          dateRange: {
            start: '2025-08-01',
            end: '2025-08-31',
          },
        },
        searchMode: 'keyword',
        createdAt: '2026-01-20T16:00:00Z',
        lastUsed: '2026-02-03T09:15:00Z',
        resultCount: 45,
        userId,
      },
    ];
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId: string): Promise<void> {
    // In production, delete from database
    console.log('Deleting saved search:', searchId);
  }

  // Private helper methods

  private async analyzeQuery(query: string) {
    // Mock query analysis - in production would use NLP service
    const tokens = query.toLowerCase().split(/\s+/);
    const entities = this.extractEntities(query);
    const intent = this.classifyIntent(query);

    return {
      tokens,
      entities,
      intent,
      complexity: this.getQueryComplexity(query),
    };
  }

  private async performSemanticSearch(
    options: EnhancedSearchOptions,
    queryAnalysis: any
  ): Promise<EnhancedMatchCandidate[]> {
    // Mock semantic search - in production would use vector embeddings
    const mockRecords = this.getMockEnhancedRecords();

    return mockRecords
      .map(record => ({
        ...record,
        semanticScore: Math.random() * 0.4 + 0.6, // 0.6-1.0 for semantic matches
        keywordScore: Math.random() * 0.5 + 0.3, // Lower keyword scores
        confidenceScore: Math.floor(Math.random() * 20 + 70), // 70-90% confidence
      }))
      .filter(
        r => r.semanticScore > (options.filters?.confidenceThreshold || 0.7)
      );
  }

  private async performKeywordSearch(
    options: EnhancedSearchOptions,
    queryAnalysis: any
  ): Promise<EnhancedMatchCandidate[]> {
    // Mock keyword search
    const mockRecords = this.getMockEnhancedRecords();

    return mockRecords
      .map(record => ({
        ...record,
        semanticScore: Math.random() * 0.5 + 0.2, // Lower semantic scores
        keywordScore: Math.random() * 0.4 + 0.6, // 0.6-1.0 for keyword matches
        confidenceScore: Math.floor(Math.random() * 25 + 60), // 60-85% confidence
      }))
      .filter(
        r => r.keywordScore > (options.filters?.confidenceThreshold || 0.7)
      );
  }

  private async performHybridSearch(
    options: EnhancedSearchOptions,
    queryAnalysis: any
  ): Promise<EnhancedMatchCandidate[]> {
    // Combine semantic and keyword search results
    const semanticResults = await this.performSemanticSearch(
      options,
      queryAnalysis
    );
    const keywordResults = await this.performKeywordSearch(
      options,
      queryAnalysis
    );

    // Merge and deduplicate results
    const mergedResults = new Map<string, EnhancedMatchCandidate>();

    [...semanticResults, ...keywordResults].forEach(record => {
      if (mergedResults.has(record.id)) {
        const existing = mergedResults.get(record.id)!;
        // Combine scores for hybrid approach
        mergedResults.set(record.id, {
          ...existing,
          semanticScore: Math.max(existing.semanticScore, record.semanticScore),
          keywordScore: Math.max(existing.keywordScore, record.keywordScore),
          confidenceScore: Math.max(
            existing.confidenceScore,
            record.confidenceScore
          ),
          relevanceScore:
            existing.semanticScore * 0.6 + existing.keywordScore * 0.4,
        });
      } else {
        mergedResults.set(record.id, {
          ...record,
          relevanceScore:
            record.semanticScore * 0.6 + record.keywordScore * 0.4,
        });
      }
    });

    return Array.from(mergedResults.values());
  }

  private applyFilters(
    candidates: EnhancedMatchCandidate[],
    filters?: EnhancedSearchOptions['filters']
  ): EnhancedMatchCandidate[] {
    if (!filters) return candidates;

    let filtered = candidates;

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(c => {
        const recordDate = new Date(c.dateCreated);
        return recordDate >= new Date(start) && recordDate <= new Date(end);
      });
    }

    // Agency filter
    if (filters.agencies?.length) {
      filtered = filtered.filter(c => filters.agencies!.includes(c.agency));
    }

    // Record type filter
    if (filters.recordTypes?.length) {
      filtered = filtered.filter(c =>
        filters.recordTypes!.includes(c.recordType)
      );
    }

    // Confidence threshold
    if (filters.confidenceThreshold) {
      filtered = filtered.filter(
        c => c.confidenceScore >= filters.confidenceThreshold! * 100
      );
    }

    return filtered;
  }

  private sortResults(
    candidates: EnhancedMatchCandidate[],
    sortBy: 'relevance' | 'date' | 'confidence'
  ): EnhancedMatchCandidate[] {
    switch (sortBy) {
      case 'date':
        return [...candidates].sort(
          (a, b) =>
            new Date(b.dateCreated).getTime() -
            new Date(a.dateCreated).getTime()
        );
      case 'confidence':
        return [...candidates].sort(
          (a, b) => b.confidenceScore - a.confidenceScore
        );
      case 'relevance':
      default:
        return [...candidates].sort(
          (a, b) => b.relevanceScore - a.relevanceScore
        );
    }
  }

  private async generateSnippets(
    candidates: EnhancedMatchCandidate[],
    query: string
  ): Promise<EnhancedMatchCandidate[]> {
    return candidates.map(candidate => ({
      ...candidate,
      snippets: this.extractSnippets(candidate.description, query),
      contentPreview: candidate.description.substring(0, 200) + '...',
    }));
  }

  private extractSnippets(content: string, query: string): SearchSnippet[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const snippets: SearchSnippet[] = [];

    queryTerms.forEach(term => {
      const regex = new RegExp(`(.{0,50})(${term})(.{0,50})`, 'gi');
      const matches = content.match(regex);

      if (matches) {
        matches.forEach(match => {
          const termIndex = match.toLowerCase().indexOf(term.toLowerCase());
          snippets.push({
            text: match,
            highlights: [
              {
                start: termIndex,
                end: termIndex + term.length,
                term,
              },
            ],
            contextBefore: match.substring(0, termIndex),
            contextAfter: match.substring(termIndex + term.length),
          });
        });
      }
    });

    return snippets.slice(0, 3); // Limit to 3 snippets per record
  }

  private generateExplanation(
    query: string,
    candidates: EnhancedMatchCandidate[]
  ): MatchExplanation {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const matchedPhrases = candidates.flatMap(c => c.keyPhrases).slice(0, 10);

    return {
      queryTerms,
      matchedPhrases,
      semanticSimilarity:
        candidates.reduce((avg, c) => avg + c.semanticScore, 0) /
        candidates.length,
      keywordOverlap:
        candidates.reduce((avg, c) => avg + c.keywordScore, 0) /
        candidates.length,
      contextualRelevance:
        candidates.reduce((avg, c) => avg + c.relevanceScore, 0) /
        candidates.length,
      reasoningSummary: `Found ${candidates.length} records using ${this.getSearchModeDescription(candidates)} matching with query "${query}". Top matches show ${Math.round(candidates[0]?.confidenceScore || 0)}% confidence.`,
    };
  }

  private async generateQuerySuggestions(
    query: string,
    results: EnhancedMatchCandidate[]
  ): Promise<string[]> {
    // Mock query suggestions - in production would use ML
    const suggestions = [
      `"${query}" AND body camera`,
      `${query} date:2025`,
      `${query} type:incident`,
      `related:${query}`,
    ];

    return suggestions.slice(0, 3);
  }

  private async generateRecordSummary(content: string): Promise<string> {
    // Mock AI summary - in production would use LLM
    return `This record contains information about ${content.substring(0, 100)}... [AI-generated summary]`;
  }

  private highlightTerms(
    content: string,
    query: string
  ): Array<{ start: number; end: number; term: string }> {
    const terms = query.toLowerCase().split(/\s+/);
    const highlights: Array<{ start: number; end: number; term: string }> = [];

    terms.forEach(term => {
      let index = content.toLowerCase().indexOf(term);
      while (index !== -1) {
        highlights.push({
          start: index,
          end: index + term.length,
          term,
        });
        index = content.toLowerCase().indexOf(term, index + 1);
      }
    });

    return highlights.sort((a, b) => a.start - b.start);
  }

  // Mock data helpers
  private getMockEnhancedRecords(): EnhancedMatchCandidate[] {
    return [
      {
        id: 'enhanced-001',
        title: 'Police Use of Force Incident Report - Case #2025-UF-445',
        description:
          'Detailed use of force report involving Officer Martinez and suspect during traffic stop on Main Street. Includes body camera footage analysis, witness statements, medical assessment, and administrative review findings.',
        source: 'Police Internal Affairs',
        relevanceScore: 0.95,
        confidence: 'high',
        keyPhrases: [
          'use of force',
          'body camera',
          'traffic stop',
          'Officer Martinez',
          'administrative review',
        ],
        distanceScore: 0.05,
        recordType: 'Use of Force Report',
        dateCreated: '2025-09-15T14:30:00Z',
        agency: 'Police',
        metadata: {
          fileSize: '4.2 MB',
          pageCount: 18,
          lastModified: '2025-09-20T10:15:00Z',
          classification: 'Restricted',
        },
        confidenceScore: 92,
        semanticScore: 0.94,
        keywordScore: 0.88,
        snippets: [],
        recordSummary:
          'Use of force incident involving traffic stop with body camera evidence and witness testimony.',
        relatedRecords: ['enhanced-002', 'enhanced-007'],
      },
      {
        id: 'enhanced-002',
        title: 'Body Camera Footage Log - Officer Martinez Badge #4472',
        description:
          'Digital evidence log for body camera footage from Officer Martinez (Badge #4472) during September 2025 patrol shifts. Includes metadata, timestamps, and incident cross-references.',
        source: 'Digital Evidence Management',
        relevanceScore: 0.89,
        confidence: 'high',
        keyPhrases: [
          'body camera',
          'digital evidence',
          'Officer Martinez',
          'patrol shifts',
          'timestamps',
        ],
        distanceScore: 0.11,
        recordType: 'Digital Evidence',
        dateCreated: '2025-09-30T09:00:00Z',
        agency: 'Police',
        metadata: {
          fileSize: '125 MB',
          pageCount: 3,
          lastModified: '2025-10-01T08:30:00Z',
          classification: 'Standard',
        },
        confidenceScore: 89,
        semanticScore: 0.87,
        keywordScore: 0.91,
        snippets: [],
        recordSummary:
          'Digital evidence catalog for body camera recordings with incident correlations.',
        relatedRecords: ['enhanced-001', 'enhanced-003'],
      },
      {
        id: 'enhanced-003',
        title: 'Traffic Stop Citation Database - Highway Patrol Division',
        description:
          'Comprehensive database of traffic citations issued by Highway Patrol Division during Q3 2025. Includes violation codes, fine amounts, court dates, and officer identification numbers.',
        source: 'Traffic Enforcement',
        relevanceScore: 0.76,
        confidence: 'medium',
        keyPhrases: [
          'traffic stop',
          'citations',
          'Highway Patrol',
          'violation codes',
          'officer identification',
        ],
        distanceScore: 0.24,
        recordType: 'Citation Database',
        dateCreated: '2025-10-01T12:00:00Z',
        agency: 'Police',
        metadata: {
          fileSize: '8.7 MB',
          pageCount: 156,
          lastModified: '2025-10-05T16:45:00Z',
          classification: 'Standard',
        },
        confidenceScore: 76,
        semanticScore: 0.72,
        keywordScore: 0.8,
        snippets: [],
        recordSummary:
          'Database of traffic enforcement activities with detailed citation information.',
        relatedRecords: ['enhanced-002', 'enhanced-004'],
      },
      {
        id: 'enhanced-004',
        title: 'Emergency Response Communications Log - Fire Department',
        description:
          'Radio communication transcripts and dispatch logs for fire department emergency responses in August 2025. Includes response times, unit assignments, and incident outcomes.',
        source: 'Fire Department Communications',
        relevanceScore: 0.68,
        confidence: 'medium',
        keyPhrases: [
          'emergency response',
          'communications log',
          'fire department',
          'dispatch',
          'response times',
        ],
        distanceScore: 0.32,
        recordType: 'Communications Log',
        dateCreated: '2025-08-31T18:00:00Z',
        agency: 'Fire',
        metadata: {
          fileSize: '2.1 MB',
          pageCount: 89,
          lastModified: '2025-09-02T11:20:00Z',
          classification: 'Standard',
        },
        confidenceScore: 68,
        semanticScore: 0.65,
        keywordScore: 0.71,
        snippets: [],
        recordSummary:
          'Emergency dispatch communications with response coordination details.',
        relatedRecords: ['enhanced-005'],
      },
      {
        id: 'enhanced-005',
        title: 'Hazardous Materials Incident Report - Industrial Fire Response',
        description:
          'Detailed incident report for hazardous materials fire at industrial facility on Oak Street. Includes evacuation procedures, environmental impact assessment, and cleanup operations.',
        source: 'Fire Department Hazmat',
        relevanceScore: 0.84,
        confidence: 'high',
        keyPhrases: [
          'hazardous materials',
          'industrial fire',
          'evacuation',
          'environmental impact',
          'cleanup',
        ],
        distanceScore: 0.16,
        recordType: 'Hazmat Incident',
        dateCreated: '2025-07-22T03:45:00Z',
        agency: 'Fire',
        metadata: {
          fileSize: '6.8 MB',
          pageCount: 34,
          lastModified: '2025-07-28T14:10:00Z',
          classification: 'Sensitive',
        },
        confidenceScore: 84,
        semanticScore: 0.82,
        keywordScore: 0.86,
        snippets: [],
        recordSummary:
          'Major hazmat incident with environmental considerations and emergency response.',
        relatedRecords: ['enhanced-004', 'enhanced-006'],
      },
    ];
  }

  private getQueryComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasOperators = /AND|OR|NOT|\"|'/.test(query);
    const hasFilters = /date:|type:|agency:/.test(query);

    if (wordCount <= 3 && !hasOperators && !hasFilters) return 'simple';
    if (wordCount <= 8 && (hasOperators || hasFilters)) return 'moderate';
    return 'complex';
  }

  private getSearchModeDescription(results: EnhancedMatchCandidate[]): string {
    const avgSemantic =
      results.reduce((sum, r) => sum + r.semanticScore, 0) / results.length;
    const avgKeyword =
      results.reduce((sum, r) => sum + r.keywordScore, 0) / results.length;

    if (avgSemantic > avgKeyword + 0.1) return 'semantic search';
    if (avgKeyword > avgSemantic + 0.1) return 'keyword search';
    return 'hybrid search';
  }

  private extractEntities(query: string): any {
    // Mock entity extraction
    return {};
  }

  private classifyIntent(query: string): string {
    // Mock intent classification
    if (query.includes('police') || query.includes('officer'))
      return 'police_records';
    if (query.includes('fire') || query.includes('emergency'))
      return 'fire_records';
    if (query.includes('traffic') || query.includes('citation'))
      return 'traffic_records';
    return 'general_search';
  }

  private getMockRecordCount(): number {
    return 10847; // Mock total record count
  }

  private getMockRecordContent(recordId: string): string {
    return `Mock content for record ${recordId}. This would contain the actual record content in a production system.`;
  }

  private getRecordTitle(recordId: string): string {
    const mockTitles: Record<string, string> = {
      'enhanced-001': 'Police Use of Force Incident Report - Case #2025-UF-445',
      'enhanced-002': 'Body Camera Footage Log - Officer Martinez Badge #4472',
      'enhanced-003':
        'Traffic Stop Citation Database - Highway Patrol Division',
    };
    return mockTitles[recordId] || `Record ${recordId}`;
  }

  private getRecordMetadata(recordId: string): any {
    return {
      fileSize: '2.1 MB',
      pageCount: 12,
      lastModified: '2025-09-15T10:30:00Z',
      classification: 'Standard',
    };
  }
}

// Export singleton instance
export const enhancedAIRecordService = new EnhancedAIRecordService();
export default enhancedAIRecordService;
