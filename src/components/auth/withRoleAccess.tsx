'use client';

import React from 'react';

import { usePermissions, UserRole, Permission } from '../../hooks/usePermissions';

interface WithRoleAccessProps {
  /**
   * Required roles to access the component
   */
  roles?: UserRole[];
  
  /**
   * Required permissions to access the component
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
   * Component to render when access is denied (optional)
   */
  fallback?: React.ComponentType<any>;
  
  /**
   * Whether to render nothing when access is denied (default: true)
   */
  hideOnDenied?: boolean;
}

/**
 * Higher-Order Component that wraps a component with role-based access control
 */
export function withRoleAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithRoleAccessProps
) {
  const {
    roles,
    permissions,
    requireAllRoles = false,
    requireAllPermissions = false,
    fallback: FallbackComponent,
    hideOnDenied = true,
  } = options;

  return function RoleAccessComponent(props: P) {
    const { 
      hasAnyRole, 
      hasRole,
      hasPermission, 
      hasAnyPermission, 
      hasAllPermissions 
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
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      
      if (hideOnDenied) {
        return null;
      }
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * HOC for admin-only components
 */
export function withAdminAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<P>
) {
  return withRoleAccess(WrappedComponent, {
    roles: ['admin'],
    fallback,
  });
}

/**
 * HOC for staff-level components (staff or admin)
 */
export function withStaffAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<P>
) {
  return withRoleAccess(WrappedComponent, {
    roles: ['admin', 'staff'],
    fallback,
  });
}

/**
 * HOC for legal reviewer components (legal_reviewer or admin)
 */
export function withLegalAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<P>
) {
  return withRoleAccess(WrappedComponent, {
    roles: ['admin', 'legal_reviewer'],
    fallback,
  });
}

/**
 * HOC for permission-based components
 */
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: Permission[],
  requireAll = false,
  fallback?: React.ComponentType<P>
) {
  return withRoleAccess(WrappedComponent, {
    permissions: requiredPermissions,
    requireAllPermissions: requireAll,
    fallback,
  });
}