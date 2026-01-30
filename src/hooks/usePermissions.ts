'use client';

import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'admin' | 'staff' | 'legal_reviewer';
export type Permission =
  | 'view_all_requests'
  | 'view_own_requests'
  | 'create_request'
  | 'edit_request'
  | 'delete_request'
  | 'approve_request'
  | 'reject_request'
  | 'redact_documents'
  | 'review_redactions'
  | 'generate_reports'
  | 'manage_users'
  | 'manage_agencies'
  | 'export_data'
  | 'audit_logs'
  | 'system_settings'
  | 'legal_review'
  | 'final_approval';

/**
 * Permission matrix mapping roles to their allowed permissions
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_all_requests',
    'create_request',
    'edit_request',
    'delete_request',
    'approve_request',
    'reject_request',
    'redact_documents',
    'review_redactions',
    'generate_reports',
    'manage_users',
    'manage_agencies',
    'export_data',
    'audit_logs',
    'system_settings',
    'legal_review',
    'final_approval',
  ],
  staff: [
    'view_own_requests',
    'create_request',
    'edit_request',
    'redact_documents',
    'export_data',
  ],
  legal_reviewer: [
    'view_all_requests',
    'legal_review',
    'review_redactions',
    'approve_request',
    'reject_request',
    'final_approval',
    'generate_reports',
  ],
};

/**
 * Hook for checking user permissions based on role
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if the current user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role].includes(permission);
  };

  /**
   * Check if the current user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if the current user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if the current user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * Check if the current user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  };

  /**
   * Get all permissions for the current user's role
   */
  const getUserPermissions = (): Permission[] => {
    if (!user?.role) return [];
    return ROLE_PERMISSIONS[user.role];
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getUserPermissions,
    isAdmin: hasRole('admin'),
    isStaff: hasRole('staff'),
    isLegalReviewer: hasRole('legal_reviewer'),
  };
}

/**
 * Role-based feature flags
 */
export const FEATURES = {
  // Admin-only features
  USER_MANAGEMENT: ['admin'] as UserRole[],
  SYSTEM_SETTINGS: ['admin'] as UserRole[],
  AUDIT_LOGS: ['admin'] as UserRole[],
  AGENCY_MANAGEMENT: ['admin'] as UserRole[],

  // Legal reviewer features
  LEGAL_REVIEW: ['admin', 'legal_reviewer'] as UserRole[],
  FINAL_APPROVAL: ['admin', 'legal_reviewer'] as UserRole[],

  // Staff features
  DOCUMENT_PROCESSING: ['admin', 'staff'] as UserRole[],
  REDACTION_TOOLS: ['admin', 'staff'] as UserRole[],

  // Shared features
  REPORTING: ['admin', 'legal_reviewer'] as UserRole[],
  REQUEST_VIEWING: ['admin', 'staff', 'legal_reviewer'] as UserRole[],
} as const;

/**
 * Check if a feature is available for a specific role
 */
export function isFeatureAvailable(
  feature: keyof typeof FEATURES,
  role?: UserRole
): boolean {
  if (!role) return false;
  return FEATURES[feature].includes(role);
}
