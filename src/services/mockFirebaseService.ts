/**
 * Mock Firebase Service for Development
 * Provides persistent storage using localStorage that mimics Firebase operations
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

// Persistent storage keys
const STORAGE_KEY = 'mockFirebaseRequests';
const COUNTER_KEY = 'mockFirebaseCounter';

// Get database from localStorage or initialize empty
const getMockDatabase = (): { [key: string]: StoredRequest } => {
  if (typeof window === 'undefined') return {}; // Server-side
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save database to localStorage
const saveMockDatabase = (data: { [key: string]: StoredRequest }) => {
  if (typeof window === 'undefined') return; // Server-side
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save mock database to localStorage:', error);
  }
};

// Get and increment counter
const getNextRequestCounter = (): number => {
  if (typeof window === 'undefined') return Math.floor(Math.random() * 1000); // Server-side fallback
  
  try {
    const stored = localStorage.getItem(COUNTER_KEY);
    const current = stored ? parseInt(stored, 10) : 1;
    const next = current + 1;
    localStorage.setItem(COUNTER_KEY, next.toString());
    return current;
  } catch {
    return Math.floor(Math.random() * 1000);
  }
};

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

// Initialize with some log output
console.log('🔧 [Mock Firebase] Mock Firebase service initialized');

// Save a new request
export const saveRequest = async (
  requestData: RequestFormDataWithFiles
): Promise<{ id: string; trackingId: string }> => {
  console.log('📝 [Mock Firebase] Saving request:', requestData.title);
  
  const trackingId = generateTrackingId();
  const requestCounter = getNextRequestCounter();
  const id = `req_${requestCounter}_${Date.now()}`;
  
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

  const mockDatabase = getMockDatabase();
  mockDatabase[id] = newRequest;
  saveMockDatabase(mockDatabase);
  
  console.log('✅ [Mock Firebase] Request saved with ID:', trackingId);
  console.log('📊 [Mock Firebase] Total requests in database:', Object.keys(mockDatabase).length);
  return { id, trackingId };
};

// Get request by tracking ID
export const getRequestByTrackingId = async (
  trackingId: string
): Promise<StoredRequest | null> => {
  console.log('🔍 [Mock Firebase] Looking for request:', trackingId);
  
  const mockDatabase = getMockDatabase();
  console.log('📊 [Mock Firebase] Current database size:', Object.keys(mockDatabase).length);
  
  const request = Object.values(mockDatabase).find(
    (req: StoredRequest) => req.trackingId === trackingId
  );
  
  if (request) {
    console.log('✅ [Mock Firebase] Found request:', request.title);
    return request;
  }
  
  console.log('❌ [Mock Firebase] Request not found');
  return null;
};

// Get request by ID
export const getRequestById = async (id: string): Promise<StoredRequest | null> => {
  const mockDatabase = getMockDatabase();
  return mockDatabase[id] || null;
};

// Get all requests
export const getAllRequests = async (): Promise<StoredRequest[]> => {
  const mockDatabase = getMockDatabase();
  console.log('📋 [Mock Firebase] Getting all requests, count:', Object.keys(mockDatabase).length);
  
  return Object.values(mockDatabase).sort((a: StoredRequest, b: StoredRequest) => {
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
  const mockDatabase = getMockDatabase();
  
  if (mockDatabase[id]) {
    mockDatabase[id].status = status;
    mockDatabase[id].updatedAt = createMockTimestamp();
    saveMockDatabase(mockDatabase);
    console.log(`✅ [Mock Firebase] Updated request ${id} status to:`, status);
  }
};

// Add internal note
export const addInternalNote = async (
  requestId: string,
  content: string,
  addedBy: string
): Promise<void> => {
  const mockDatabase = getMockDatabase();
  
  if (mockDatabase[requestId]) {
    const note: InternalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      content,
      addedBy,
      addedAt: createMockTimestamp(),
    };

    if (!mockDatabase[requestId].internalNotes) {
      mockDatabase[requestId].internalNotes = [];
    }

    mockDatabase[requestId].internalNotes!.push(note);
    mockDatabase[requestId].updatedAt = createMockTimestamp();
    saveMockDatabase(mockDatabase);
    
    console.log(`✅ [Mock Firebase] Added note to request ${requestId}`);
  }
};

// Get requests by status
export const getRequestsByStatus = async (status: RequestStatus): Promise<StoredRequest[]> => {
  const mockDatabase = getMockDatabase();
  
  return Object.values(mockDatabase)
    .filter((req: StoredRequest) => req.status === status)
    .sort((a: StoredRequest, b: StoredRequest) => {
      const aTime = a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : 0;
      const bTime = b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : 0;
      return bTime - aTime; // Most recent first
    });
};

// Clear all data (for testing)
export const clearAllData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUNTER_KEY);
    console.log('🗑️ [Mock Firebase] All data cleared');
  }
};

// Get database stats
export const getDatabaseStats = () => {
  const mockDatabase = getMockDatabase();
  const requests = Object.values(mockDatabase);
  
  return {
    totalRequests: requests.length,
    statusCounts: requests.reduce((acc: Record<RequestStatus, number>, req: StoredRequest) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<RequestStatus, number>),
  };
};