// Hooks
export { usePermissions, type UserRole, type Permission, FEATURES, isFeatureAvailable } from '../../hooks/usePermissions';

// Components
export { 
  RoleGuard, 
  AdminOnly, 
  StaffOnly, 
  LegalOnly, 
  ApprovalRequired 
} from './RoleGuard';

export { 
  withRoleAccess,
  withAdminAccess,
  withStaffAccess, 
  withLegalAccess,
  withPermissions
} from './withRoleAccess';

export {
  PermissionButton,
  PermissionIconButton,
  PermissionMenuItem,
  RoleChip,
  AdminButton,
  StaffButton,
  LegalButton,
  ApprovalButton,
  RejectButton
} from './PermissionComponents';

// Re-export existing auth components
export { ProtectedRoute } from './ProtectedRoute';