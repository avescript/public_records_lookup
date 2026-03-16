/**
 * Navigation Hook
 * US-091: Role-Based UI & Permissions
 *
 * Hook for accessing filtered navigation items based on user permissions
 */

'use client';

import { useMemo } from 'react';

import {
  filterNavigationByPermissions,
  NAVIGATION_ITEMS,
  NavigationItem,
  QUICK_ACTIONS,
  QuickAction,
} from '../components/navigation/RoleBasedNavigation';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Hook to get filtered navigation based on current user permissions
 *
 * @returns Object containing filtered navigation items and quick actions
 *
 * @example
 * ```tsx
 * function NavigationMenu() {
 *   const { navigationItems, quickActions, hasAccess } = useNavigation();
 *
 *   return (
 *     <nav>
 *       {navigationItems.map(item => (
 *         <NavItem key={item.id} {...item} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useNavigation() {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = usePermissions();

  /**
   * Filter navigation items based on user permissions
   */
  const navigationItems = useMemo(
    () =>
      filterNavigationByPermissions(
        NAVIGATION_ITEMS,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole
      ),
    [hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole]
  );

  /**
   * Filter quick actions based on user permissions
   */
  const quickActions = useMemo(() => {
    return QUICK_ACTIONS.filter(action => {
      if (
        !action.requiredPermissions ||
        action.requiredPermissions.length === 0
      ) {
        return true;
      }
      return hasAnyPermission(action.requiredPermissions);
    });
  }, [hasAnyPermission]);

  /**
   * Check if user has access to a specific route
   * @param itemId - Navigation item ID
   * @returns boolean indicating if user has access
   */
  const hasAccessToRoute = (itemId: string): boolean => {
    const findItem = (items: NavigationItem[]): NavigationItem | undefined => {
      for (const item of items) {
        if (item.id === itemId) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const item = findItem(navigationItems);
    return !!item;
  };

  /**
   * Get a specific navigation item by ID
   * @param itemId - Navigation item ID
   * @returns NavigationItem or undefined
   */
  const getNavigationItem = (itemId: string): NavigationItem | undefined => {
    const findItem = (items: NavigationItem[]): NavigationItem | undefined => {
      for (const item of items) {
        if (item.id === itemId) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findItem(navigationItems);
  };

  /**
   * Get all navigation items flattened (including children)
   */
  const flatNavigationItems = useMemo(() => {
    const flatten = (items: NavigationItem[]): NavigationItem[] => {
      return items.reduce((acc, item) => {
        acc.push(item);
        if (item.children) {
          acc.push(...flatten(item.children));
        }
        return acc;
      }, [] as NavigationItem[]);
    };

    return flatten(navigationItems);
  }, [navigationItems]);

  return {
    navigationItems,
    quickActions,
    hasAccessToRoute,
    getNavigationItem,
    flatNavigationItems,
  };
}
