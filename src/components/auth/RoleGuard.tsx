'use client';

import React from 'react';

import { Alert, Box, Typography } from '@/components/migration';

import {
  Permission,
  usePermissions,
  UserRole,
} from '../../hooks/usePermissions';

interface RoleGuardProps {
  /**
   * Required roles to access the content
   */
  roles?: UserRole[];

  /**
   * Required permissions to access the content
   */
  permissions?: Permission[];

  /**
   * Require ALL roles (default: false - requires ANY role)
   */
  requireAllRoles?: boolean;

  /**
   * Require ALL permissions (default: false - requires ANY permission)
   */
  requireAllPermissions?: boolean;

  /**
   * Content to show when access is granted
   */
  children: React.ReactNode;

  /**
   * Content to show when access is denied (optional)
   */
  fallback?: React.ReactNode;

  /**
   * Whether to show a default "Access Denied" message when access is denied and no fallback provided
   */
  showAccessDenied?: boolean;

  /**
   * Custom access denied message
   */
  accessDeniedMessage?: string;
}

/**
 * Component that conditionally renders content based on user roles and permissions
 */
export function RoleGuard({
  roles,
  permissions,
  requireAllRoles = false,
  requireAllPermissions = false,
  children,
  fallback,
  showAccessDenied = false,
  accessDeniedMessage = "You don't have permission to access this feature.",
}: RoleGuardProps) {
  const {
    hasAnyRole,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    user,
  } = usePermissions();

  // Check role access
  let hasRoleAccess = true;
  if (roles && roles.length > 0) {
    if (requireAllRoles) {
      hasRoleAccess = roles.every(role => hasRole(role));
    } else {
      hasRoleAccess = hasAnyRole(roles);
    }
  }

  // Check permission access
  let hasPermissionAccess = true;
  if (permissions && permissions.length > 0) {
    if (requireAllPermissions) {
      hasPermissionAccess = hasAllPermissions(permissions);
    } else {
      hasPermissionAccess = hasAnyPermission(permissions);
    }
  }

  // Grant access only if both role and permission checks pass
  const hasAccess = hasRoleAccess && hasPermissionAccess;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <Alert severity='warning' sx={{ my: 2 }}>
          <Typography variant='body2'>{accessDeniedMessage}</Typography>
          {user && (
            <Typography variant='caption' color='text.secondary'>
              Current role: {user.role}
            </Typography>
          )}
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

/**
 * Simplified role guard that only checks for specific roles
 */
export function AdminOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <RoleGuard
      roles={['admin']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      accessDeniedMessage='This feature is only available to administrators.'
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Guard for staff-level access (staff or admin)
 */
export function StaffOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <RoleGuard
      roles={['admin', 'staff']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      accessDeniedMessage='This feature is only available to staff members.'
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Guard for legal reviewer access (legal_reviewer or admin)
 */
export function LegalOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <RoleGuard
      roles={['admin', 'legal_reviewer']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      accessDeniedMessage='This feature is only available to legal reviewers.'
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Guard for features requiring approval permissions
 */
export function ApprovalRequired({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <RoleGuard
      permissions={['approve_request', 'reject_request']}
      requireAllPermissions={true}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      accessDeniedMessage="You don't have permission to approve or reject requests."
    >
      {children}
    </RoleGuard>
  );
}
