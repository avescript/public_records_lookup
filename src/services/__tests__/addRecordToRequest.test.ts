/**
 * Test for addRecordToRequest functionality
 * Verifies that accepting AI matches properly adds records to requests
 */

import { Timestamp } from 'firebase/firestore';
import * as mockService from '../mockFirebaseService';
import { addRecordToRequest, saveRequest } from '../requestService';

// Mock environment to use mock service
const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE;
beforeAll(() => {
  process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE = 'true';
});

afterAll(() => {
  process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE = originalEnv;
  mockService.clearAllData();
});

describe('addRecordToRequest', () => {
  let requestId: string;
  
  beforeEach(async () => {
    mockService.clearAllData();
    
    // Create a test request
    const result = await saveRequest({
      title: 'Test Request',
      department: 'Police',
      description: 'Test description',
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        preset: 'custom'
      },
      contactEmail: 'test@example.com',
      files: []
    });
    
    requestId = result.id;
  });

  it('should successfully add a record to a request', async () => {
    const candidateId = 'test-candidate-123';
    const candidateData = {
      title: 'Police Report #123',
      description: 'Traffic incident report',
      source: 'Police Reports',
      recordType: 'incident_report',
      agency: 'Metro Police',
      dateCreated: '2024-01-15',
      relevanceScore: 0.87,
      confidence: 'high' as const,
      keyPhrases: ['traffic', 'incident', 'collision'],
      metadata: {
        fileSize: '2.1 MB',
        pageCount: 3,
        classification: 'public'
      }
    };

    // Add record to request
    await addRecordToRequest(requestId, candidateId, candidateData, 'Test Staff');

    // Verify record was added
    const request = await mockService.getRequestById(requestId);
    expect(request).not.toBeNull();
    expect(request!.associatedRecords).toHaveLength(1);
    expect(request!.associatedRecords![0]).toMatchObject({
      candidateId,
      title: candidateData.title,
      description: candidateData.description,
      source: candidateData.source,
      acceptedBy: 'Test Staff',
    });
    expect(request!.status).toBe('under_review');
  });

  it('should prevent duplicate records', async () => {
    const candidateId = 'duplicate-candidate';
    const candidateData = {
      title: 'Duplicate Record',
      description: 'This record will be added twice',
      source: 'Test Source',
      recordType: 'test',
      agency: 'Test Agency',
      dateCreated: '2024-01-01',
      relevanceScore: 0.5,
      confidence: 'medium' as const,
      keyPhrases: ['test'],
      metadata: {}
    };

    // Add record twice
    await addRecordToRequest(requestId, candidateId, candidateData);
    await addRecordToRequest(requestId, candidateId, candidateData);

    // Should only have one record
    const request = await mockService.getRequestById(requestId);
    expect(request).not.toBeNull();
    expect(request!.associatedRecords).toHaveLength(1);
  });

  it('should update request status to under_review when first record is added', async () => {
    const candidateData = {
      title: 'First Record',
      description: 'Test description',
      source: 'Test Source',
      recordType: 'test',
      agency: 'Test Agency',
      dateCreated: '2024-01-01',
      relevanceScore: 0.8,
      confidence: 'high' as const,
      keyPhrases: ['test'],
      metadata: {}
    };

    // Initial status should be 'submitted'
    let request = await mockService.getRequestById(requestId);
    expect(request).not.toBeNull();
    expect(request!.status).toBe('submitted');

    // Add first record
    await addRecordToRequest(requestId, 'first-record', candidateData);

    // Status should now be 'under_review'
    request = await mockService.getRequestById(requestId);
    expect(request).not.toBeNull();
    expect(request!.status).toBe('under_review');
  });

  it('should handle non-existent request', async () => {
    const candidateData = {
      title: 'Test Record',
      description: 'Test description',
      source: 'Test Source',
      recordType: 'test',
      agency: 'Test Agency',
      dateCreated: '2024-01-01',
      relevanceScore: 0.5,
      confidence: 'medium' as const,
      keyPhrases: ['test'],
      metadata: {}
    };

    await expect(
      addRecordToRequest('non-existent-id', 'candidate-123', candidateData)
    ).rejects.toThrow('Request non-existent-id not found');
  });
});