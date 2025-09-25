/**
 * Package Builder Service
 * Handles creation and management of document packages for delivery
 * Epic 6: Package & Delivery (Mock Sends)
 * US-060: Build combined package with cover sheet & index
 */

import { Timestamp } from 'firebase/firestore';
import * as mockService from './mockFirebaseService';

// Check if we should use mock service
const useMockService = () => {
  const shouldUseMock = process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === 'true' || 
         (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  return shouldUseMock;
};

// Package record interface
export interface PackageRecord {
  recordId: string;
  title: string;
  source: string;
  pageCount: number;
  order: number; // Display order in package
  includeInPackage: boolean;
}

// Package manifest interface
export interface PackageManifest {
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
  records: PackageRecord[];
  metadata: {
    createdBy: string;
    createdAt: Timestamp;
    status: 'draft' | 'building' | 'ready' | 'sent';
    totalPages: number;
    estimatedDeliverySize: string;
  };
  auditTrail: {
    packageBuilt?: {
      timestamp: Timestamp;
      byUser: string;
    };
    packageApproved?: {
      timestamp: Timestamp;
      byUser: string;
    };
    packageSent?: {
      timestamp: Timestamp;
      byUser: string;
      method: 'email' | 'portal';
    };
  };
}

// Package builder result
export interface PackageBuildResult {
  manifest: PackageManifest;
  previewUrl?: string; // Mock PDF preview URL
  downloadUrl?: string; // Mock combined PDF download URL
}

// Create a new package manifest
export const createPackageManifest = async (
  requestId: string,
  associatedRecords: any[],
  packageTitle: string,
  requestorInfo: {
    name: string;
    department: string;
    requestDate: string;
  },
  createdBy: string = 'Staff User'
): Promise<PackageManifest> => {
  console.log('📦 [Package Service] Creating package manifest for request:', requestId);

  // Convert associated records to package records
  const packageRecords: PackageRecord[] = associatedRecords.map((record, index) => ({
    recordId: record.candidateId,
    title: record.title,
    source: record.source,
    pageCount: record.metadata?.pageCount || 1,
    order: index + 1,
    includeInPackage: true,
  }));

  const totalPages = packageRecords.reduce((sum, record) => sum + record.pageCount, 0) + 1; // +1 for cover sheet
  const estimatedSize = `${(totalPages * 0.5).toFixed(1)} MB`; // Rough estimate

  const manifest: PackageManifest = {
    id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    requestId,
    title: packageTitle,
    coverSheet: {
      title: packageTitle,
      requestorName: requestorInfo.name,
      requestDate: requestorInfo.requestDate,
      department: requestorInfo.department,
      totalPages,
      totalRecords: packageRecords.length,
    },
    records: packageRecords,
    metadata: {
      createdBy,
      createdAt: Timestamp.now(),
      status: 'draft',
      totalPages,
      estimatedDeliverySize: estimatedSize,
    },
    auditTrail: {
      packageBuilt: {
        timestamp: Timestamp.now(),
        byUser: createdBy,
      },
    },
  };

  console.log('✅ [Package Service] Package manifest created:', manifest.id);
  return manifest;
};

// Update package record order
export const updatePackageRecordOrder = (
  manifest: PackageManifest,
  recordId: string,
  newOrder: number
): PackageManifest => {
  const updatedRecords = manifest.records.map(record => {
    if (record.recordId === recordId) {
      return { ...record, order: newOrder };
    }
    return record;
  });

  // Re-sort by order
  updatedRecords.sort((a, b) => a.order - b.order);

  return {
    ...manifest,
    records: updatedRecords,
  };
};

// Toggle record inclusion in package
export const toggleRecordInclusion = (
  manifest: PackageManifest,
  recordId: string
): PackageManifest => {
  const updatedRecords = manifest.records.map(record => {
    if (record.recordId === recordId) {
      return { ...record, includeInPackage: !record.includeInPackage };
    }
    return record;
  });

  // Recalculate totals
  const includedRecords = updatedRecords.filter(r => r.includeInPackage);
  const totalPages = includedRecords.reduce((sum, record) => sum + record.pageCount, 0) + 1;
  const estimatedSize = `${(totalPages * 0.5).toFixed(1)} MB`;

  return {
    ...manifest,
    records: updatedRecords,
    coverSheet: {
      ...manifest.coverSheet,
      totalPages,
      totalRecords: includedRecords.length,
    },
    metadata: {
      ...manifest.metadata,
      totalPages,
      estimatedDeliverySize: estimatedSize,
    },
  };
};

// Build package (mock implementation)
export const buildPackage = async (
  manifest: PackageManifest
): Promise<PackageBuildResult> => {
  console.log('🏗️ [Package Service] Building package:', manifest.id);

  // Use mock service if Firebase is unavailable
  if (useMockService()) {
    console.log('🔄 [Package Service] Using mock service for buildPackage');
    return await mockService.buildPackage(manifest);
  }

  try {
    // In production, this would call the server-side PDF generation service
    console.log('🔥 [Package Service] Attempting real package build (not implemented)');
    
    // For now, return mock result
    const result: PackageBuildResult = {
      manifest: {
        ...manifest,
        metadata: {
          ...manifest.metadata,
          status: 'ready',
        },
      },
      previewUrl: `/api/packages/${manifest.id}/preview.pdf`,
      downloadUrl: `/api/packages/${manifest.id}/download.pdf`,
    };

    console.log('✅ [Package Service] Package built successfully:', manifest.id);
    return result;
  } catch (error) {
    console.error('❌ [Package Service] Error building package:', error);
    throw new Error('Failed to build package');
  }
};

// Get package by ID
export const getPackageById = async (packageId: string): Promise<PackageManifest | null> => {
  console.log('🔍 [Package Service] Getting package by ID:', packageId);

  if (useMockService()) {
    console.log('🔄 [Package Service] Using mock service for getPackageById');
    return await mockService.getPackageById(packageId);
  }

  try {
    // In production, this would fetch from Firestore
    console.log('🔥 [Package Service] Attempting Firebase getPackageById (not implemented)');
    return null;
  } catch (error) {
    console.error('❌ [Package Service] Error getting package:', error);
    throw new Error('Failed to get package');
  }
};

// List packages for a request
export const getPackagesForRequest = async (requestId: string): Promise<PackageManifest[]> => {
  console.log('🔍 [Package Service] Getting packages for request:', requestId);

  if (useMockService()) {
    console.log('🔄 [Package Service] Using mock service for getPackagesForRequest');
    return await mockService.getPackagesForRequest(requestId);
  }

  try {
    // In production, this would query Firestore
    console.log('🔥 [Package Service] Attempting Firebase getPackagesForRequest (not implemented)');
    return [];
  } catch (error) {
    console.error('❌ [Package Service] Error getting packages for request:', error);
    throw new Error('Failed to get packages for request');
  }
};