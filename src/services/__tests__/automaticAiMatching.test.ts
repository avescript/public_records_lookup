import { findMatches } from '../aiMatchingService';
import { saveRequest } from '../requestService';
import * as mockService from '../mockFirebaseService';

// Mock the AI matching service
jest.mock('../aiMatchingService');
const mockFindMatches = findMatches as jest.MockedFunction<typeof findMatches>;

describe('Automatic AI Matching Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.clearAllData();
    // Mock findMatches to return a successful result
    mockFindMatches.mockResolvedValue({
      requestId: 'test-request',
      candidates: [],
      explanation: {
        queryTerms: ['test', 'automatic', 'matching'],
        matchedPhrases: [],
        semanticSimilarity: 0.8,
        keywordOverlap: 0.6,
        contextualRelevance: 0.7,
        reasoningSummary: 'Test auto-matching'
      },
      searchMetadata: {
        totalCandidatesScanned: 0,
        processingTimeMs: 100,
        confidenceThreshold: 0.7,
        searchTimestamp: new Date().toISOString()
      }
    });
  });

  afterEach(() => {
    mockService.clearAllData();
  });

  it('should automatically trigger AI matching when creating a new request', async () => {
    console.log('🧪 Testing automatic AI matching on request creation...');
    
    const requestData = {
      title: 'Automatic Matching Test',
      department: 'Police',
      description: 'Testing automatic AI matching functionality',
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      contactEmail: 'test@example.com',
      files: []
    };

    // Create a new request - this should automatically trigger AI matching
    const result = await saveRequest(requestData);
    
    console.log('✅ Request created with ID:', result.id);
    console.log('✅ Tracking ID:', result.trackingId);
    
    // Verify that findMatches was called automatically
    expect(mockFindMatches).toHaveBeenCalledWith(
      result.id,
      requestData.description
    );
    
    console.log('✅ AI matching was automatically triggered for new request');
  });

  it('should handle AI matching errors gracefully during request creation', async () => {
    console.log('🧪 Testing error handling in automatic AI matching...');
    
    // Mock findMatches to throw an error
    mockFindMatches.mockRejectedValue(new Error('AI matching service unavailable'));
    
    const requestData = {
      title: 'Error Handling Test',
      department: 'Fire',
      description: 'Testing error handling in automatic AI matching',
      dateRange: {
        startDate: '2024-02-01',
        endDate: '2024-02-28'
      },
      contactEmail: 'test@example.com',
      files: []
    };

    // Create a new request - AI matching should fail but request creation should succeed
    const result = await saveRequest(requestData);
    
    console.log('✅ Request created successfully despite AI matching error');
    console.log('✅ Request ID:', result.id);
    console.log('✅ Tracking ID:', result.trackingId);
    
    // Verify that findMatches was attempted
    expect(mockFindMatches).toHaveBeenCalledWith(
      result.id,
      requestData.description
    );
    
    // Verify the request was still created successfully
    expect(result.id).toBeDefined();
    expect(result.trackingId).toBeDefined();
    
    console.log('✅ Error handling works correctly - request creation not affected by AI matching failures');
  });

  it('should verify automatic AI matching passes correct parameters', async () => {
    console.log('🧪 Testing automatic AI matching parameter passing...');
    
    const requestData = {
      title: 'Parameter Test Request',
      department: 'Health',
      description: 'This is a detailed description for testing parameter passing to automatic AI matching',
      dateRange: {
        startDate: '2024-03-01',
        endDate: '2024-03-31'
      },
      contactEmail: 'params@example.com',
      files: []
    };

    const result = await saveRequest(requestData);
    
    // Verify findMatches was called with correct parameters
    expect(mockFindMatches).toHaveBeenCalledTimes(1);
    expect(mockFindMatches).toHaveBeenCalledWith(
      result.id,                    // Request ID
      requestData.description       // Request description for AI analysis
    );
    
    // Get the actual call arguments
    const [requestId, description] = mockFindMatches.mock.calls[0];
    
    expect(requestId).toBe(result.id);
    expect(description).toBe(requestData.description);
    
    console.log('✅ Automatic AI matching called with correct parameters:');
    console.log('  - Request ID:', requestId);
    console.log('  - Description:', description);
  });
});