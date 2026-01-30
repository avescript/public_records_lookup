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
  accessDeniedMessage = 'You don\'t have permission for this action.',
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
    <PermissionButton requiredPermissions={['approve_request']} {...props} />
  );
}

export function RejectButton(
  props: Omit<PermissionButtonProps, 'requiredPermissions'>
) {
  return (
    <PermissionButton requiredPermissions={['reject_request']} {...props} />
  );
}
