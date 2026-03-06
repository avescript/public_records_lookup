'use client';

import { useMemo } from 'react';

import { useAgency } from '../contexts/AgencyContext';
import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'admin' | 'staff' | 'legal_reviewer';

// Enhanced permission system with granular permissions
export type Permission =
  // Request Management
  | 'request:view_all'
  | 'request:view_own'
  | 'request:create'
  | 'request:edit'
  | 'request:delete'
  | 'request:assign'
  | 'request:approve'
  | 'request:reject'

  // Record Management
  | 'record:view'
  | 'record:upload'
  | 'record:edit'
  | 'record:delete'
  | 'record:export'

  // Redaction
  | 'redaction:view'
  | 'redaction:create'
  | 'redaction:edit'
  | 'redaction:approve'
  | 'redaction:reject'

  // AI Matching
  | 'ai:match'
  | 'ai:accept'
  | 'ai:reject'
  | 'ai:override'

  // Legal Review
  | 'legal:review'
  | 'legal:approve'
  | 'legal:reject'
  | 'legal:comment'
  | 'legal:request_changes'

  // Package & Delivery
  | 'package:create'
  | 'package:view'
  | 'package:edit'
  | 'package:deliver'
  | 'package:export'

  // Agency Management
  | 'agency:switch'
  | 'agency:manage'
  | 'agency:configure'
  | 'agency:view_analytics'

  // User Management
  | 'user:view'
  | 'user:create'
  | 'user:edit'
  | 'user:delete'
  | 'user:manage_roles'

  // System Configuration
  | 'config:view'
  | 'config:edit'
  | 'config:manage_rules'

  // Audit & Reporting
  | 'audit:view'
  | 'audit:export'
  | 'analytics:view'
  | 'analytics:export';

/**
 * Permission matrix mapping roles to their allowed permissions
 * Enhanced for Epic 9: RBAC & Multi-Agency
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin has all permissions across all features
  admin: [
    // Request Management
    'request:view_all',
    'request:view_own',
    'request:create',
    'request:edit',
    'request:delete',
    'request:assign',
    'request:approve',
    'request:reject',

    // Record Management
    'record:view',
    'record:upload',
    'record:edit',
    'record:delete',
    'record:export',

    // Redaction
    'redaction:view',
    'redaction:create',
    'redaction:edit',
    'redaction:approve',
    'redaction:reject',

    // AI Matching
    'ai:match',
    'ai:accept',
    'ai:reject',
    'ai:override',

    // Legal Review
    'legal:review',
    'legal:approve',
    'legal:reject',
    'legal:comment',
    'legal:request_changes',

    // Package & Delivery
    'package:create',
    'package:view',
    'package:edit',
    'package:deliver',
    'package:export',

    // Agency Management
    'agency:switch',
    'agency:manage',
    'agency:configure',
    'agency:view_analytics',

    // User Management
    'user:view',
    'user:create',
    'user:edit',
    'user:delete',
    'user:manage_roles',

    // System Configuration
    'config:view',
    'config:edit',
    'config:manage_rules',

    // Audit & Reporting
    'audit:view',
    'audit:export',
    'analytics:view',
    'analytics:export',
  ],

  // Staff (Records Officer) - day-to-day processing
  staff: [
    // Request Management
    'request:view_all',
    'request:view_own',
    'request:create',
    'request:edit',
    'request:assign',

    // Record Management
    'record:view',
    'record:upload',
    'record:edit',
    'record:export',

    // Redaction
    'redaction:view',
    'redaction:create',
    'redaction:edit',

    // AI Matching
    'ai:match',
    'ai:accept',
    'ai:reject',

    // Legal Review (limited)
    'legal:comment',

    // Package & Delivery
    'package:create',
    'package:view',
    'package:edit',

    // Agency Management
    'agency:switch',
    'agency:view_analytics',

    // Audit & Reporting (limited)
    'analytics:view',
  ],

  // Legal Reviewer - focused on legal review and approval
  legal_reviewer: [
    // Request Management (view and approve)
    'request:view_all',
    'request:approve',
    'request:reject',

    // Record Management (view only)
    'record:view',
    'record:export',

    // Redaction (review and approve)
    'redaction:view',
    'redaction:approve',
    'redaction:reject',

    // Legal Review (full access)
    'legal:review',
    'legal:approve',
    'legal:reject',
    'legal:comment',
    'legal:request_changes',

    // Package & Delivery (view only)
    'package:view',

    // Agency Management (limited)
    'agency:switch',

    // Audit & Reporting
    'audit:view',
    'analytics:view',
  ],
};

/**
 * Feature flags based on role combinations
 * Makes it easier to conditionally render UI sections
 */
export interface FeatureFlags {
  canManageRequests: boolean;
  canManageRecords: boolean;
  canRedact: boolean;
  canApprove: boolean;
  canManageUsers: boolean;
  canConfigureSystem: boolean;
  canViewAnalytics: boolean;
  canSwitchAgency: boolean;
  canExportData: boolean;
  canUseAI: boolean;
  canPerformLegalReview: boolean;
  canManagePackages: boolean;
}

/**
 * Hook for checking user permissions based on role
 * Enhanced for Epic 9: RBAC & Multi-Agency
 *
 * @example
 * ```tsx
 * const { hasPermission, features, canAccessAgency } = usePermissions();
 *
 * // Check specific permission
 * if (hasPermission('request:delete')) {
 *   return <DeleteButton />;
 * }
 *
 * // Use feature flags
 * if (features.canManageUsers) {
 *   return <UserManagementPanel />;
 * }
 *
 * // Check agency access
 * if (canAccessAgency('police')) {
 *   return <PoliceData />;
 * }
 * ```
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  const { currentAgency } = useAgency();

  /**
   * Get all permissions for the current user's role
   */
  const getUserPermissions = useMemo((): Permission[] => {
    if (!user?.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user?.role]);

  /**
   * Check if the current user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return getUserPermissions.includes(permission);
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
   * Feature flags calculated from permissions
   * Memoized for performance
   */
  const features: FeatureFlags = useMemo(
    () => ({
      canManageRequests:
        hasPermission('request:edit') || hasPermission('request:delete'),
      canManageRecords:
        hasPermission('record:edit') || hasPermission('record:delete'),
      canRedact:
        hasPermission('redaction:create') || hasPermission('redaction:edit'),
      canApprove:
        hasPermission('request:approve') || hasPermission('redaction:approve'),
      canManageUsers: hasPermission('user:manage_roles'),
      canConfigureSystem: hasPermission('config:edit'),
      canViewAnalytics: hasPermission('analytics:view'),
      canSwitchAgency: hasPermission('agency:switch'),
      canExportData:
        hasPermission('record:export') || hasPermission('package:export'),
      canUseAI: hasPermission('ai:match'),
      canPerformLegalReview: hasPermission('legal:review'),
      canManagePackages:
        hasPermission('package:create') || hasPermission('package:edit'),
    }),
    [getUserPermissions]
  ); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Check if user can access a specific agency
   * In multi-agency systems, admins can access all agencies,
   * while staff are typically restricted to their assigned agency
   */
  const canAccessAgency = (agencyId: string): boolean => {
    if (!isAuthenticated || !user) return false;

    // Admins can access all agencies
    if (user.role === 'admin') return true;

    // For staff and legal reviewers, check if it's their current agency
    // In a production system, this would check against user's assigned agencies
    return currentAgency?.id === agencyId;
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getUserPermissions,
    features,
    isAdmin: hasRole('admin'),
    isStaff: hasRole('staff'),
    isLegalReviewer: hasRole('legal_reviewer'),
    isAuthenticated,
    currentAgencyId: currentAgency?.id || null,
    canAccessAgency,
  };
}

/**
 * Role-based feature flags
 * Enhanced for Epic 9: RBAC & Multi-Agency
 */
export const FEATURES = {
  // Admin-only features
  USER_MANAGEMENT: ['admin'] as UserRole[],
  SYSTEM_SETTINGS: ['admin'] as UserRole[],
  AGENCY_MANAGEMENT: ['admin'] as UserRole[],
  SYSTEM_CONFIG: ['admin'] as UserRole[],
  AUDIT_LOGS: ['admin'] as UserRole[],

  // Legal reviewer features
  LEGAL_REVIEW: ['admin', 'legal_reviewer'] as UserRole[],
  FINAL_APPROVAL: ['admin', 'legal_reviewer'] as UserRole[],
  REDACTION_APPROVAL: ['admin', 'legal_reviewer'] as UserRole[],

  // Staff features
  DOCUMENT_PROCESSING: ['admin', 'staff'] as UserRole[],
  REDACTION_TOOLS: ['admin', 'staff'] as UserRole[],
  AI_MATCHING: ['admin', 'staff'] as UserRole[],
  REQUEST_CREATION: ['admin', 'staff'] as UserRole[],

  // Shared features
  REPORTING: ['admin', 'legal_reviewer', 'staff'] as UserRole[],
  REQUEST_VIEWING: ['admin', 'staff', 'legal_reviewer'] as UserRole[],
  ANALYTICS: ['admin', 'staff', 'legal_reviewer'] as UserRole[],
  AGENCY_SWITCHING: ['admin', 'staff', 'legal_reviewer'] as UserRole[],
  PACKAGE_VIEWING: ['admin', 'staff', 'legal_reviewer'] as UserRole[],
  EXPORT_DATA: ['admin', 'staff', 'legal_reviewer'] as UserRole[],
} as const;

/**
 * Check if a feature is available for a specific role
 *
 * @example
 * ```tsx
 * if (isFeatureAvailable('USER_MANAGEMENT', user?.role)) {
 *   return <UserManagementLink />;
 * }
 * ```
 */
export function isFeatureAvailable(
  feature: keyof typeof FEATURES,
  role?: UserRole
): boolean {
  if (!role) return false;
  return FEATURES[feature].includes(role);
}

/**
 * Helper to get all permissions for a specific role
 * Useful for testing and documentation
 *
 * @example
 * ```tsx
 * const adminPermissions = getPermissionsForRole('admin');
 * console.log(adminPermissions); // ['request:view_all', 'request:create', ...]
 * ```
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Helper to check if a role has a specific permission
 * Useful for server-side or non-hook contexts
 *
 * @example
 * ```tsx
 * if (roleHasPermission('staff', 'request:delete')) {
 *   // This would be false
 * }
 * ```
 */
export function roleHasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}
