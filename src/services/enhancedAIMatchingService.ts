/**
 * Enhanced AI Matching Service v2
 * Epic 8: Synthetic Data & Public Domain Corpus
 * Integrates with synthetic data generator for realistic multi-agency matching
 * 
 * Provides AI-powered record matching using enhanced synthetic dataset
 * with support for multiple agencies and document types
 */

import { MatchCandidate, MatchExplanation, MatchResult } from './aiMatchingService';
import SyntheticDataGenerator, { GeneratedDocument, SyntheticDataSet } from './syntheticDataGenerator';

class EnhancedAIMatchingService {
  private syntheticData: SyntheticDataSet | null = null;
  private generator: SyntheticDataGenerator;
  private initialized = false;

  constructor() {
    this.generator = new SyntheticDataGenerator();
  }

  /**
   * Initialize the enhanced matching service with synthetic data
   */
  async initialize(options?: {
    requestCount?: number;
    documentsPerAgency?: number;
    includeEdgeCases?: boolean;
    includePerformanceData?: boolean;
  }): Promise<void> {
    if (this.initialized) {
      console.log('🤖 [Enhanced AI Matching] Service already initialized');
      return;
    }

    console.log('🚀 [Enhanced AI Matching] Initializing with synthetic dataset...');
    
    const defaultOptions = {
      requestCount: 100,
      documentsPerAgency: 85,
      includeEdgeCases: true,
      includePerformanceData: true,
      ...options,
    };

    try {
      this.syntheticData = this.generator.generateDataset(defaultOptions);
      this.initialized = true;
      
      console.log(`✅ [Enhanced AI Matching] Initialized with ${this.syntheticData.metadata.totalRequests} requests and ${this.syntheticData.metadata.totalDocuments} documents`);
      console.log('📊 [Enhanced AI Matching] Agency distribution:', this.syntheticData.analytics.requestsByAgency);
    } catch (error) {
      console.error('❌ [Enhanced AI Matching] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Find matching documents for a request using enhanced AI matching
   */
  async findMatches(requestId: string, query: string, options?: {
    maxResults?: number;
    minConfidence?: number;
    agencies?: string[];
  }): Promise<MatchResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.syntheticData) {
      throw new Error('Enhanced AI Matching service not properly initialized');
    }

    console.log(`🔍 [Enhanced AI Matching] Finding matches for query: "${query}"`);
    
    const startTime = Date.now();
    const defaultOptions = {
      maxResults: 10,
      minConfidence: 0.3,
      agencies: [],
      ...options,
    };

    // Extract search terms and keywords from query
    const searchTerms = this.extractSearchTerms(query);
    const candidates = this.searchDocuments(searchTerms, defaultOptions);
    const rankedCandidates = this.rankCandidates(candidates, searchTerms);
    
    // Apply filters
    let filteredCandidates = rankedCandidates.filter(c => c.relevanceScore >= defaultOptions.minConfidence);
    
    if (defaultOptions.agencies.length > 0) {
      filteredCandidates = filteredCandidates.filter(c => 
        defaultOptions.agencies.includes(c.agency.toLowerCase())
      );
    }

    // Limit results
    const finalCandidates = filteredCandidates.slice(0, defaultOptions.maxResults);
    
    const processingTime = Date.now() - startTime;
    
    const explanation = this.generateExplanation(query, searchTerms, finalCandidates);
    
    console.log(`✅ [Enhanced AI Matching] Found ${finalCandidates.length} matches in ${processingTime}ms`);
    
    return {
      requestId,
      candidates: finalCandidates,
      explanation,
      searchMetadata: {
        totalCandidatesScanned: this.syntheticData.metadata.totalDocuments,
        processingTimeMs: processingTime,
        confidenceThreshold: defaultOptions.minConfidence,
        searchTimestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get all available documents (for admin/testing purposes)
   */
  getAllDocuments(): GeneratedDocument[] {
    if (!this.syntheticData) {
      return [];
    }
    return this.syntheticData.documents;
  }

  /**
   * Get dataset analytics
   */
  getDatasetAnalytics() {
    if (!this.syntheticData) {
      return null;
    }
    return {
      metadata: this.syntheticData.metadata,
      analytics: this.syntheticData.analytics,
    };
  }

  /**
   * Get documents by agency
   */
  getDocumentsByAgency(agencyId: string): GeneratedDocument[] {
    if (!this.syntheticData) {
      return [];
    }
    return this.syntheticData.documents.filter(d => d.template.agency === agencyId);
  }

  /**
   * Search documents based on terms
   */
  private searchDocuments(searchTerms: string[], options: { agencies: string[] }): GeneratedDocument[] {
    if (!this.syntheticData) {
      return [];
    }

    let candidates = [...this.syntheticData.documents];

    // Filter by agencies if specified
    if (options.agencies.length > 0) {
      candidates = candidates.filter(doc => 
        options.agencies.some(agency => 
          doc.template.agency === agency || doc.agency.toLowerCase().includes(agency.toLowerCase())
        )
      );
    }

    // Score documents based on term matches
    return candidates.map(doc => ({
      ...doc,
      searchScore: this.calculateSearchScore(doc, searchTerms),
    })).filter(doc => doc.searchScore > 0);
  }

  /**
   * Calculate search score for a document
   */
  private calculateSearchScore(document: GeneratedDocument, searchTerms: string[]): number {
    const titleWords = document.title.toLowerCase().split(/\\s+/);
    const descriptionWords = document.description.toLowerCase().split(/\\s+/);
    const keyPhrases = document.keyPhrases.map(p => p.toLowerCase());
    const sourceWords = document.source.toLowerCase().split(/\\s+/);
    
    let score = 0;
    
    searchTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      
      // Exact title match (highest weight)
      if (titleWords.some(word => word.includes(lowerTerm))) {
        score += 1.0;
      }
      
      // Key phrase match (high weight)
      if (keyPhrases.some(phrase => phrase.includes(lowerTerm))) {
        score += 0.8;
      }
      
      // Description match (medium weight)
      if (descriptionWords.some(word => word.includes(lowerTerm))) {
        score += 0.6;
      }
      
      // Source match (lower weight)
      if (sourceWords.some(word => word.includes(lowerTerm))) {
        score += 0.4;
      }
      
      // Record type match (medium weight)
      if (document.recordType.toLowerCase().includes(lowerTerm)) {
        score += 0.7;
      }
    });
    
    return score;
  }

  /**
   * Rank candidates based on relevance
   */
  private rankCandidates(candidates: (GeneratedDocument & { searchScore: number })[], searchTerms: string[]): MatchCandidate[] {
    return candidates
      .sort((a, b) => b.searchScore - a.searchScore)
      .map(doc => this.convertToMatchCandidate(doc, searchTerms));
  }

  /**
   * Convert enhanced document to match candidate
   */
  private convertToMatchCandidate(doc: GeneratedDocument & { searchScore: number }, searchTerms: string[]): MatchCandidate {
    const relevanceScore = Math.min(0.98, doc.relevanceScore * (1 + doc.searchScore * 0.2));
    const distanceScore = Math.max(0.02, 1 - relevanceScore);
    
    // Determine confidence based on search score and document characteristics
    let confidence: 'high' | 'medium' | 'low';
    if (doc.searchScore > 1.5 && relevanceScore > 0.85) {
      confidence = 'high';
    } else if (doc.searchScore > 0.8 && relevanceScore > 0.65) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      source: doc.source,
      relevanceScore,
      confidence,
      keyPhrases: [...doc.keyPhrases],
      distanceScore,
      recordType: doc.recordType,
      dateCreated: doc.dateCreated,
      agency: doc.agency,
      metadata: {
        fileSize: doc.metadata.fileSize,
        pageCount: doc.metadata.pageCount,
        lastModified: doc.metadata.lastModified,
        classification: doc.metadata.classification,
      },
    };
  }

  /**
   * Extract search terms from query
   */
  private extractSearchTerms(query: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'all', 'any', 'some', 'this', 'that', 'these', 'those', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
    ]);
    
    const terms = query.toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, ' ')
      .split(/\\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term));
    
    // Also extract quoted phrases
    const quotedPhrases = query.match(/"([^"]*)"/g) || [];
    const phrases = quotedPhrases.map(phrase => phrase.replace(/"/g, ''));
    
    return [...terms, ...phrases];
  }

  /**
   * Generate match explanation
   */
  private generateExplanation(originalQuery: string, searchTerms: string[], candidates: MatchCandidate[]): MatchExplanation {
    const matchedPhrases = new Set<string>();
    let totalKeywordOverlap = 0;
    let totalSemanticSimilarity = 0;
    
    candidates.forEach(candidate => {
      candidate.keyPhrases.forEach(phrase => {
        if (searchTerms.some(term => phrase.toLowerCase().includes(term.toLowerCase()))) {
          matchedPhrases.add(phrase);
        }
      });
      
      // Calculate keyword overlap
      const candidateWords = new Set([
        ...candidate.title.toLowerCase().split(/\\s+/),
        ...candidate.description.toLowerCase().split(/\\s+/),
        ...candidate.keyPhrases.map(p => p.toLowerCase()),
      ]);
      
      const queryWords = new Set(searchTerms.map(t => t.toLowerCase()));
      const intersection = new Set([...candidateWords].filter(w => queryWords.has(w)));
      const union = new Set([...candidateWords, ...queryWords]);
      
      totalKeywordOverlap += intersection.size / union.size;
      totalSemanticSimilarity += candidate.relevanceScore;
    });
    
    const avgKeywordOverlap = candidates.length > 0 ? totalKeywordOverlap / candidates.length : 0;
    const avgSemanticSimilarity = candidates.length > 0 ? totalSemanticSimilarity / candidates.length : 0;
    const contextualRelevance = Math.min(0.95, avgSemanticSimilarity * (1 + avgKeywordOverlap));
    
    const reasoningSummary = this.generateReasoningSummary(
      searchTerms, 
      Array.from(matchedPhrases), 
      candidates.length,
      avgKeywordOverlap,
      avgSemanticSimilarity
    );
    
    return {
      queryTerms: searchTerms,
      matchedPhrases: Array.from(matchedPhrases),
      semanticSimilarity: avgSemanticSimilarity,
      keywordOverlap: avgKeywordOverlap,
      contextualRelevance,
      reasoningSummary,
    };
  }

  /**
   * Generate reasoning summary
   */
  private generateReasoningSummary(
    searchTerms: string[], 
    matchedPhrases: string[], 
    resultCount: number,
    keywordOverlap: number,
    semanticSimilarity: number
  ): string {
    let summary = `Found ${resultCount} potentially relevant records`;
    
    if (matchedPhrases.length > 0) {
      summary += ` with strong matches for key phrases: ${matchedPhrases.slice(0, 3).join(', ')}`;
      if (matchedPhrases.length > 3) {
        summary += ` and ${matchedPhrases.length - 3} others`;
      }
    }
    
    if (keywordOverlap > 0.7) {
      summary += '. High keyword relevance suggests strong content alignment';
    } else if (keywordOverlap > 0.4) {
      summary += '. Moderate keyword overlap with potential relevance';
    } else {
      summary += '. Limited direct keyword matches, but semantic analysis suggests relevance';
    }
    
    if (semanticSimilarity > 0.8) {
      summary += '. Documents show high semantic similarity to the request';
    } else if (semanticSimilarity > 0.6) {
      summary += '. Documents show moderate semantic relevance';
    } else {
      summary += '. Some documents may require manual review for relevance';
    }
    
    return summary + '.';
  }
  
  /**
   * Get synthetic requests for testing
   */
  getSyntheticRequests() {
    if (!this.syntheticData) {
      return [];
    }
    return this.syntheticData.requests;
  }

  /**
   * Find pre-matched documents for a synthetic request
   */
  async findPreMatchedDocuments(requestId: string): Promise<MatchResult | null> {
    if (!this.syntheticData) {
      return null;
    }
    
    const request = this.syntheticData.requests.find(r => r.id === requestId);
    if (!request || !request.expectedMatches) {
      return null;
    }
    
    const candidates = this.syntheticData.documents
      .filter(doc => request.expectedMatches!.includes(doc.id))
      .map(doc => this.convertToMatchCandidate(doc, []))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    const explanation = this.generateExplanation(
      request.description, 
      [request.title, request.description].join(' ').split(' '), 
      candidates
    );
    
    return {
      requestId,
      candidates,
      explanation,
      searchMetadata: {
        totalCandidatesScanned: this.syntheticData.metadata.totalDocuments,
        processingTimeMs: 1, // Pre-matched, instant response
        confidenceThreshold: 0.0,
        searchTimestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Reset and regenerate synthetic data
   */
  async regenerateData(options?: {
    requestCount?: number;
    documentsPerAgency?: number;
    includeEdgeCases?: boolean;
    includePerformanceData?: boolean;
  }): Promise<void> {
    console.log('🔄 [Enhanced AI Matching] Regenerating synthetic dataset...');
    this.initialized = false;
    this.syntheticData = null;
    await this.initialize(options);
  }
}

// Create singleton instance
const enhancedAIMatchingService = new EnhancedAIMatchingService();

export default enhancedAIMatchingService;
export { EnhancedAIMatchingService };