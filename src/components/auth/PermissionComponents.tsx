'use client';

import React from 'react';
import {
  AdminPanelSettings as AdminIcon,
  Gavel as LegalIcon,
  Security as SecurityIcon,
  Work as StaffIcon,
} from '@mui/icons-material';
import {
  Alert,
  Button,
  ButtonProps,
  Chip,
  ChipProps,
  IconButton,
  IconButtonProps,
  MenuItem,
  MenuItemProps,
  Typography,
} from '@mui/material';

import {
  Permission,
  usePermissions,
  UserRole,
} from '../../hooks/usePermissions';

// Permission-aware Button component
interface PermissionButtonProps extends ButtonProps {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
  showAccessDenied?: boolean;
  accessDeniedMessage?: string;
}

export function PermissionButton({
  requiredRoles,
  requiredPermissions,
  requireAllRoles = false,
  requireAllPermissions = false,
  showAccessDenied = false,
  accessDeniedMessage = "You don't have permission for this action.",
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const { hasAnyRole, hasRole, hasAnyPermission, hasAllPermissions, user } =
    usePermissions();

  // Check role access
  let hasRoleAccess = true;
  if (requiredRoles && requiredRoles.length > 0) {
    if (requireAllRoles) {
      hasRoleAccess = requiredRoles.every(role => hasRole(role));
    } else {
      hasRoleAccess = hasAnyRole(requiredRoles);
    }
  }

  // Check permission access
  let hasPermissionAccess = true;
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAllPermissions) {
      hasPermissionAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasPermissionAccess = hasAnyPermission(requiredPermissions);
    }
  }

  const hasAccess = hasRoleAccess && hasPermissionAccess;

  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <Alert severity='warning' sx={{ my: 1, maxWidth: 'fit-content' }}>
          <Typography variant='body2'>{accessDeniedMessage}</Typography>
        </Alert>
      );
    }
    return null;
  }

  return <Button {...buttonProps}>{children}</Button>;
}

// Permission-aware IconButton component
interface PermissionIconButtonProps extends IconButtonProps {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
}

export function PermissionIconButton({
  requiredRoles,
  requiredPermissions,
  requireAllRoles = false,
  requireAllPermissions = false,
  children,
  ...buttonProps
}: PermissionIconButtonProps) {
  const { hasAnyRole, hasRole, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  // Check role access
  let hasRoleAccess = true;
  if (requiredRoles && requiredRoles.length > 0) {
    if (requireAllRoles) {
      hasRoleAccess = requiredRoles.every(role => hasRole(role));
    } else {
      hasRoleAccess = hasAnyRole(requiredRoles);
    }
  }

  // Check permission access
  let hasPermissionAccess = true;
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAllPermissions) {
      hasPermissionAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasPermissionAccess = hasAnyPermission(requiredPermissions);
    }
  }

  const hasAccess = hasRoleAccess && hasPermissionAccess;

  if (!hasAccess) {
    return null;
  }

  return <IconButton {...buttonProps}>{children}</IconButton>;
}

// Permission-aware MenuItem component
interface PermissionMenuItemProps extends MenuItemProps {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
}

export function PermissionMenuItem({
  requiredRoles,
  requiredPermissions,
  requireAllRoles = false,
  requireAllPermissions = false,
  children,
  ...menuItemProps
}: PermissionMenuItemProps) {
  const { hasAnyRole, hasRole, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  // Check role access
  let hasRoleAccess = true;
  if (requiredRoles && requiredRoles.length > 0) {
    if (requireAllRoles) {
      hasRoleAccess = requiredRoles.every(role => hasRole(role));
    } else {
      hasRoleAccess = hasAnyRole(requiredRoles);
    }
  }

  // Check permission access
  let hasPermissionAccess = true;
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAllPermissions) {
      hasPermissionAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasPermissionAccess = hasAnyPermission(requiredPermissions);
    }
  }

  const hasAccess = hasRoleAccess && hasPermissionAccess;

  if (!hasAccess) {
    return null;
  }

  return <MenuItem {...menuItemProps}>{children}</MenuItem>;
}

// Role indicator chip
interface RoleChipProps extends Omit<ChipProps, 'label'> {
  role?: UserRole;
  showIcon?: boolean;
}

export function RoleChip({
  role,
  showIcon = true,
  ...chipProps
}: RoleChipProps) {
  const { user } = usePermissions();
  const currentRole = role || user?.role;

  if (!currentRole) return null;

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          color: 'error' as const,
          icon: showIcon ? <AdminIcon /> : undefined,
        };
      case 'staff':
        return {
          label: 'Staff',
          color: 'primary' as const,
          icon: showIcon ? <StaffIcon /> : undefined,
        };
      case 'legal_reviewer':
        return {
          label: 'Legal Reviewer',
          color: 'warning' as const,
          icon: showIcon ? <LegalIcon /> : undefined,
        };
      default:
        return {
          label: 'User',
          color: 'default' as const,
          icon: showIcon ? <SecurityIcon /> : undefined,
        };
    }
  };

  const config = getRoleConfig(currentRole);

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size='small'
      {...chipProps}
    />
  );
}

// Quick access role components
export function AdminButton(
  props: Omit<PermissionButtonProps, 'requiredRoles'>
) {
  return <PermissionButton requiredRoles={['admin']} {...props} />;
}

export function StaffButton(
  props: Omit<PermissionButtonProps, 'requiredRoles'>
) {
  return <PermissionButton requiredRoles={['admin', 'staff']} {...props} />;
}

export function LegalButton(
  props: Omit<PermissionButtonProps, 'requiredRoles'>
) {
  return (
    <PermissionButton requiredRoles={['admin', 'legal_reviewer']} {...props} />
  );
}

export function ApprovalButton(
  props: Omit<PermissionButtonProps, 'requiredPermissions'>
) {
  return (
    <PermissionButton requiredPermissions={['request:approve']} {...props} />
  );
}

export function RejectButton(
  props: Omit<PermissionButtonProps, 'requiredPermissions'>
) {
  return (
    <PermissionButton requiredPermissions={['request:reject']} {...props} />
  );
}

// ==========================================
// Generic Permission Wrapper Components
// Added for US-091: Role-Based UI & Permissions
// ==========================================

/**
 * Props for permission-protected components
 */
interface PermissionWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAlert?: boolean;
}

/**
 * Props for RequiresPermission component
 */
interface RequiresPermissionProps extends PermissionWrapperProps {
  permission: Permission | Permission[];
  requireAll?: boolean; // If true, requires all permissions. If false, requires any.
}

/**
 * RequiresPermission Component
 * Renders children only if user has the required permission(s)
 *
 * @example
 * ```tsx
 * <RequiresPermission permission="request:delete">
 *   <DeleteButton />
 * </RequiresPermission>
 *
 * // Multiple permissions with requireAll
 * <RequiresPermission
 *   permission={['request:edit', 'request:delete']}
 *   requireAll={true}
 *   fallback={<div>Insufficient permissions</div>}
 * >
 *   <AdminPanel />
 * </RequiresPermission>
 * ```
 */
export function RequiresPermission({
  children,
  permission,
  requireAll = false,
  fallback = null,
  showAlert = false,
}: RequiresPermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  // Handle single permission
  if (typeof permission === 'string') {
    if (!hasPermission(permission)) {
      return showAlert ? (
        <Alert severity='warning'>
          You don&apos;t have permission to access this feature.
        </Alert>
      ) : (
        <>{fallback}</>
      );
    }
    return <>{children}</>;
  }

  // Handle multiple permissions
  const hasAccess = requireAll
    ? hasAllPermissions(permission)
    : hasAnyPermission(permission);

  if (!hasAccess) {
    return showAlert ? (
      <Alert severity='warning'>
        You don&apos;t have permission to access this feature.
      </Alert>
    ) : (
      <>{fallback}</>
    );
  }

  return <>{children}</>;
}

/**
 * Props for RequiresRole component
 */
interface RequiresRoleProps extends PermissionWrapperProps {
  role: UserRole | UserRole[];
}

/**
 * RequiresRole Component
 * Renders children only if user has the required role(s)
 *
 * @example
 * ```tsx
 * <RequiresRole role="admin">
 *   <AdminDashboard />
 * </RequiresRole>
 *
 * //Multiple roles
 * <RequiresRole
 *   role={['admin', 'legal_reviewer']}
 *   fallback={<AccessDenied />}
 * >
 *   <LegalReviewPanel />
 * </RequiresRole>
 * ```
 */
export function RequiresRole({
  children,
  role,
  fallback = null,
  showAlert = false,
}: RequiresRoleProps) {
  const { hasRole, hasAnyRole } = usePermissions();

  // Handle single role
  if (typeof role === 'string') {
    if (!hasRole(role)) {
      return showAlert ? (
        <Alert severity='warning'>
          This feature is only available to {role} users.
        </Alert>
      ) : (
        <>{fallback}</>
      );
    }
    return <>{children}</>;
  }

  // Handle multiple roles
  if (!hasAnyRole(role)) {
    return showAlert ? (
      <Alert severity='warning'>
        This feature is only available to {role.join(', ')} users.
      </Alert>
    ) : (
      <>{fallback}</>
    );
  }

  return <>{children}</>;
}

/**
 * Props for RequiresFeature component
 */
interface RequiresFeatureProps extends PermissionWrapperProps {
  feature: string;
}

/**
 * RequiresFeature Component
 * Renders children only if user has access to the feature based on their role
 * Uses feature flags defined in usePermissions
 *
 * @example
 * ```tsx
 * <RequiresFeature feature="canManageUsers">
 *   <UserManagementPanel />
 * </RequiresFeature>
 * ```
 */
export function RequiresFeature({
  children,
  feature,
  fallback = null,
  showAlert = false,
}: RequiresFeatureProps) {
  const { features } = usePermissions();

  const hasFeature = features[feature as keyof typeof features];

  if (!hasFeature) {
    return showAlert ? (
      <Alert severity='warning'>
        You don&apos;t have access to this feature.
      </Alert>
    ) : (
      <>{fallback}</>
    );
  }

  return <>{children}</>;
}

/**
 * RequiresAuthentication Component
 * Renders children only if user is authenticated
 *
 * @example
 * ```tsx
 * <RequiresAuthentication fallback={<LoginPrompt />}>
 *   <Dashboard />
 * </RequiresAuthentication>
 * ```
 */
export function RequiresAuthentication({
  children,
  fallback = null,
  showAlert = false,
}: PermissionWrapperProps) {
  const { isAuthenticated } = usePermissions();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert severity='info'>Please log in to access this feature.</Alert>
    ) : (
      <>{fallback}</>
    );
  }

  return <>{children}</>;
}

/**
 * Props for RequiresAgencyAccess component
 */
interface RequiresAgencyAccessProps extends PermissionWrapperProps {
  agencyId: string;
}

/**
 * RequiresAgencyAccess Component
 * Renders children only if user can access the specified agency
 *
 * @example
 * ```tsx
 * <RequiresAgencyAccess agencyId="police">
 *   <PoliceRecords />
 * </RequiresAgencyAccess>
 * ```
 */
export function RequiresAgencyAccess({
  children,
  agencyId,
  fallback = null,
  showAlert = false,
}: RequiresAgencyAccessProps) {
  const { canAccessAgency } = usePermissions();

  if (!canAccessAgency(agencyId)) {
    return showAlert ? (
      <Alert severity='warning'>
        You don&apos;t have access to this agency&apos;s data.
      </Alert>
    ) : (
      <>{fallback}</>
    );
  }

  return <>{children}</>;
}
