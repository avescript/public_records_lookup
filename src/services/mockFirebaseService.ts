/**
 * Mock Firebase Service for Development
 * Provides in-memory storage that mimics Firebase operations
 */

import { RequestFormDataWithFiles } from '../components/request/RequestForm/types';

export type RequestStatus =
  | 'submitted'
  | 'processing'
  | 'under_review'
  | 'completed'
  | 'rejected';

export interface InternalNote {
  id: string;
  content: string;
  addedBy: string;
  addedAt: any; // Mock timestamp
}

export interface StoredRequest {
  id?: string;
  trackingId: string;
  title: string;
  department: string;
  description: string;
  dateRange: {
    startDate: string;
    endDate: string;
    preset?: string;
  };
  contactEmail: string;
  status: RequestStatus;
  submittedAt: any; // Mock timestamp
  updatedAt: any; // Mock timestamp
  attachmentCount: number;
  attachmentPaths?: string[];
  internalNotes?: InternalNote[];
}

// In-memory storage
let mockDatabase: { [key: string]: StoredRequest } = {};
let requestCounter = 1;

// Mock timestamp
const createMockTimestamp = (date: Date = new Date()) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
});

// Generate a unique tracking ID
export const generateTrackingId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PR-${timestamp}-${random}`;
};

// Save a new request
export const saveRequest = async (
  requestData: RequestFormDataWithFiles
): Promise<{ id: string; trackingId: string }> => {
  console.log('📝 [Mock Firebase] Saving request:', requestData.title);
  
  const trackingId = generateTrackingId();
  const id = `req_${requestCounter++}_${Date.now()}`;
  
  const newRequest: StoredRequest = {
    id,
    trackingId,
    title: requestData.title,
    department: requestData.department,
    description: requestData.description,
    dateRange: requestData.dateRange,
    contactEmail: requestData.contactEmail,
    status: 'submitted',
    submittedAt: createMockTimestamp(),
    updatedAt: createMockTimestamp(),
    attachmentCount: requestData.files?.length || 0,
    attachmentPaths: [],
    internalNotes: [],
  };

  mockDatabase[id] = newRequest;
  
  console.log('✅ [Mock Firebase] Request saved with ID:', trackingId);
  return { id, trackingId };
};

// Get request by tracking ID
export const getRequestByTrackingId = async (
  trackingId: string
): Promise<StoredRequest | null> => {
  console.log('🔍 [Mock Firebase] Looking for request:', trackingId);
  
  const request = Object.values(mockDatabase).find(
    req => req.trackingId === trackingId
  );
  
  if (request) {
    console.log('✅ [Mock Firebase] Found request:', request.title);
  } else {
    console.log('❌ [Mock Firebase] Request not found');
  }
  
  return request || null;
};

// Get request by ID
export const getRequestById = async (id: string): Promise<StoredRequest | null> => {
  console.log('🔍 [Mock Firebase] Looking for request by ID:', id);
  return mockDatabase[id] || null;
};

// Get all requests
export const getAllRequests = async (): Promise<StoredRequest[]> => {
  console.log('📋 [Mock Firebase] Getting all requests, count:', Object.keys(mockDatabase).length);
  
  return Object.values(mockDatabase).sort((a, b) => {
    const aTime = a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : 0;
    const bTime = b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : 0;
    return bTime - aTime; // Most recent first
  });
};

// Update request status
export const updateRequestStatus = async (
  id: string,
  status: RequestStatus
): Promise<void> => {
  console.log('🔄 [Mock Firebase] Updating request status:', id, status);
  
  if (mockDatabase[id]) {
    mockDatabase[id].status = status;
    mockDatabase[id].updatedAt = createMockTimestamp();
    console.log('✅ [Mock Firebase] Status updated successfully');
  } else {
    console.error('❌ [Mock Firebase] Request not found for status update');
    throw new Error('Request not found');
  }
};

// Add internal note
export const addInternalNote = async (
  requestId: string,
  content: string,
  addedBy: string = 'Staff User'
): Promise<void> => {
  console.log('📝 [Mock Firebase] Adding note to request:', requestId);
  
  if (mockDatabase[requestId]) {
    const note: InternalNote = {
      id: `note_${Date.now()}`,
      content,
      addedBy,
      addedAt: createMockTimestamp(),
    };
    
    if (!mockDatabase[requestId].internalNotes) {
      mockDatabase[requestId].internalNotes = [];
    }
    
    mockDatabase[requestId].internalNotes!.push(note);
    mockDatabase[requestId].updatedAt = createMockTimestamp();
    
    console.log('✅ [Mock Firebase] Note added successfully');
  } else {
    console.error('❌ [Mock Firebase] Request not found for note');
    throw new Error('Request not found');
  }
};

// Get requests by status
export const getRequestsByStatus = async (
  status: RequestStatus
): Promise<StoredRequest[]> => {
  console.log('🔍 [Mock Firebase] Getting requests by status:', status);
  
  return Object.values(mockDatabase)
    .filter(req => req.status === status)
    .sort((a, b) => {
      const aTime = a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : 0;
      const bTime = b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
};

// Get requests by department
export const getRequestsByDepartment = async (
  department: string
): Promise<StoredRequest[]> => {
  console.log('🔍 [Mock Firebase] Getting requests by department:', department);
  
  return Object.values(mockDatabase)
    .filter(req => req.department === department)
    .sort((a, b) => {
      const aTime = a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : 0;
      const bTime = b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
};

// Clear all mock data (for testing)
export const clearMockData = (): void => {
  console.log('🧹 [Mock Firebase] Clearing all mock data');
  mockDatabase = {};
  requestCounter = 1;
};

// Get current mock data (for debugging)
export const getMockData = (): { [key: string]: StoredRequest } => {
  return mockDatabase;
};

console.log('🔧 [Mock Firebase] Mock Firebase service initialized');

export default {
  saveRequest,
  getRequestByTrackingId,
  getRequestById,
  getAllRequests,
  updateRequestStatus,
  addInternalNote,
  getRequestsByStatus,
  getRequestsByDepartment,
  generateTrackingId,
  clearMockData,
  getMockData,
};