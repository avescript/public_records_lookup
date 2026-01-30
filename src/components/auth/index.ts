// Hooks
export {
  FEATURES,
  isFeatureAvailable,
  type Permission,
  usePermissions,
  type UserRole,
} from '../../hooks/usePermissions';

// Components
export {
  AdminButton,
  ApprovalButton,
  LegalButton,
  PermissionButton,
  PermissionIconButton,
  PermissionMenuItem,
  RejectButton,
  RoleChip,
  StaffButton,
} from './PermissionComponents';
export {
  AdminOnly,
  ApprovalRequired,
  LegalOnly,
  RoleGuard,
  StaffOnly,
} from './RoleGuard';
export {
  withAdminAccess,
  withLegalAccess,
  withPermissions,
  withRoleAccess,
  withStaffAccess,
} from './withRoleAccess';

// Re-export existing auth components
export { ProtectedRoute } from './ProtectedRoute';
