/**
 * Request Service
 * Handles all Firebase operations for public records requests
 * Falls back to mock service when Firebase is unavailable
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  UpdateData,
  updateDoc,
  where,
} from 'firebase/firestore';

import { RequestFormDataWithFiles } from '../components/request/RequestForm/types';
import firestore from '../lib/firebase';
import * as mockService from './mockFirebaseService';

// Check if we should use mock service (when Firebase is unavailable)
const useMockService = () => {
  const shouldUseMock = process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === 'true' || 
         (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  console.log('🤔 [Request Service] useMockService check:', shouldUseMock, {
    env: process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
  });
  return shouldUseMock;
};

// Request status enum
export type RequestStatus =
  | 'submitted'
  | 'processing'
  | 'under_review'
  | 'completed'
  | 'rejected';

// Internal note type for staff tracking
export interface InternalNote {
  id: string;
  content: string;
  addedBy: string; // Staff member who added the note
  addedAt: Timestamp;
}

// Associated record from accepted AI match
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
  acceptedBy: string; // Staff member who accepted the match
  acceptedAt: Timestamp;
}

// Extended request type with metadata
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
  submittedAt: Timestamp;
  updatedAt: Timestamp;
  attachmentCount: number;
  attachmentPaths?: string[]; // Paths to uploaded files in storage
  internalNotes?: InternalNote[]; // Staff notes for workflow tracking
  associatedRecords?: AssociatedRecord[]; // Records added from AI match acceptance
}

// Generate a unique tracking ID
export const generateTrackingId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PR-${timestamp}-${random}`;
};

// Save a new request to Firestore or mock service
export const saveRequest = async (
  requestData: RequestFormDataWithFiles
): Promise<{ id: string; trackingId: string }> => {
  console.log('💾 [Request Service] Saving request:', requestData.title);
  
  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    console.log('🔄 [Request Service] Using mock service for saveRequest');
    const result = await mockService.saveRequest(requestData);
    console.log('✅ [Request Service] Mock service saved request:', result.trackingId);
    return result;
  }

  try {
    console.log('🔥 [Request Service] Attempting Firebase saveRequest');
    const trackingId = generateTrackingId();
    const now = Timestamp.now();

    // Prepare the request document (excluding files which are handled separately)
    const requestDoc: Omit<StoredRequest, 'id'> = {
      trackingId,
      title: requestData.title,
      department: requestData.department,
      description: requestData.description,
      dateRange: requestData.dateRange,
      contactEmail: requestData.contactEmail,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      attachmentCount: requestData.files?.length || 0,
      // TODO: Handle file uploads to Firebase Storage and store paths
      attachmentPaths: [],
    };

    // Add to Firestore
    const docRef = await addDoc(collection(firestore, 'requests'), requestDoc);
    console.log('Request saved with ID:', docRef.id);
    return { id: docRef.id, trackingId };
  } catch (error) {
    console.error('Error saving request:', error);
    console.log('🔄 Falling back to mock service due to Firebase error');
    const result = await mockService.saveRequest(requestData);
    console.log('✅ [Request Service] Mock service fallback saved request:', result.trackingId);
    return result;
  }
};

// Get a request by tracking ID
export const getRequestByTrackingId = async (
  trackingId: string
): Promise<StoredRequest | null> => {
  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    return mockService.getRequestByTrackingId(trackingId);
  }

  try {
    const q = query(
      collection(firestore, 'requests'),
      where('trackingId', '==', trackingId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as Omit<StoredRequest, 'id'>),
    };
  } catch (error) {
    console.error('Error fetching request by tracking ID:', error);
    console.log('🔄 Falling back to mock service due to Firebase error');
    return mockService.getRequestByTrackingId(trackingId);
  }
};

// Get a request by document ID
export const getRequestById = async (
  id: string
): Promise<StoredRequest | null> => {
  console.log('🔍 [Request Service] Getting request by ID:', id);
  
  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    console.log('🔄 [Request Service] Using mock service for getRequestById');
    return await mockService.getRequestById(id);
  }

  try {
    console.log('🔥 [Request Service] Attempting Firebase getRequestById');
    const docRef = doc(firestore, 'requests', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('❌ [Request Service] Request not found:', id);
      return null;
    }

    const result = {
      id: docSnap.id,
      ...(docSnap.data() as Omit<StoredRequest, 'id'>),
    };
    console.log('✅ [Request Service] Firebase request retrieved:', id);
    return result;
  } catch (error) {
    console.error('❌ [Request Service] Error fetching request by ID:', error);
    throw new Error('Failed to fetch request');
  }
};

// Get all requests (for admin/staff views)
export const getAllRequests = async (): Promise<StoredRequest[]> => {
  console.log('🔍 [Request Service] Getting all requests...');
  
  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    console.log('🔄 [Request Service] Using mock service for getAllRequests');
    const result = await mockService.getAllRequests();
    console.log('📊 [Request Service] Mock service returned:', result.length, 'requests');
    return result;
  }

  try {
    console.log('🔥 [Request Service] Attempting Firebase getAllRequests');
    const q = query(
      collection(firestore, 'requests'),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<StoredRequest, 'id'>),
    }));
  } catch (error) {
    console.error('Error fetching all requests:', error);
    console.log('🔄 Falling back to mock service due to Firebase error');
    const result = await mockService.getAllRequests();
    console.log('📊 [Request Service] Mock service fallback returned:', result.length, 'requests');
    return result;
  }
};

// Update request status
export const updateRequestStatus = async (
  id: string,
  status: RequestStatus
): Promise<void> => {
  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    return mockService.updateRequestStatus(id, status);
  }

  try {
    const docRef = doc(firestore, 'requests', id);
    const updateData: UpdateData<StoredRequest> = {
      status,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, updateData);
    console.log('Request status updated:', id, status);
  } catch (error) {
    console.error('Error updating request status:', error);
    console.log('🔄 Falling back to mock service due to Firebase error');
    return mockService.updateRequestStatus(id, status);
  }
};

// Get requests by status (for staff queues)
export const getRequestsByStatus = async (
  status: RequestStatus
): Promise<StoredRequest[]> => {
  try {
    const q = query(
      collection(firestore, 'requests'),
      where('status', '==', status),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<StoredRequest, 'id'>),
    }));
  } catch (error) {
    console.error('Error fetching requests by status:', error);
    throw new Error('Failed to fetch requests');
  }
};

// Get requests by department (for department-specific queues)
export const getRequestsByDepartment = async (
  department: string
): Promise<StoredRequest[]> => {
  try {
    const q = query(
      collection(firestore, 'requests'),
      where('department', '==', department),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<StoredRequest, 'id'>),
    }));
  } catch (error) {
    console.error('Error fetching requests by department:', error);
    throw new Error('Failed to fetch requests');
  }
};

// Add internal note to a request
export const addInternalNote = async (
  requestId: string,
  content: string,
  addedBy: string = 'Staff User'
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'requests', requestId);
    
    // Create new note
    const newNote: InternalNote = {
      id: generateTrackingId(), // Reuse tracking ID generator for note IDs
      content,
      addedBy,
      addedAt: Timestamp.now(),
    };

    // Get current request to append note
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Request not found');
    }

    const currentData = docSnap.data() as StoredRequest;
    const currentNotes = currentData.internalNotes || [];

    const updateData: UpdateData<StoredRequest> = {
      internalNotes: [...currentNotes, newNote],
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, updateData);
    console.log('Internal note added:', requestId, content);
  } catch (error) {
    console.error('Error adding internal note:', error);
    throw new Error('Failed to add internal note');
  }
};

// Add an associated record to a request (from AI match acceptance)
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
  console.log('📎 [Request Service] Adding record to request:', requestId, candidateId);
  
  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    console.log('🔄 [Request Service] Using mock service for addRecordToRequest');
    await mockService.addRecordToRequest(requestId, candidateId, candidateData, acceptedBy);
    console.log('✅ [Request Service] Mock record added to request');
    return;
  }

  try {
    const docRef = doc(firestore, 'requests', requestId);
    
    // Create new associated record
    const newRecord: AssociatedRecord = {
      candidateId,
      ...candidateData,
      acceptedBy,
      acceptedAt: Timestamp.now(),
    };

    // Get current request to append record
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Request not found');
    }

    const currentData = docSnap.data() as StoredRequest;
    const currentRecords = currentData.associatedRecords || [];

    // Check if record already exists (prevent duplicates)
    const existingRecord = currentRecords.find(record => record.candidateId === candidateId);
    if (existingRecord) {
      console.log('⚠️ [Request Service] Record already associated with request:', candidateId);
      return;
    }

    const updateData: UpdateData<StoredRequest> = {
      associatedRecords: [...currentRecords, newRecord],
      updatedAt: Timestamp.now(),
      // Potentially update status when first record is added
      ...(currentRecords.length === 0 && { status: 'under_review' as RequestStatus })
    };

    await updateDoc(docRef, updateData);
    console.log('✅ [Request Service] Record added to request:', requestId, candidateId);
  } catch (error) {
    console.error('❌ [Request Service] Error adding record to request:', error);
    throw new Error('Failed to add record to request');
  }
};
