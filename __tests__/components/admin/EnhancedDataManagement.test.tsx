/**
 * Enhanced Data Management Component Tests
 * Epic 8: Synthetic Data & Public Domain Corpus
 * Tests for the admin interface component for managing synthetic datasets
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedDataManagement } from '../../../src/components/admin/EnhancedDataManagement';
import { EnhancedAIMatchingService } from '../../../src/services/enhancedAIMatchingService';

// Mock the enhanced AI matching service
jest.mock('../../../src/services/enhancedAIMatchingService', () => ({
  EnhancedAIMatchingService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    regenerateData: jest.fn(),
    getDatasetAnalytics: jest.fn(),
    getAllDocuments: jest.fn(),
    getDocumentsByAgency: jest.fn(),
    getSyntheticRequests: jest.fn(),
    findMatches: jest.fn(),
    findPreMatchedDocuments: jest.fn(),
  })),
}));

const mockService = {
  initialize: jest.fn(),
  regenerateData: jest.fn(),
  getDatasetAnalytics: jest.fn(),
  getAllDocuments: jest.fn(),
  getDocumentsByAgency: jest.fn(),
  getSyntheticRequests: jest.fn(),
  findMatches: jest.fn(),
  findPreMatchedDocuments: jest.fn(),
};

// Setup test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const theme = createTheme();

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('EnhancedDataManagement', () => {
  const mockAnalytics = {
    metadata: {
      totalRequests: 100,
      totalDocuments: 300,
      agencies: ['police', 'fire', 'finance', 'public_works', 'legal', 'parks'],
      version: '2.0',
      generatedAt: '2024-01-15T10:00:00.000Z',
      includedEdgeCases: true,
      includedPerformanceData: true,
    },
    analytics: {
      requestsByAgency: {
        police: 25,
        fire: 20,
        finance: 15,
        public_works: 15,
        legal: 15,
        parks: 10,
      },
      documentsByAgency: {
        police: 60,
        fire: 50,
        finance: 50,
        public_works: 50,
        legal: 50,
        parks: 30,
      },
      averageExpectedMatches: 3.2,
      complexityDistribution: {
        simple: 40,
        moderate: 35,
        complex: 25,
      },
      personaDistribution: {
        journalist: 20,
        researcher: 15,
        attorney: 15,
        citizen: 25,
        business: 15,
        nonprofit: 10,
      },
    },
  };

  const mockDocuments = [
    {
      id: 'doc-1',
      title: 'Police Use of Force Report',
      template: { agency: 'police', type: 'incident_report' },
      syntheticMetadata: {
        complexity: 'moderate',
        keyPhrases: ['use of force', 'body camera', 'incident'],
        sensitivityLevel: 'high',
      },
    },
    {
      id: 'doc-2',
      title: 'Fire Emergency Response Log',
      template: { agency: 'fire', type: 'response_log' },
      syntheticMetadata: {
        complexity: 'simple',
        keyPhrases: ['emergency response', 'fire department', 'call log'],
        sensitivityLevel: 'medium',
      },
    },
  ];

  const mockRequests = [
    {
      id: 'req-1',
      title: 'Police incident reports from last quarter',
      complexity: 'moderate',
      persona: 'journalist',
      agency: 'police',
      expectedMatches: ['doc-1'],
    },
    {
      id: 'req-2',
      title: 'Fire department response times analysis',
      complexity: 'simple',
      persona: 'researcher',
      agency: 'fire',
      expectedMatches: ['doc-2'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockService.initialize.mockResolvedValue(undefined);
    mockService.regenerateData.mockResolvedValue(undefined);
    mockService.getDatasetAnalytics.mockReturnValue(mockAnalytics);
    mockService.getAllDocuments.mockReturnValue(mockDocuments);
    mockService.getDocumentsByAgency.mockReturnValue(mockDocuments.slice(0, 1));
    mockService.getSyntheticRequests.mockReturnValue(mockRequests);
    mockService.findMatches.mockResolvedValue({
      requestId: 'test',
      candidates: [],
      explanation: {
        queryTerms: [],
        matchedPhrases: [],
        semanticSimilarity: 0.5,
        keywordOverlap: 0.3,
        contextualRelevance: 0.7,
        reasoningSummary: 'Test match explanation',
      },
      searchMetadata: {
        totalCandidatesScanned: 100,
        processingTimeMs: 150,
        searchTimestamp: new Date(),
        confidenceThreshold: 0.5,
      },
    });

    // Mock the service instance
    (
      EnhancedAIMatchingService as jest.MockedClass<
        typeof EnhancedAIMatchingService
      >
    ).mockImplementation(() => mockService as any);
  });

  describe('Component Rendering', () => {
    it('should render the main interface', () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      expect(
        screen.getByText('Enhanced Synthetic Data Management')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Multi-Agency Dataset Generation & AI Matching Validation'
        )
      ).toBeInTheDocument();
    });

    it('should render dataset overview section', async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Dataset Overview')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Requests: 100')).toBeInTheDocument();
      expect(screen.getByText('Total Documents: 300')).toBeInTheDocument();
      expect(screen.getByText('Agencies: 6')).toBeInTheDocument();
    });

    it('should render generation controls section', () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      expect(
        screen.getByText('Dataset Generation Controls')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Requests')).toBeInTheDocument();
      expect(screen.getByLabelText('Documents per Agency')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Edge Cases')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Include Performance Test Data')
      ).toBeInTheDocument();
    });

    it('should render AI matching testing section', () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('AI Matching Testing')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Query')).toBeInTheDocument();
      expect(screen.getByText('Test AI Search')).toBeInTheDocument();
    });

    it('should render synthetic data tabs', () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Agency Details')).toBeInTheDocument();
    });
  });

  describe('Dataset Initialization', () => {
    it('should initialize dataset with default options on mount', async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalledWith({
          requestCount: 50,
          documentsPerAgency: 25,
          includeEdgeCases: true,
          includePerformanceData: false,
        });
      });
    });

    it('should handle initialization errors gracefully', async () => {
      mockService.initialize.mockRejectedValue(
        new Error('Initialization failed')
      );

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          screen.getByText(/failed to initialize dataset/i)
        ).toBeInTheDocument();
      });
    });

    it('should show loading state during initialization', () => {
      mockService.initialize.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Initializing Dataset...')).toBeInTheDocument();
    });
  });

  describe('Dataset Generation', () => {
    it('should regenerate dataset with custom parameters', async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });

      // Change generation parameters
      const requestCountInput = screen.getByLabelText('Number of Requests');
      const documentsInput = screen.getByLabelText('Documents per Agency');
      const edgeCasesCheckbox = screen.getByLabelText('Include Edge Cases');
      const performanceCheckbox = screen.getByLabelText(
        'Include Performance Test Data'
      );

      fireEvent.change(requestCountInput, { target: { value: '75' } });
      fireEvent.change(documentsInput, { target: { value: '30' } });
      fireEvent.click(edgeCasesCheckbox); // Uncheck
      fireEvent.click(performanceCheckbox); // Check

      // Click regenerate
      const regenerateButton = screen.getByText('Regenerate Dataset');
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockService.regenerateData).toHaveBeenCalledWith({
          requestCount: 75,
          documentsPerAgency: 30,
          includeEdgeCases: false,
          includePerformanceData: true,
        });
      });
    });

    it('should show loading state during regeneration', async () => {
      mockService.regenerateData.mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });

      const regenerateButton = screen.getByText('Regenerate Dataset');
      fireEvent.click(regenerateButton);

      expect(screen.getByText('Regenerating...')).toBeInTheDocument();
      expect(regenerateButton).toBeDisabled();
    });

    it('should handle regeneration errors', async () => {
      mockService.regenerateData.mockRejectedValue(
        new Error('Regeneration failed')
      );

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });

      const regenerateButton = screen.getByText('Regenerate Dataset');
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to regenerate dataset/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate generation parameters', async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });

      // Set invalid parameters
      const requestCountInput = screen.getByLabelText('Number of Requests');
      fireEvent.change(requestCountInput, { target: { value: '0' } });

      const regenerateButton = screen.getByText('Regenerate Dataset');
      fireEvent.click(regenerateButton);

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/request count must be greater than 0/i)
        ).toBeInTheDocument();
      });

      // Should not call regenerateData
      expect(mockService.regenerateData).not.toHaveBeenCalled();
    });
  });

  describe('AI Matching Testing', () => {
    beforeEach(async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });
    });

    it('should perform AI search with test query', async () => {
      const testQuery = 'police incident reports use of force';

      const queryInput = screen.getByLabelText('Test Query');
      fireEvent.change(queryInput, { target: { value: testQuery } });

      const searchButton = screen.getByText('Test AI Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockService.findMatches).toHaveBeenCalledWith(
          expect.any(String),
          testQuery,
          { maxResults: 10, minConfidence: 0.3 }
        );
      });
    });

    it('should display search results', async () => {
      const mockSearchResults = {
        requestId: 'test-search',
        candidates: [
          {
            id: 'doc-1',
            title: 'Police Use of Force Report',
            agency: 'Police Department',
            relevanceScore: 0.85,
            keyPhrases: ['use of force', 'police', 'incident'],
            summary: 'Document about police use of force incidents',
          },
        ],
        explanation: {
          queryTerms: ['police', 'incident', 'reports', 'force'],
          matchedPhrases: ['use of force', 'police'],
          semanticSimilarity: 0.75,
          keywordOverlap: 0.6,
          contextualRelevance: 0.8,
          reasoningSummary:
            'Strong match based on law enforcement terminology and incident reporting context.',
        },
        searchMetadata: {
          totalCandidatesScanned: 150,
          processingTimeMs: 125,
          searchTimestamp: new Date(),
          confidenceThreshold: 0.3,
        },
      };

      mockService.findMatches.mockResolvedValue(mockSearchResults);

      const testQuery = 'police incident reports';
      const queryInput = screen.getByLabelText('Test Query');
      fireEvent.change(queryInput, { target: { value: testQuery } });

      const searchButton = screen.getByText('Test AI Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText('Search Results (1 found)')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Police Use of Force Report')
        ).toBeInTheDocument();
        expect(screen.getByText('Relevance: 85%')).toBeInTheDocument();
        expect(screen.getByText('Police Department')).toBeInTheDocument();
      });

      // Check search explanation
      expect(screen.getByText('Search Explanation')).toBeInTheDocument();
      expect(screen.getByText('Semantic Similarity: 75%')).toBeInTheDocument();
      expect(screen.getByText('Keyword Overlap: 60%')).toBeInTheDocument();
      expect(screen.getByText('Contextual Relevance: 80%')).toBeInTheDocument();
    });

    it('should handle empty search results', async () => {
      mockService.findMatches.mockResolvedValue({
        requestId: 'test-empty',
        candidates: [],
        explanation: {
          queryTerms: ['nonsense'],
          matchedPhrases: [],
          semanticSimilarity: 0.1,
          keywordOverlap: 0.0,
          contextualRelevance: 0.1,
          reasoningSummary: 'No relevant matches found for the given query.',
        },
        searchMetadata: {
          totalCandidatesScanned: 100,
          processingTimeMs: 50,
          searchTimestamp: new Date(),
          confidenceThreshold: 0.3,
        },
      });

      const queryInput = screen.getByLabelText('Test Query');
      fireEvent.change(queryInput, { target: { value: 'nonsense query' } });

      const searchButton = screen.getByText('Test AI Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText('Search Results (0 found)')
        ).toBeInTheDocument();
        expect(
          screen.getByText('No matches found for your query.')
        ).toBeInTheDocument();
      });
    });

    it('should handle search errors', async () => {
      mockService.findMatches.mockRejectedValue(new Error('Search failed'));

      const queryInput = screen.getByLabelText('Test Query');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const searchButton = screen.getByText('Test AI Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      });
    });

    it('should prevent search with empty query', () => {
      const searchButton = screen.getByText('Test AI Search');
      fireEvent.click(searchButton);

      expect(mockService.findMatches).not.toHaveBeenCalled();
      expect(
        screen.getByText(/please enter a test query/i)
      ).toBeInTheDocument();
    });
  });

  describe('Data Tabs Navigation', () => {
    beforeEach(async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });
    });

    it('should switch between tabs', () => {
      // Default should be Requests tab
      expect(screen.getByText('Synthetic Requests (2)')).toBeInTheDocument();

      // Click Documents tab
      const documentsTab = screen.getByText('Documents');
      fireEvent.click(documentsTab);

      expect(screen.getByText('All Documents (2)')).toBeInTheDocument();

      // Click Analytics tab
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      expect(screen.getByText('Requests by Agency')).toBeInTheDocument();

      // Click Agency Details tab
      const agencyTab = screen.getByText('Agency Details');
      fireEvent.click(agencyTab);

      expect(screen.getByText('Select Agency')).toBeInTheDocument();
    });

    it('should display synthetic requests data', () => {
      expect(
        screen.getByText('Police incident reports from last quarter')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Fire department response times analysis')
      ).toBeInTheDocument();
      expect(screen.getByText('Complexity: moderate')).toBeInTheDocument();
      expect(screen.getByText('Persona: journalist')).toBeInTheDocument();
    });

    it('should display documents when Documents tab is active', () => {
      const documentsTab = screen.getByText('Documents');
      fireEvent.click(documentsTab);

      expect(
        screen.getByText('Police Use of Force Report')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Fire Emergency Response Log')
      ).toBeInTheDocument();
      expect(screen.getByText('Agency: police')).toBeInTheDocument();
      expect(screen.getByText('Type: incident_report')).toBeInTheDocument();
    });

    it('should display analytics when Analytics tab is active', () => {
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      expect(screen.getByText('Requests by Agency')).toBeInTheDocument();
      expect(screen.getByText('Documents by Agency')).toBeInTheDocument();
      expect(screen.getByText('Complexity Distribution')).toBeInTheDocument();
      expect(screen.getByText('Persona Distribution')).toBeInTheDocument();

      // Check some specific values
      expect(screen.getByText('police: 25')).toBeInTheDocument();
      expect(screen.getByText('fire: 20')).toBeInTheDocument();
      expect(screen.getByText('simple: 40')).toBeInTheDocument();
      expect(screen.getByText('journalist: 20')).toBeInTheDocument();
    });

    it('should display agency details when Agency Details tab is active', async () => {
      const agencyTab = screen.getByText('Agency Details');
      fireEvent.click(agencyTab);

      const agencySelect = screen.getByLabelText('Select Agency');
      fireEvent.mouseDown(agencySelect);

      // Should show agency options
      await waitFor(() => {
        expect(screen.getByText('police')).toBeInTheDocument();
        expect(screen.getByText('fire')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('police'));

      await waitFor(() => {
        expect(mockService.getDocumentsByAgency).toHaveBeenCalledWith('police');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing analytics data gracefully', () => {
      mockService.getDatasetAnalytics.mockReturnValue(null);

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('No dataset loaded')).toBeInTheDocument();
    });

    it('should handle empty document arrays', () => {
      mockService.getAllDocuments.mockReturnValue([]);
      mockService.getSyntheticRequests.mockReturnValue([]);

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      const documentsTab = screen.getByText('Documents');
      fireEvent.click(documentsTab);

      expect(
        screen.getByText('No documents generated yet')
      ).toBeInTheDocument();
    });

    it('should handle service method failures gracefully', async () => {
      mockService.getAllDocuments.mockImplementation(() => {
        throw new Error('Service error');
      });

      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      const documentsTab = screen.getByText('Documents');
      fireEvent.click(documentsTab);

      await waitFor(() => {
        expect(
          screen.getByText(/error loading documents/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle rapid user interactions', async () => {
      render(<EnhancedDataManagement />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(mockService.initialize).toHaveBeenCalled();
      });

      // Rapid clicking should not cause multiple API calls
      const regenerateButton = screen.getByText('Regenerate Dataset');
      fireEvent.click(regenerateButton);
      fireEvent.click(regenerateButton);
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockService.regenerateData).toHaveBeenCalledTimes(1);
      });
    });
  });
});
