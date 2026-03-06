/**
 * Role-Based Navigation
 * US-091: Role-Based UI & Permissions
 *
 * Utilities and components for creating permission-aware navigation
 */

import { ReactNode } from 'react';
import {
  BarChart,
  Dashboard,
  Description,
  Folder,
  Gavel,
  Inbox,
  LocalShipping,
  People,
  Receipt,
  Search,
  Settings,
} from '@mui/icons-material';

import { Permission, UserRole } from '../../hooks/usePermissions';

/**
 * Navigation item configuration
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAllPermissions?: boolean;
  requireAllRoles?: boolean;
  children?: NavigationItem[];
  badge?: string | number;
  disabled?: boolean;
}

/**
 * Default navigation structure for the application
 * Organized by section with permission requirements
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Dashboard - accessible to all authenticated users
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <Dashboard />,
    requiredPermissions: [],
  },

  // Request Management - accessible to staff and admin
  {
    id: 'requests',
    label: 'Requests',
    path: '/admin/requests',
    icon: <Inbox />,
    requiredPermissions: ['request:view_all'],
    children: [
      {
        id: 'requests-all',
        label: 'All Requests',
        path: '/admin/requests',
        requiredPermissions: ['request:view_all'],
      },
      {
        id: 'requests-create',
        label: 'Create Request',
        path: '/admin/requests/new',
        requiredPermissions: ['request:create'],
      },
      {
        id: 'requests-assigned',
        label: 'Assigned to Me',
        path: '/admin/requests/assigned',
        requiredPermissions: ['request:view_own'],
      },
    ],
  },

  // Search & AI Matching - staff and admin
  {
    id: 'search',
    label: 'Search',
    path: '/admin/search',
    icon: <Search />,
    requiredPermissions: ['ai:match'],
  },

  // Redaction - staff and admin
  {
    id: 'redaction',
    label: 'Redaction',
    path: '/admin/redaction',
    icon: <Description />,
    requiredPermissions: ['redaction:view'],
    children: [
      {
        id: 'redaction-pending',
        label: 'Pending Review',
        path: '/admin/redaction/pending',
        requiredPermissions: ['redaction:view'],
      },
      {
        id: 'redaction-create',
        label: 'Create Redaction',
        path: '/admin/redaction/new',
        requiredPermissions: ['redaction:create'],
      },
    ],
  },

  // Legal Review - legal reviewers and admin
  {
    id: 'legal',
    label: 'Legal Review',
    path: '/admin/legal',
    icon: <Gavel />,
    requiredPermissions: ['legal:review'],
    children: [
      {
        id: 'legal-pending',
        label: 'Pending Review',
        path: '/admin/legal/pending',
        requiredPermissions: ['legal:review'],
      },
      {
        id: 'legal-approved',
        label: 'Approved',
        path: '/admin/legal/approved',
        requiredPermissions: ['legal:review'],
      },
      {
        id: 'legal-comments',
        label: 'Comments & Threads',
        path: '/admin/legal/comments',
        requiredPermissions: ['legal:comment'],
      },
    ],
  },

  // Packages - all authenticated users can view
  {
    id: 'packages',
    label: 'Packages',
    path: '/admin/packages',
    icon: <Folder />,
    requiredPermissions: ['package:view'],
    children: [
      {
        id: 'packages-all',
        label: 'All Packages',
        path: '/admin/packages',
        requiredPermissions: ['package:view'],
      },
      {
        id: 'packages-create',
        label: 'Create Package',
        path: '/admin/packages/new',
        requiredPermissions: ['package:create'],
      },
      {
        id: 'packages-pending',
        label: 'Pending Delivery',
        path: '/admin/packages/pending',
        requiredPermissions: ['package:view'],
      },
    ],
  },

  // Delivery - staff and admin
  {
    id: 'delivery',
    label: 'Delivery',
    path: '/admin/delivery',
    icon: <LocalShipping />,
    requiredPermissions: ['package:deliver'],
  },

  // Analytics - all authenticated users
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/admin/analytics',
    icon: <BarChart />,
    requiredPermissions: ['analytics:view'],
    children: [
      {
        id: 'analytics-overview',
        label: 'Overview',
        path: '/admin/analytics',
        requiredPermissions: ['analytics:view'],
      },
      {
        id: 'analytics-agency',
        label: 'Agency Performance',
        path: '/admin/analytics/agency',
        requiredPermissions: ['agency:view_analytics'],
      },
      {
        id: 'analytics-reports',
        label: 'Reports',
        path: '/admin/analytics/reports',
        requiredPermissions: ['analytics:export'],
      },
    ],
  },

  // Audit Logs - admin and legal reviewer
  {
    id: 'audit',
    label: 'Audit Logs',
    path: '/admin/audit',
    icon: <Receipt />,
    requiredPermissions: ['audit:view'],
  },

  // User Management - admin only
  {
    id: 'users',
    label: 'Users',
    path: '/admin/users',
    icon: <People />,
    requiredPermissions: ['user:view'],
    children: [
      {
        id: 'users-all',
        label: 'All Users',
        path: '/admin/users',
        requiredPermissions: ['user:view'],
      },
      {
        id: 'users-create',
        label: 'Add User',
        path: '/admin/users/new',
        requiredPermissions: ['user:create'],
      },
      {
        id: 'users-roles',
        label: 'Manage Roles',
        path: '/admin/users/roles',
        requiredPermissions: ['user:manage_roles'],
      },
    ],
  },

  // System Settings - admin only
  {
    id: 'settings',
    label: 'Settings',
    path: '/admin/settings',
    icon: <Settings />,
    requiredPermissions: ['config:view'],
    children: [
      {
        id: 'settings-system',
        label: 'System Configuration',
        path: '/admin/settings/system',
        requiredPermissions: ['config:edit'],
      },
      {
        id: 'settings-agencies',
        label: 'Agency Management',
        path: '/admin/settings/agencies',
        requiredPermissions: ['agency:manage'],
      },
      {
        id: 'settings-rules',
        label: 'Redaction Rules',
        path: '/admin/settings/rules',
        requiredPermissions: ['config:manage_rules'],
      },
    ],
  },
];

/**
 * Filter navigation items based on user permissions
 *
 * @param items - Navigation items to filter
 * @param hasPermission - Function to check if user has a permission
 * @param hasAnyPermission - Function to check if user has any of the permissions
 * @param hasAllPermissions - Function to check if user has all permissions
 * @param hasRole - Function to check if user has a role
 * @param hasAnyRole - Function to check if user has any of the roles
 * @returns Filtered navigation items that user has access to
 *
 * @example
 * ```tsx
 * const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = usePermissions();
 * const filteredNav = filterNavigationByPermissions(
 *   NAVIGATION_ITEMS,
 *   hasPermission,
 *   hasAnyPermission,
 *   hasAllPermissions,
 *   hasRole,
 *   hasAnyRole
 * );
 * ```
 */
export function filterNavigationByPermissions(
  items: NavigationItem[],
  hasPermission: (permission: Permission) => boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean,
  hasAllPermissions: (permissions: Permission[]) => boolean,
  hasRole: (role: UserRole) => boolean,
  hasAnyRole: (roles: UserRole[]) => boolean
): NavigationItem[] {
  return items
    .filter(item => {
      // Check permission requirements
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        if (item.requireAllPermissions) {
          if (!hasAllPermissions(item.requiredPermissions)) {
            return false;
          }
        } else {
          if (!hasAnyPermission(item.requiredPermissions)) {
            return false;
          }
        }
      }

      // Check role requirements
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (item.requireAllRoles) {
          if (!item.requiredRoles.every(role => hasRole(role))) {
            return false;
          }
        } else {
          if (!hasAnyRole(item.requiredRoles)) {
            return false;
          }
        }
      }

      return true;
    })
    .map(item => {
      // Recursively filter children
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterNavigationByPermissions(
            item.children,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            hasRole,
            hasAnyRole
          ),
        };
      }
      return item;
    });
}

/**
 * Default quick actions for the dashboard
 * Each action has permission requirements
 */
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  path: string;
  requiredPermissions?: Permission[];
  variant?: 'primary' | 'secondary' | 'info';
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-request',
    label: 'New Request',
    description: 'Create a new public records request',
    icon: <Inbox />,
    path: '/admin/requests/new',
    requiredPermissions: ['request:create'],
    variant: 'primary',
  },
  {
    id: 'search-records',
    label: 'Search Records',
    description: 'Search and match records using AI',
    icon: <Search />,
    path: '/admin/search',
    requiredPermissions: ['ai:match'],
    variant: 'primary',
  },
  {
    id: 'pending-review',
    label: 'Pending Reviews',
    description: 'Review pending legal items',
    icon: <Gavel />,
    path: '/admin/legal/pending',
    requiredPermissions: ['legal:review'],
    variant: 'info',
  },
  {
    id: 'create-package',
    label: 'New Package',
    description: 'Build and deliver a response package',
    icon: <Folder />,
    path: '/admin/packages/new',
    requiredPermissions: ['package:create'],
    variant: 'secondary',
  },
  {
    id: 'view-analytics',
    label: 'View Analytics',
    description: 'Agency performance and metrics',
    icon: <BarChart />,
    path: '/admin/analytics',
    requiredPermissions: ['analytics:view'],
    variant: 'info',
  },
  {
    id: 'manage-users',
    label: 'Manage Users',
    description: 'User and role management',
    icon: <People />,
    path: '/admin/users',
    requiredPermissions: ['user:view'],
    variant: 'secondary',
  },
];
