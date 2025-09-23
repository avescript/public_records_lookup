import { findMatches } from '../src/services/aiMatchingService';

describe('AI Matching Service', () => {
  describe('findMatches', () => {
    test('should return matches for a valid request', async () => {
      const requestId = 'test-request';
      const description = 'John Smith, DOB: 1980-05-15, jurisdiction: new-york';
      const searchTerms = ['John', 'Smith', '1980'];

      const results = await findMatches(requestId, description, searchTerms);

      expect(results).toBeDefined();
      expect(results.candidates).toBeInstanceOf(Array);
      expect(results.explanation).toBeDefined();
      expect(results.searchMetadata).toBeDefined();
      expect(results.searchMetadata.totalCandidatesScanned).toBeGreaterThan(0);
    });

    test('should return empty matches for poor search criteria', async () => {
      const requestId = 'test-request';
      const description = 'empty search';
      const searchTerms: string[] = [];

      const results = await findMatches(requestId, description, searchTerms);

      expect(results).toBeDefined();
      expect(results.candidates).toHaveLength(0);
      expect(results.searchMetadata.totalCandidatesScanned).toBeGreaterThan(0);
    });

    test('should return matches with proper confidence scores', async () => {
      const requestId = 'test-request';
      const description = 'Jane Doe, DOB: 1985-12-25, jurisdiction: california';
      const searchTerms = ['Jane', 'Doe', '1985'];

      const results = await findMatches(requestId, description, searchTerms);

      if (results.candidates.length > 0) {
        results.candidates.forEach(candidate => {
          expect(candidate.relevanceScore).toBeGreaterThanOrEqual(0);
          expect(candidate.relevanceScore).toBeLessThanOrEqual(1);
          expect(candidate.title).toBeDefined();
          expect(candidate.confidence).toMatch(/^(high|medium|low)$/);
          expect(candidate.keyPhrases).toBeInstanceOf(Array);
        });
      }
    });

    test('should include explainability data', async () => {
      const requestId = 'test-request';
      const description = 'Michael Johnson, DOB: 1975-08-10, jurisdiction: texas';
      const searchTerms = ['Michael', 'Johnson', '1975'];

      const results = await findMatches(requestId, description, searchTerms);

      expect(results.explanation).toMatchObject({
        queryTerms: expect.any(Array),
        matchedPhrases: expect.any(Array),
        semanticSimilarity: expect.any(Number),
        keywordOverlap: expect.any(Number),
        contextualRelevance: expect.any(Number),
        reasoningSummary: expect.any(String)
      });

      expect(results.searchMetadata).toMatchObject({
        totalCandidatesScanned: expect.any(Number),
        processingTimeMs: expect.any(Number),
        confidenceThreshold: expect.any(Number),
        searchTimestamp: expect.any(String)
      });

      if (results.candidates.length > 0) {
        const firstCandidate = results.candidates[0];
        expect(firstCandidate).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          relevanceScore: expect.any(Number),
          distanceScore: expect.any(Number)
        });
      }
    });
  });
});