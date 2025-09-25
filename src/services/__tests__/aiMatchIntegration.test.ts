/**
 * Integration test for the complete AI match acceptance workflow
 */

import { format } from 'date-fns';
import * as mockService from '../mockFirebaseService';
import { addRecordToRequest, getRequestById, saveRequest } from '../requestService';

// Mock environment to use mock service
const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE;
beforeAll(() => {
  process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE = 'true';
});

afterAll(() => {
  process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE = originalEnv;
  mockService.clearAllData();
});

describe('AI Match Acceptance Integration', () => {
  let requestId: string;
  
  beforeEach(async () => {
    mockService.clearAllData();
    
    // Create a test request
    const result = await saveRequest({
      title: 'Integration Test Request',
      department: 'Police',
      description: 'Testing the complete workflow',
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        preset: 'custom'
      },
      contactEmail: 'integration@test.com',
      files: []
    });
    
    requestId = result.id;
  });

  it('should complete the full AI match acceptance workflow', async () => {
    // 1. Initial request should have no associated records
    let request = await getRequestById(requestId);
    expect(request).not.toBeNull();
    expect(request!.associatedRecords).toBeUndefined();
    expect(request!.status).toBe('submitted');

    // 2. Accept a match candidate
    const candidateId = 'integration-candidate-123';
    const candidateData = {
      title: 'Integration Police Report #456',
      description: 'Test incident report for integration testing',
      source: 'Police Reports Database',
      recordType: 'incident_report',
      agency: 'Metro Police Department',
      dateCreated: '2024-01-15',
      relevanceScore: 0.92,
      confidence: 'high' as const,
      keyPhrases: ['incident', 'report', 'police', 'integration'],
      metadata: {
        fileSize: '1.5 MB',
        pageCount: 2,
        classification: 'public'
      }
    };

    await addRecordToRequest(requestId, candidateId, candidateData, 'Integration Test Staff');

    // 3. Verify the request now has the associated record and updated status
    request = await getRequestById(requestId);
    expect(request).not.toBeNull();
    expect(request!.associatedRecords).toHaveLength(1);
    expect(request!.status).toBe('under_review');

    // 4. Verify the associated record details
    const associatedRecord = request!.associatedRecords![0];
    expect(associatedRecord).toMatchObject({
      candidateId,
      title: candidateData.title,
      description: candidateData.description,
      source: candidateData.source,
      recordType: candidateData.recordType,
      agency: candidateData.agency,
      relevanceScore: candidateData.relevanceScore,
      confidence: candidateData.confidence,
      acceptedBy: 'Integration Test Staff'
    });

    // 5. Verify audit fields
    expect(associatedRecord.acceptedAt).toBeDefined();
    expect(associatedRecord.keyPhrases).toEqual(candidateData.keyPhrases);
    expect(associatedRecord.metadata).toEqual(candidateData.metadata);

    console.log('✅ Integration test passed - Full workflow working correctly!');
  });

  it('should handle multiple accepted matches', async () => {
    // Accept first match
    await addRecordToRequest(requestId, 'candidate-1', {
      title: 'First Record',
      description: 'First test record',
      source: 'Source A',
      recordType: 'type_a',
      agency: 'Agency A',
      dateCreated: '2024-01-01',
      relevanceScore: 0.8,
      confidence: 'high' as const,
      keyPhrases: ['first'],
      metadata: {}
    });

    // Accept second match
    await addRecordToRequest(requestId, 'candidate-2', {
      title: 'Second Record',
      description: 'Second test record',
      source: 'Source B',
      recordType: 'type_b', 
      agency: 'Agency B',
      dateCreated: '2024-01-02',
      relevanceScore: 0.75,
      confidence: 'medium' as const,
      keyPhrases: ['second'],
      metadata: {}
    });

    // Verify both records are present
    const request = await getRequestById(requestId);
    expect(request!.associatedRecords).toHaveLength(2);
    expect(request!.status).toBe('under_review');
    
    const titles = request!.associatedRecords!.map(r => r.title);
    expect(titles).toContain('First Record');
    expect(titles).toContain('Second Record');
  });
});