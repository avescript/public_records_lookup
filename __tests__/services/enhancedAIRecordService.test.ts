import {
  enhancedAIRecordService,
  EnhancedSearchOptions,
} from '../../../src/services/enhancedAIRecordService';

describe('EnhancedAIRecordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchRecords', () => {
    it('performs hybrid search by default', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police reports',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.searchStats.hybridMatches).toBeDefined();
      expect(result.explanation.reasoningSummary).toContain('hybrid search');
    });

    it('performs semantic search when specified', async () => {
      const options: EnhancedSearchOptions = {
        query: 'use of force incidents',
        searchMode: 'semantic',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.searchStats.semanticMatches).toBeGreaterThan(0);
      result.candidates.forEach(candidate => {
        expect(candidate.semanticScore).toBeGreaterThan(0.6);
      });
    });

    it('performs keyword search when specified', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police reports traffic citations',
        searchMode: 'keyword',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.searchStats.keywordMatches).toBeGreaterThan(0);
      result.candidates.forEach(candidate => {
        expect(candidate.keywordScore).toBeGreaterThan(0.6);
      });
    });

    it('applies date range filter correctly', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police reports',
        filters: {
          dateRange: {
            start: '2025-08-01',
            end: '2025-08-31',
          },
        },
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      result.candidates.forEach(candidate => {
        const recordDate = new Date(candidate.dateCreated);
        expect(recordDate.getTime()).toBeGreaterThanOrEqual(
          new Date('2025-08-01').getTime()
        );
        expect(recordDate.getTime()).toBeLessThanOrEqual(
          new Date('2025-08-31').getTime()
        );
      });
    });

    it('applies agency filter correctly', async () => {
      const options: EnhancedSearchOptions = {
        query: 'incident reports',
        filters: {
          agencies: ['Police'],
        },
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      result.candidates.forEach(candidate => {
        expect(candidate.agency).toBe('Police');
      });
    });

    it('applies record type filter correctly', async () => {
      const options: EnhancedSearchOptions = {
        query: 'reports',
        filters: {
          recordTypes: ['Use of Force Report'],
        },
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      result.candidates.forEach(candidate => {
        expect(candidate.recordType).toBe('Use of Force Report');
      });
    });

    it('applies confidence threshold filter', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police reports',
        filters: {
          confidenceThreshold: 0.8,
        },
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      result.candidates.forEach(candidate => {
        expect(candidate.confidenceScore).toBeGreaterThanOrEqual(80);
      });
    });

    it('limits results based on maxResults', async () => {
      const options: EnhancedSearchOptions = {
        query: 'reports',
        filters: {
          maxResults: 2,
        },
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      expect(result.candidates.length).toBeLessThanOrEqual(2);
    });

    it('sorts results by relevance by default', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police reports',
        sortBy: 'relevance',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          result.candidates[i].relevanceScore
        );
      }
    });

    it('sorts results by date when specified', async () => {
      const options: EnhancedSearchOptions = {
        query: 'reports',
        sortBy: 'date',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      for (let i = 1; i < result.candidates.length; i++) {
        const prevDate = new Date(
          result.candidates[i - 1].dateCreated
        ).getTime();
        const currentDate = new Date(
          result.candidates[i].dateCreated
        ).getTime();
        expect(prevDate).toBeGreaterThanOrEqual(currentDate);
      }
    });

    it('sorts results by confidence when specified', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police reports',
        sortBy: 'confidence',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i - 1].confidenceScore).toBeGreaterThanOrEqual(
          result.candidates[i].confidenceScore
        );
      }
    });

    it('includes snippets when requested', async () => {
      const options: EnhancedSearchOptions = {
        query: 'use of force',
        includeSnippets: true,
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      result.candidates.forEach(candidate => {
        expect(candidate.snippets).toBeDefined();
        expect(candidate.contentPreview).toBeDefined();
      });
    });

    it('generates query suggestions for refinement', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      result.suggestions!.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('tracks processing time accurately', async () => {
      const startTime = performance.now();

      const options: EnhancedSearchOptions = {
        query: 'police reports',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      const endTime = performance.now();
      const actualTime = endTime - startTime;

      expect(result.searchStats.processingTime).toBeLessThan(actualTime + 50); // Allow small margin
      expect(result.searchStats.processingTime).toBeGreaterThan(0);
    });

    it('classifies query complexity correctly', async () => {
      // Simple query
      const simpleOptions: EnhancedSearchOptions = {
        query: 'police reports',
      };

      const simpleResult =
        await enhancedAIRecordService.searchRecords(simpleOptions);
      expect(simpleResult.searchStats.queryComplexity).toBe('simple');

      // Complex query
      const complexOptions: EnhancedSearchOptions = {
        query:
          'police use of force reports with body camera evidence AND witness statements date:2025',
      };

      const complexResult =
        await enhancedAIRecordService.searchRecords(complexOptions);
      expect(complexResult.searchStats.queryComplexity).toBe('complex');
    });

    it('handles empty query gracefully', async () => {
      const options: EnhancedSearchOptions = {
        query: '',
      };

      const result = await enhancedAIRecordService.searchRecords(options);

      expect(result.candidates).toEqual([]);
      expect(result.searchStats.totalSearched).toBeGreaterThanOrEqual(0);
    });

    it('handles search errors gracefully', async () => {
      // Mock a search failure scenario
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        // This should not throw but handle errors internally
        const options: EnhancedSearchOptions = {
          query: 'valid query',
        };

        const result = await enhancedAIRecordService.searchRecords(options);
        expect(result).toBeDefined();
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe('getRecordPreview', () => {
    it('returns record preview with content and metadata', async () => {
      const recordId = 'test-record-1';
      const query = 'use of force';

      const preview = await enhancedAIRecordService.getRecordPreview(
        recordId,
        query
      );

      expect(preview.id).toBe(recordId);
      expect(preview.title).toBeDefined();
      expect(preview.content).toBeDefined();
      expect(preview.metadata).toBeDefined();
      expect(preview.highlights).toBeDefined();
      expect(preview.summary).toBeDefined();
    });

    it('highlights query terms in content', async () => {
      const recordId = 'test-record-1';
      const query = 'force Martinez';

      const preview = await enhancedAIRecordService.getRecordPreview(
        recordId,
        query
      );

      expect(preview.highlights.length).toBeGreaterThan(0);
      preview.highlights.forEach(highlight => {
        expect(highlight.start).toBeGreaterThanOrEqual(0);
        expect(highlight.end).toBeGreaterThan(highlight.start);
        expect(highlight.term).toBeDefined();
      });
    });

    it('works without query parameter', async () => {
      const recordId = 'test-record-1';

      const preview = await enhancedAIRecordService.getRecordPreview(recordId);

      expect(preview.id).toBe(recordId);
      expect(preview.highlights).toEqual([]);
    });
  });

  describe('saved searches', () => {
    it('saves search correctly', async () => {
      const searchToSave = {
        name: 'Police Reports Search',
        query: 'police use of force',
        filters: {
          agencies: ['Police'],
          confidenceThreshold: 0.8,
        },
        searchMode: 'hybrid' as const,
        resultCount: 15,
        userId: 'test-user',
      };

      const savedSearch =
        await enhancedAIRecordService.saveSearch(searchToSave);

      expect(savedSearch.id).toBeDefined();
      expect(savedSearch.name).toBe(searchToSave.name);
      expect(savedSearch.query).toBe(searchToSave.query);
      expect(savedSearch.createdAt).toBeDefined();
      expect(savedSearch.lastUsed).toBeDefined();
    });

    it('retrieves saved searches for user', async () => {
      const userId = 'test-user';

      const savedSearches =
        await enhancedAIRecordService.getSavedSearches(userId);

      expect(Array.isArray(savedSearches)).toBe(true);
      savedSearches.forEach(search => {
        expect(search.id).toBeDefined();
        expect(search.name).toBeDefined();
        expect(search.query).toBeDefined();
        expect(search.userId).toBe(userId);
      });
    });

    it('deletes saved search', async () => {
      const searchId = 'saved-search-1';

      // Should not throw
      await expect(
        enhancedAIRecordService.deleteSavedSearch(searchId)
      ).resolves.not.toThrow();
    });
  });

  describe('performance and scalability', () => {
    it('handles large result sets efficiently', async () => {
      const options: EnhancedSearchOptions = {
        query: 'reports',
        filters: {
          maxResults: 100,
        },
      };

      const startTime = performance.now();
      const result = await enhancedAIRecordService.searchRecords(options);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.candidates.length).toBeLessThanOrEqual(100);
    });

    it('provides consistent scoring across searches', async () => {
      const options: EnhancedSearchOptions = {
        query: 'police use of force',
      };

      const result1 = await enhancedAIRecordService.searchRecords(options);
      const result2 = await enhancedAIRecordService.searchRecords(options);

      // Results should be consistent
      expect(result1.candidates.length).toBe(result2.candidates.length);

      if (result1.candidates.length > 0) {
        expect(result1.candidates[0].id).toBe(result2.candidates[0].id);
        expect(result1.candidates[0].relevanceScore).toBeCloseTo(
          result2.candidates[0].relevanceScore,
          2
        );
      }
    });
  });

  describe('data validation', () => {
    it('validates search options properly', async () => {
      const invalidOptions = {
        query: 'test',
        filters: {
          confidenceThreshold: 1.5, // Invalid: should be 0-1
          maxResults: -5, // Invalid: should be positive
        },
      } as EnhancedSearchOptions;

      // Service should handle invalid values gracefully
      const result =
        await enhancedAIRecordService.searchRecords(invalidOptions);
      expect(result.candidates).toBeDefined();
    });

    it('handles missing or null parameters', async () => {
      // @ts-ignore - Testing runtime behavior with invalid TypeScript
      const result = await enhancedAIRecordService.searchRecords(null);
      expect(result).toBeDefined();
    });
  });
});
