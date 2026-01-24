/**
 * Enhanced AI Matching Service Tests  
 * Epic 8: Synthetic Data & Public Domain Corpus
 * Tests for the enhanced AI matching with synthetic data integration
 */

import { EnhancedAIMatchingService } from '../enhancedAIMatchingService';
import { SYNTHETIC_AGENCIES } from '../../data/syntheticDataTemplates';

// Mock the singleton for testing
jest.mock('../enhancedAIMatchingService', () => {
  const { EnhancedAIMatchingService } = jest.requireActual('../enhancedAIMatchingService');
  return {
    EnhancedAIMatchingService,
    __esModule: true,
    default: new EnhancedAIMatchingService(),
  };
});

describe('EnhancedAIMatchingService', () => {
  let service: EnhancedAIMatchingService;

  beforeEach(() => {
    service = new EnhancedAIMatchingService();
  });

  afterEach(() => {
    // Clean up any test data
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', async () => {
      await service.initialize();
      
      const analytics = service.getDatasetAnalytics();
      expect(analytics).not.toBeNull();
      expect(analytics?.metadata.totalRequests).toBeGreaterThan(0);
      expect(analytics?.metadata.totalDocuments).toBeGreaterThan(0);
      expect(analytics?.metadata.version).toBe('2.0');
    });

    it('should initialize with custom options', async () => {
      const customOptions = {
        requestCount: 50,
        documentsPerAgency: 20,
        includeEdgeCases: false,
        includePerformanceData: false,
      };

      await service.initialize(customOptions);
      
      const analytics = service.getDatasetAnalytics();
      expect(analytics).not.toBeNull();
      expect(analytics?.metadata.totalRequests).toBe(50);
      expect(analytics?.metadata.totalDocuments).toBe(20 * SYNTHETIC_AGENCIES.length);
    });

    it('should not re-initialize if already initialized', async () => {
      await service.initialize({ requestCount: 10 });
      const initialAnalytics = service.getDatasetAnalytics();
      
      await service.initialize({ requestCount: 20 });
      const afterAnalytics = service.getDatasetAnalytics();
      
      // Should still have the same data from first initialization
      expect(afterAnalytics?.metadata.totalRequests).toBe(initialAnalytics?.metadata.totalRequests);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock an error during initialization
      const originalGenerate = service['generator'].generateDataset;
      service['generator'].generateDataset = jest.fn().mockImplementation(() => {
        throw new Error('Mock generation error');
      });

      await expect(service.initialize()).rejects.toThrow('Mock generation error');
      
      // Restore original method
      service['generator'].generateDataset = originalGenerate;
    });
  });

  describe('Document Matching', () => {
    beforeEach(async () => {
      await service.initialize({
        requestCount: 30,
        documentsPerAgency: 25,
        includeEdgeCases: true,
        includePerformanceData: false,
      });
    });

    it('should find matches for police-related queries', async () => {
      const result = await service.findMatches('test-request-1', 'police use of force incident reports body camera');
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.requestId).toBe('test-request-1');
      
      // Should find police-related documents
      const policeRelated = result.candidates.filter(c => 
        c.agency.toLowerCase().includes('police') ||
        c.keyPhrases.some(phrase => phrase.toLowerCase().includes('police'))
      );
      expect(policeRelated.length).toBeGreaterThan(0);
    });

    it('should find matches for fire department queries', async () => {
      const result = await service.findMatches('test-request-2', 'fire emergency response times call volumes incidents');
      
      expect(result).toBeDefined();
      expect(result.candidates.length).toBeGreaterThan(0);
      
      // Should find fire department related documents
      const fireRelated = result.candidates.filter(c => 
        c.agency.toLowerCase().includes('fire') ||
        c.keyPhrases.some(phrase => phrase.toLowerCase().includes('fire')) ||
        c.keyPhrases.some(phrase => phrase.toLowerCase().includes('emergency'))
      );
      expect(fireRelated.length).toBeGreaterThan(0);
    });

    it('should find matches for financial queries', async () => {
      const result = await service.findMatches('test-request-3', 'budget expenditure contractor payments financial reports');
      
      expect(result).toBeDefined();
      expect(result.candidates.length).toBeGreaterThan(0);
      
      // Should find finance-related documents
      const financeRelated = result.candidates.filter(c => 
        c.agency.toLowerCase().includes('finance') ||
        c.keyPhrases.some(phrase => phrase.toLowerCase().includes('budget')) ||
        c.keyPhrases.some(phrase => phrase.toLowerCase().includes('expenditure'))
      );
      expect(financeRelated.length).toBeGreaterThan(0);
    });

    it('should respect maxResults parameter', async () => {
      const result = await service.findMatches('test-request-4', 'records documents reports', {
        maxResults: 3,
      });
      
      expect(result.candidates.length).toBeLessThanOrEqual(3);
    });

    it('should respect minConfidence parameter', async () => {
      const result = await service.findMatches('test-request-5', 'generic query text', {
        minConfidence: 0.8,
      });
      
      result.candidates.forEach(candidate => {
        expect(candidate.relevanceScore).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should filter by agencies when specified', async () => {
      const result = await service.findMatches('test-request-6', 'all department records', {
        agencies: ['police', 'fire'],
      });
      
      result.candidates.forEach(candidate => {
        const hasPoliceOrFire = candidate.agency.toLowerCase().includes('police') ||
                               candidate.agency.toLowerCase().includes('fire');
        expect(hasPoliceOrFire).toBe(true);
      });
    });

    it('should return empty results for queries with no matches', async () => {
      const result = await service.findMatches('test-request-7', 'alien spaceship ufo extraterrestrial', {
        minConfidence: 0.5,
      });
      
      // Should return very few or no results for nonsensical queries
      expect(result.candidates.length).toBeLessThanOrEqual(2);
    });

    it('should include search metadata', async () => {
      const result = await service.findMatches('test-request-8', 'test query');
      
      expect(result.searchMetadata).toBeDefined();
      expect(result.searchMetadata.totalCandidatesScanned).toBeGreaterThan(0);
      expect(result.searchMetadata.processingTimeMs).toBeGreaterThan(0);
      expect(result.searchMetadata.searchTimestamp).toBeDefined();
      expect(typeof result.searchMetadata.confidenceThreshold).toBe('number');
    });
  });

  describe('Match Explanation', () => {
    beforeEach(async () => {
      await service.initialize({
        requestCount: 20,
        documentsPerAgency: 15,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
    });

    it('should provide detailed match explanations', async () => {
      const result = await service.findMatches('test-request-9', 'police incident reports investigations');
      
      expect(result.explanation).toBeDefined();
      expect(result.explanation.queryTerms).toBeDefined();
      expect(Array.isArray(result.explanation.queryTerms)).toBe(true);
      expect(result.explanation.queryTerms.length).toBeGreaterThan(0);
      
      expect(result.explanation.matchedPhrases).toBeDefined();
      expect(Array.isArray(result.explanation.matchedPhrases)).toBe(true);
      
      expect(typeof result.explanation.semanticSimilarity).toBe('number');
      expect(typeof result.explanation.keywordOverlap).toBe('number');
      expect(typeof result.explanation.contextualRelevance).toBe('number');
      
      expect(result.explanation.reasoningSummary).toBeDefined();
      expect(typeof result.explanation.reasoningSummary).toBe('string');
      expect(result.explanation.reasoningSummary.length).toBeGreaterThan(10);
    });

    it('should extract meaningful search terms', async () => {
      const result = await service.findMatches('test-request-10', 'police use of force and body camera footage reports');
      
      const queryTerms = result.explanation.queryTerms;
      
      // Should extract meaningful terms and filter out stop words
      expect(queryTerms).toContain('police');
      expect(queryTerms).toContain('force');
      expect(queryTerms).toContain('body');
      expect(queryTerms).toContain('camera');
      expect(queryTerms).toContain('footage');
      expect(queryTerms).toContain('reports');
      
      // Should not contain common stop words
      expect(queryTerms).not.toContain('use');
      expect(queryTerms).not.toContain('of');
      expect(queryTerms).not.toContain('and');
    });
  });

  describe('Data Access Methods', () => {
    beforeEach(async () => {
      await service.initialize({
        requestCount: 15,
        documentsPerAgency: 12,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
    });

    it('should return all documents', () => {
      const documents = service.getAllDocuments();
      
      expect(Array.isArray(documents)).toBe(true);
      expect(documents.length).toBe(12 * SYNTHETIC_AGENCIES.length);
      
      documents.forEach(doc => {
        expect(doc.id).toBeDefined();
        expect(doc.title).toBeDefined();
        expect(doc.syntheticMetadata).toBeDefined();
      });
    });

    it('should return documents by agency', () => {
      const policeDocuments = service.getDocumentsByAgency('police');
      
      expect(Array.isArray(policeDocuments)).toBe(true);
      policeDocuments.forEach(doc => {
        expect(doc.template.agency).toBe('police');
      });
      
      const fireDocuments = service.getDocumentsByAgency('fire');
      fireDocuments.forEach(doc => {
        expect(doc.template.agency).toBe('fire');
      });
      
      // Should have different documents for different agencies
      expect(policeDocuments).not.toEqual(fireDocuments);
    });

    it('should return dataset analytics', () => {
      const analytics = service.getDatasetAnalytics();
      
      expect(analytics).not.toBeNull();
      expect(analytics?.metadata).toBeDefined();
      expect(analytics?.analytics).toBeDefined();
      
      expect(analytics?.metadata.totalRequests).toBe(15);
      expect(analytics?.metadata.totalDocuments).toBe(12 * SYNTHETIC_AGENCIES.length);
      expect(analytics?.metadata.agencies).toEqual(SYNTHETIC_AGENCIES.map(a => a.id));
      
      expect(analytics?.analytics.requestsByAgency).toBeDefined();
      expect(analytics?.analytics.documentsByAgency).toBeDefined();
      expect(typeof analytics?.analytics.averageExpectedMatches).toBe('number');
    });

    it('should return synthetic requests', () => {
      const requests = service.getSyntheticRequests();
      
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBe(15);
      
      requests.forEach(request => {
        expect(request.title).toBeDefined();
        expect(request.complexity).toBeDefined();
        expect(request.persona).toBeDefined();
        expect(request.agency).toBeDefined();
      });
    });

    it('should find pre-matched documents for synthetic requests', async () => {
      const requests = service.getSyntheticRequests();
      const requestWithMatches = requests.find(r => r.expectedMatches && r.expectedMatches.length > 0);
      
      if (requestWithMatches && requestWithMatches.id) {
        const result = await service.findPreMatchedDocuments(requestWithMatches.id);
        
        expect(result).not.toBeNull();
        expect(result?.candidates).toBeDefined();
        expect(result?.candidates.length).toBeGreaterThan(0);
        
        // All returned candidates should be in the expected matches
        result?.candidates.forEach(candidate => {
          expect(requestWithMatches.expectedMatches).toContain(candidate.id);
        });
      }
    });
  });

  describe('Data Regeneration', () => {
    it('should regenerate data with new options', async () => {
      await service.initialize({
        requestCount: 10,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
      
      const initialAnalytics = service.getDatasetAnalytics();
      expect(initialAnalytics?.metadata.totalRequests).toBe(10);
      
      await service.regenerateData({
        requestCount: 20,
        documentsPerAgency: 8,
        includeEdgeCases: true,
        includePerformanceData: true,
      });
      
      const newAnalytics = service.getDatasetAnalytics();
      expect(newAnalytics?.metadata.totalRequests).toBeGreaterThan(20); // More due to edge cases
      expect(newAnalytics?.metadata.totalDocuments).toBe(8 * SYNTHETIC_AGENCIES.length);
      
      // Should have different data
      expect(newAnalytics?.metadata.generatedAt).not.toBe(initialAnalytics?.metadata.generatedAt);
    });

    it('should clear existing data during regeneration', async () => {
      await service.initialize({ requestCount: 5 });
      const initialDocuments = service.getAllDocuments();
      
      await service.regenerateData({ requestCount: 10 });
      const newDocuments = service.getAllDocuments();
      
      // Should have different document IDs
      const initialIds = new Set(initialDocuments.map(d => d.id));
      const newIds = new Set(newDocuments.map(d => d.id));
      
      // Should have no overlap (completely new data)
      const intersection = new Set([...initialIds].filter(id => newIds.has(id)));
      expect(intersection.size).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should initialize large datasets efficiently', async () => {
      const startTime = Date.now();
      
      await service.initialize({
        requestCount: 100,
        documentsPerAgency: 50,
        includeEdgeCases: true,
        includePerformanceData: true,
      });
      
      const endTime = Date.now();
      const initTime = endTime - startTime;
      
      // Should initialize within reasonable time
      expect(initTime).toBeLessThan(10000); // Less than 10 seconds
      
      const analytics = service.getDatasetAnalytics();
      expect(analytics?.metadata.totalRequests).toBeGreaterThan(100);
      expect(analytics?.metadata.totalDocuments).toBe(50 * SYNTHETIC_AGENCIES.length);
    }, 15000); // Extend timeout for this test

    it('should perform searches efficiently', async () => {
      await service.initialize({
        requestCount: 50,
        documentsPerAgency: 30,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
      
      const startTime = Date.now();
      const result = await service.findMatches('perf-test', 'police reports incidents investigations');
      const endTime = Date.now();
      
      const searchTime = endTime - startTime;
      
      // Search should be fast
      expect(searchTime).toBeLessThan(1000); // Less than 1 second
      expect(result.searchMetadata.processingTimeMs).toBeLessThan(1000);
      
      // Should still find relevant results
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('should handle concurrent searches', async () => {
      await service.initialize({
        requestCount: 30,
        documentsPerAgency: 20,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
      
      const queries = [
        'police incident reports',
        'fire emergency response',
        'budget expenditure reports',
        'infrastructure maintenance',
        'legal contract documents',
      ];
      
      const startTime = Date.now();
      const promises = queries.map((query, index) => 
        service.findMatches(`concurrent-${index}`, query)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      
      // All searches should complete
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.requestId).toBe(`concurrent-${index}`);
        expect(result.candidates).toBeDefined();
      });
      
      // Should handle concurrent searches efficiently
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds total
    });
  });

  describe('Error Handling', () => {
    it('should handle searches before initialization', async () => {
      const uninitializedService = new EnhancedAIMatchingService();
      
      // Should auto-initialize
      const result = await uninitializedService.findMatches('auto-init-test', 'test query');
      
      expect(result).toBeDefined();
      expect(result.candidates).toBeDefined();
    });

    it('should handle empty or invalid queries', async () => {
      await service.initialize({ requestCount: 10, documentsPerAgency: 5 });
      
      const emptyResult = await service.findMatches('empty-test', '');
      expect(emptyResult.candidates.length).toBe(0);
      
      const whitespaceResult = await service.findMatches('whitespace-test', '   ');
      expect(whitespaceResult.candidates.length).toBe(0);
    });

    it('should handle invalid agency filters', async () => {
      await service.initialize({ requestCount: 10, documentsPerAgency: 5 });
      
      const result = await service.findMatches('invalid-agency-test', 'test query', {
        agencies: ['nonexistent-agency'],
      });
      
      expect(result.candidates.length).toBe(0);
    });

    it('should handle extreme parameter values gracefully', async () => {
      await service.initialize({ requestCount: 5, documentsPerAgency: 3 });
      
      // Very high maxResults
      const highMaxResult = await service.findMatches('high-max-test', 'test query', {
        maxResults: 1000,
      });
      expect(highMaxResult.candidates.length).toBeLessThanOrEqual(3 * SYNTHETIC_AGENCIES.length);
      
      // Very high minConfidence
      const highConfidenceResult = await service.findMatches('high-conf-test', 'test query', {
        minConfidence: 0.99,
      });
      expect(highConfidenceResult.candidates.length).toBeGreaterThanOrEqual(0);
    });
  });
});