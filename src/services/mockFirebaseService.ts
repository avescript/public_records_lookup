/**
 * Mock Firebase Service for Development
 * Provides persistent storage using localStorage that mimics Firebase operations
 */

import { RequestFormDataWithFiles } from '../components/request/RequestForm/types';

import { auditService } from './auditService';

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

export interface AssociatedRecord {
  candidateId: string;
  title: string;
  description: string;
  source: string;
  recordType: string;
  agency: string;
  dateCreated: string;
  relevanceScore: number;
  confidence: 'high' | 'medium' | 'low';
  keyPhrases: string[];
  metadata: {
    fileSize?: string;
    pageCount?: number;
    lastModified?: string;
    classification?: string;
  };
  acceptedBy: string;
  acceptedAt: any; // Mock timestamp
}

export interface StoredRequest {
  id?: string;
  trackingId: string;
  title: string;
  department: string;
  description: string;
  agency?: string; // Agency identifier for multi-agency support
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
  associatedRecords?: AssociatedRecord[];
}

// Persistent storage keys
const STORAGE_KEY = 'mockFirebaseRequests';
const COUNTER_KEY = 'mockFirebaseCounter';

// Get database from localStorage or initialize empty
const getMockDatabase = (): { [key: string]: StoredRequest } => {
  if (typeof window === 'undefined') return {}; // Server-side

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const data = JSON.parse(stored);

    // Reconstruct timestamp functions for data loaded from localStorage
    Object.values(data).forEach((request: any) => {
      if (request.submittedAt && request.submittedAt._isoString) {
        request.submittedAt.toDate = () =>
          new Date(request.submittedAt._isoString);
      }
      if (request.updatedAt && request.updatedAt._isoString) {
        request.updatedAt.toDate = () => new Date(request.updatedAt._isoString);
      }
      // Fix internal notes timestamps too
      if (request.internalNotes) {
        request.internalNotes.forEach((note: any) => {
          if (note.addedAt && note.addedAt._isoString) {
            note.addedAt.toDate = () => new Date(note.addedAt._isoString);
          }
        });
      }
    });

    return data;
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

// Mock timestamp - store as ISO string for localStorage compatibility
const createMockTimestamp = (date: Date = new Date()) => {
  const isoString = date.toISOString();
  return {
    toDate: () => new Date(isoString),
    seconds: Math.floor(date.getTime() / 1000),
    // Store the ISO string so it survives localStorage serialization
    _isoString: isoString,
  };
};

// Generate a unique tracking ID
export const generateTrackingId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PR-${timestamp}-${random}`;
};

// Initialize with some log output
console.log('🔧 [Mock Firebase] Mock Firebase service initialized');

// Map department to agency for multi-agency support
const mapDepartmentToAgency = (department: string): string => {
  const departmentAgencyMap: { [key: string]: string } = {
    // Police Department
    police: 'police',
    patrol: 'police',
    investigations: 'police',
    traffic: 'police',
    community_relations: 'police',
    internal_affairs: 'police',

    // Fire Department
    fire: 'fire',
    emergency_response: 'fire',
    fire_prevention: 'fire',
    hazmat: 'fire',

    // Finance Department
    finance: 'finance',
    accounting: 'finance',
    budget: 'finance',
    payroll: 'finance',
    procurement: 'finance',
    audit: 'finance',

    // Public Works
    public_works: 'public_works',
    transportation: 'public_works',
    utilities: 'public_works',
    engineering: 'public_works',

    // Legal Department
    legal: 'legal',
    city_attorney: 'legal',
    contracts: 'legal',
    litigation: 'legal',

    // Parks Department
    parks: 'parks',
    recreation: 'parks',
    facilities: 'parks',

    // Clerk/Other
    clerk: 'clerk',
    other: 'clerk', // Default fallback
  };

  return departmentAgencyMap[department] || 'clerk'; // Default to clerk if not found
};

// Save a new request
export const saveRequest = async (
  requestData: RequestFormDataWithFiles
): Promise<{ id: string; trackingId: string }> => {
  console.log('📝 [Mock Firebase] Saving request:', requestData.title);

  const trackingId = generateTrackingId();
  const requestCounter = getNextRequestCounter();
  const id = `req_${requestCounter}_${Date.now()}`;

  // Determine agency based on department
  const agency = mapDepartmentToAgency(requestData.department);

  const newRequest: StoredRequest = {
    id,
    trackingId,
    title: requestData.title,
    department: requestData.department,
    description: requestData.description,
    agency, // Add agency field based on department
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

  console.log('✅ [Mock Firebase] Request saved with agency assignment:', {
    id,
    trackingId,
    agency,
  });

  // Log audit event
  try {
    await auditService.logEvent(
      'MockFirebaseService',
      'request_submitted',
      requestData.contactEmail,
      'Citizen',
      'citizen',
      'request',
      id,
      {
        title: requestData.title,
        department: requestData.department,
        agency,
        trackingId,
        attachmentCount: requestData.files?.length || 0,
      },
      'info',
      'user_action',
      {
        requestId: id,
      }
    );
  } catch (error) {
    console.warn('Failed to log audit event for request submission:', error);
  }

  console.log('✅ [Mock Firebase] Request saved with ID:', trackingId);
  console.log(
    '📊 [Mock Firebase] Total requests in database:',
    Object.keys(mockDatabase).length
  );
  return { id, trackingId };
};

// Get request by tracking ID
export const getRequestByTrackingId = async (
  trackingId: string
): Promise<StoredRequest | null> => {
  console.log('🔍 [Mock Firebase] Looking for request:', trackingId);

  const mockDatabase = getMockDatabase();
  console.log(
    '📊 [Mock Firebase] Current database size:',
    Object.keys(mockDatabase).length
  );

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
export const getRequestById = async (
  id: string
): Promise<StoredRequest | null> => {
  const mockDatabase = getMockDatabase();
  return mockDatabase[id] || null;
};

// Get all requests
export const getAllRequests = async (): Promise<StoredRequest[]> => {
  const mockDatabase = getMockDatabase();
  console.log(
    '📋 [Mock Firebase] Getting all requests, count:',
    Object.keys(mockDatabase).length
  );

  return Object.values(mockDatabase).sort(
    (a: StoredRequest, b: StoredRequest) => {
      const aTime = a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : 0;
      const bTime = b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : 0;
      return bTime - aTime; // Most recent first
    }
  );
};

// Update request status
export const updateRequestStatus = async (
  id: string,
  status: RequestStatus
): Promise<void> => {
  const mockDatabase = getMockDatabase();

  if (mockDatabase[id]) {
    const previousStatus = mockDatabase[id].status;
    mockDatabase[id].status = status;
    mockDatabase[id].updatedAt = createMockTimestamp();
    saveMockDatabase(mockDatabase);

    // Log audit event
    try {
      await auditService.logEvent(
        'MockFirebaseService',
        'request_status_updated',
        'staff_user',
        'Staff User',
        'records_officer',
        'request',
        id,
        {
          previousStatus,
          newStatus: status,
          trackingId: mockDatabase[id].trackingId,
        },
        'info',
        'user_action',
        {
          requestId: id,
        }
      );
    } catch (error) {
      console.warn('Failed to log audit event for status update:', error);
    }

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
export const getRequestsByStatus = async (
  status: RequestStatus
): Promise<StoredRequest[]> => {
  const mockDatabase = getMockDatabase();

  return Object.values(mockDatabase)
    .filter((req: StoredRequest) => req.status === status)
    .sort((a: StoredRequest, b: StoredRequest) => {
      const aTime = a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : 0;
      const bTime = b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : 0;
      return bTime - aTime; // Most recent first
    });
};

// Add an associated record to a request (from AI match acceptance) - Mock version
export const addRecordToRequest = async (
  requestId: string,
  candidateId: string,
  candidateData: {
    title: string;
    description: string;
    source: string;
    recordType: string;
    agency: string;
    dateCreated: string;
    relevanceScore: number;
    confidence: 'high' | 'medium' | 'low';
    keyPhrases: string[];
    metadata: {
      fileSize?: string;
      pageCount?: number;
      lastModified?: string;
      classification?: string;
    };
  },
  acceptedBy: string = 'Staff User'
): Promise<void> => {
  const mockDatabase = getMockDatabase();

  if (!mockDatabase[requestId]) {
    throw new Error(`Request ${requestId} not found`);
  }

  const newRecord: AssociatedRecord = {
    candidateId,
    ...candidateData,
    acceptedBy,
    acceptedAt: createMockTimestamp(),
  };

  if (!mockDatabase[requestId].associatedRecords) {
    mockDatabase[requestId].associatedRecords = [];
  }

  // Check for duplicates
  const existingRecord = mockDatabase[requestId].associatedRecords!.find(
    record => record.candidateId === candidateId
  );

  if (existingRecord) {
    console.log(
      '⚠️ [Mock Firebase] Record already associated with request:',
      candidateId
    );
    return;
  }

  mockDatabase[requestId].associatedRecords!.push(newRecord);
  mockDatabase[requestId].updatedAt = createMockTimestamp();

  const wasFirstRecord =
    mockDatabase[requestId].associatedRecords!.length === 1;

  // Update status to under_review if this is the first record
  if (wasFirstRecord) {
    mockDatabase[requestId].status = 'under_review';
  }

  saveMockDatabase(mockDatabase);

  // Log audit event
  try {
    await auditService.logEvent(
      'MockFirebaseService',
      'record_added_to_request',
      acceptedBy,
      acceptedBy,
      'records_officer',
      'record',
      candidateId,
      {
        title: candidateData.title,
        source: candidateData.source,
        agency: candidateData.agency,
        relevanceScore: candidateData.relevanceScore,
        confidence: candidateData.confidence,
        wasFirstRecord,
        totalRecords: mockDatabase[requestId].associatedRecords!.length,
      },
      'info',
      'user_action',
      {
        requestId,
        recordId: candidateId,
      }
    );
  } catch (error) {
    console.warn('Failed to log audit event for record addition:', error);
  }

  console.log(
    `✅ [Mock Firebase] Added record ${candidateId} to request ${requestId}`
  );
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
    statusCounts: requests.reduce(
      (acc: Record<RequestStatus, number>, req: StoredRequest) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      },
      {} as Record<RequestStatus, number>
    ),
  };
};

// Package service mock functions for Epic 6

// Package manifest interface (duplicated to avoid circular imports)
interface PackageManifest {
  id: string;
  requestId: string;
  title: string;
  description?: string;
  coverSheet: {
    title: string;
    requestorName: string;
    requestDate: string;
    department: string;
    totalPages: number;
    totalRecords: number;
  };
  records: Array<{
    recordId: string;
    title: string;
    source: string;
    pageCount: number;
    order: number;
    includeInPackage: boolean;
  }>;
  metadata: {
    createdBy: string;
    createdAt: any; // Mock timestamp
    status: 'draft' | 'building' | 'ready' | 'sent';
    totalPages: number;
    estimatedDeliverySize: string;
  };
  auditTrail: {
    packageBuilt?: {
      timestamp: any;
      byUser: string;
    };
    packageApproved?: {
      timestamp: any;
      byUser: string;
    };
    packageSent?: {
      timestamp: any;
      byUser: string;
      method: 'email' | 'portal';
    };
  };
}

interface PackageBuildResult {
  manifest: PackageManifest;
  previewUrl?: string;
  downloadUrl?: string;
}

// Package storage keys
const PACKAGES_STORAGE_KEY = 'mockFirebasePackages';

// Get packages database from localStorage
const getPackagesDatabase = (): { [key: string]: PackageManifest } => {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(PACKAGES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Error loading packages from localStorage:', error);
    return {};
  }
};

// Save packages database to localStorage
const savePackagesDatabase = (packages: { [key: string]: PackageManifest }) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  } catch (error) {
    console.error('Error saving packages to localStorage:', error);
  }
};

// Build package (mock implementation)
export const buildPackage = async (
  manifest: PackageManifest
): Promise<PackageBuildResult> => {
  const packagesDatabase = getPackagesDatabase();

  const updatedManifest = {
    ...manifest,
    metadata: {
      ...manifest.metadata,
      status: 'ready' as const,
    },
  };

  // Save to packages database
  packagesDatabase[manifest.id] = updatedManifest;
  savePackagesDatabase(packagesDatabase);

  console.log(
    `✅ [Mock Firebase] Built package ${manifest.id} with ${manifest.records.length} records`
  );

  return {
    manifest: updatedManifest,
    previewUrl: `/mock/packages/${manifest.id}/preview.pdf`,
    downloadUrl: `/mock/packages/${manifest.id}/download.pdf`,
  };
};

// Get package by ID (mock implementation)
export const getPackageById = async (
  packageId: string
): Promise<PackageManifest | null> => {
  const packagesDatabase = getPackagesDatabase();
  return packagesDatabase[packageId] || null;
};

// Get packages for request (mock implementation)
export const getPackagesForRequest = async (
  requestId: string
): Promise<PackageManifest[]> => {
  const packagesDatabase = getPackagesDatabase();
  return Object.values(packagesDatabase).filter(
    pkg => pkg.requestId === requestId
  );
};

// Cross-agency request routing (mock implementation)
export const routeRequestToAgency = async (
  requestId: string,
  targetAgency: string,
  reason: string,
  routedBy: string
): Promise<void> => {
  console.log('🔄 [Mock Firebase] Routing request to agency:', {
    requestId,
    targetAgency,
    reason,
  });

  const database = getMockDatabase();

  if (!database[requestId]) {
    throw new Error('Request not found');
  }

  const request = database[requestId];

  // Create routing internal note
  const routingNote = {
    id: generateId(),
    content: `Request routed to ${targetAgency}. Reason: ${reason}`,
    addedBy: routedBy,
    addedAt: createMockTimestamp(new Date()),
  };

  // Update request with new agency and routing note
  database[requestId] = {
    ...request,
    agency: targetAgency,
    updatedAt: createMockTimestamp(new Date()),
    internalNotes: [...(request.internalNotes || []), routingNote],
  };

  saveMockDatabase(database);

  // Log audit event
  auditService.logEvent({
    service: 'MockFirebaseService',
    action: 'routeRequestToAgency',
    severity: 'info',
    details: { requestId, targetAgency, reason, routedBy },
  });

  console.log('✅ [Mock Firebase] Request routed to agency:', targetAgency);
};
