/**
 * Multi-Agency Request Filtering
 * US-091: Role-Based UI & Permissions
 *
 * Utilities for filtering and managing requests across multiple agencies
 * based on user roles and permissions.
 */

'use client';

import { useAgency } from '../contexts/AgencyContext';
import { usePermissions, UserRole } from '../hooks/usePermissions';

/**
 * Request with agency information
 */
export interface AgencyRequest {
  id: string;
  agencyId: string;
  title: string;
  status: string;
  assignedTo?: string;
  createdBy?: string;
  createdAt: Date;
  [key: string]: unknown;
}

/**
 * Filter options for agency-based request filtering
 */
export interface AgencyFilterOptions {
  includeAllAgencies?: boolean; // If true, admin can see all agencies' requests
  onlyAssigned?: boolean; // If true, only show requests assigned to current user
  statusFilter?: string[]; // Filter by request status
  agencyIds?: string[]; // Specific agency IDs to filter
}

/**
 * Filter requests based on user's agency access and permissions
 *
 * @param requests - Array of requests to filter
 * @param options - Filter options
 * @param userRole - User's role
 * @param userId - Current user's ID
 * @param currentAgencyId - Current agency ID from context
 * @returns Filtered requests
 *
 * @example
 * ```tsx
 * const filteredRequests = filterRequestsByAgency(
 *   allRequests,
 *   { includeAllAgencies: isAdmin, onlyAssigned: false },
 *   user?.role,
 *   user?.id,
 *   currentAgency?.id
 * );
 * ```
 */
export function filterRequestsByAgency(
  requests: AgencyRequest[],
  options: AgencyFilterOptions,
  userRole?: UserRole,
  userId?: string,
  currentAgencyId?: string | null
): AgencyRequest[] {
  const {
    includeAllAgencies = false,
    onlyAssigned = false,
    statusFilter,
    agencyIds,
  } = options;

  return requests.filter(request => {
    // Filter by agency access
    if (agencyIds && agencyIds.length > 0) {
      // If specific agency IDs provided, check against those
      if (!agencyIds.includes(request.agencyId)) {
        return false;
      }
    } else if (includeAllAgencies) {
      // Admin can see all - no filtering
    } else {
      // Non-admin users can only see their current agency's requests
      if (request.agencyId !== currentAgencyId) {
        return false;
      }
    }

    // Filter by assignment
    if (onlyAssigned && userId) {
      if (request.assignedTo !== userId) {
        return false;
      }
    }

    // Filter by status
    if (statusFilter && statusFilter.length > 0) {
      if (!statusFilter.includes(request.status)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Hook for agency-aware request filtering
 * Automatically applies permissions and agency context
 *
 * @returns Functions and state for filtering requests
 *
 * @example
 * ```tsx
 * function RequestList() {
 *   const { filterRequests, canViewAllAgencies, currentAgencies } = useAgencyFilter();
 *   const [requests, setRequests] = useState<AgencyRequest[]>([]);
 *
 *   const filteredRequests = filterRequests(requests, {
 *     onlyAssigned: false,
 *     statusFilter: ['pending', 'in_progress']
 *   });
 *
 *   return <RequestTable requests={filteredRequests} />;
 * }
 * ```
 */
export function useAgencyFilter() {
  const { user, isAdmin, features } = usePermissions();
  const { currentAgency, availableAgencies } = useAgency();

  /**
   * Check if user can view requests from all agencies
   * Admins have this capability
   */
  const canViewAllAgencies = isAdmin;

  /**
   * Check if user can manage cross-agency requests
   * Only admins can assign/transfer requests between agencies
   */
  const canManageCrossAgency = isAdmin && features.canManageRequests;

  /**
   * Get list of agency IDs the user can access
   */
  const accessibleAgencyIds = canViewAllAgencies
    ? availableAgencies.map(a => a.id)
    : currentAgency
      ? [currentAgency.id]
      : [];

  /**
   * Filter requests with automatic permission and agency context
   */
  const filterRequests = (
    requests: AgencyRequest[],
    options: Omit<AgencyFilterOptions, 'includeAllAgencies'> = {}
  ): AgencyRequest[] => {
    return filterRequestsByAgency(
      requests,
      {
        ...options,
        includeAllAgencies: canViewAllAgencies,
      },
      user?.role,
      user?.id,
      currentAgency?.id
    );
  };

  /**
   * Group requests by agency
   */
  const groupRequestsByAgency = (
    requests: AgencyRequest[]
  ): Record<string, AgencyRequest[]> => {
    return requests.reduce(
      (groups, request) => {
        const agencyId = request.agencyId;
        if (!groups[agencyId]) {
          groups[agencyId] = [];
        }
        groups[agencyId].push(request);
        return groups;
      },
      {} as Record<string, AgencyRequest[]>
    );
  };

  /**
   * Get request counts by agency
   */
  const getRequestCountsByAgency = (
    requests: AgencyRequest[]
  ): Record<string, number> => {
    const groups = groupRequestsByAgency(requests);
    return Object.entries(groups).reduce(
      (counts, [agencyId, agencyRequests]) => {
        counts[agencyId] = agencyRequests.length;
        return counts;
      },
      {} as Record<string, number>
    );
  };

  /**
   * Filter requests by current agency only
   */
  const filterByCurrentAgency = (
    requests: AgencyRequest[]
  ): AgencyRequest[] => {
    if (!currentAgency) return [];
    return requests.filter(r => r.agencyId === currentAgency.id);
  };

  /**
   * Check if a specific request is accessible to the current user
   */
  const canAccessRequest = (request: AgencyRequest): boolean => {
    // Admins can access all requests
    if (isAdmin) return true;

    // Check if request belongs to user's current agency
    if (request.agencyId !== currentAgency?.id) return false;

    // Staff can see all requests in their agency or assigned to them
    if (user?.role === 'staff') {
      return true;
    }

    // Legal reviewers can see requests in their agency
    if (user?.role === 'legal_reviewer') {
      return true;
    }

    return false;
  };

  /**
   * Check if user can edit a specific request
   */
  const canEditRequest = (request: AgencyRequest): boolean => {
    if (!features.canManageRequests) return false;
    if (isAdmin) return true;

    // Must be in user's agency
    if (request.agencyId !== currentAgency?.id) return false;

    // Staff can edit requests in their agency
    return user?.role === 'staff';
  };

  /**
   * Check if user can delete a specific request
   */
  const canDeleteRequest = (request: AgencyRequest): boolean => {
    if (!isAdmin) return false;

    // Admin can delete but should respect agency boundaries in most cases
    return request.agencyId === currentAgency?.id || canManageCrossAgency;
  };

  /**
   * Check if user can transfer a request to another agency
   */
  const canTransferRequest = (request: AgencyRequest): boolean => {
    return canManageCrossAgency;
  };

  return {
    // State
    currentAgencyId: currentAgency?.id,
    accessibleAgencyIds,
    canViewAllAgencies,
    canManageCrossAgency,

    // Filtering functions
    filterRequests,
    filterByCurrentAgency,
    groupRequestsByAgency,
    getRequestCountsByAgency,

    // Permission checks
    canAccessRequest,
    canEditRequest,
    canDeleteRequest,
    canTransferRequest,
  };
}

/**
 * Agency-specific statistics and metrics
 */
export interface AgencyStats {
  agencyId: string;
  agencyName: string;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  averageProcessingTime: number; // in days
}

/**
 * Calculate statistics for each agency
 * Respects user's agency access permissions
 *
 * @param requests - All requests
 * @param agencies - Available agencies
 * @param canViewAllAgencies - Whether user can see all agencies
 * @param currentAgencyId - Current agency ID
 * @returns Array of agency statistics
 */
export function calculateAgencyStats(
  requests: AgencyRequest[],
  agencies: Array<{ id: string; name: string }>,
  canViewAllAgencies: boolean,
  currentAgencyId?: string | null
): AgencyStats[] {
  const visibleAgencies = canViewAllAgencies
    ? agencies
    : agencies.filter(a => a.id === currentAgencyId);

  return visibleAgencies.map(agency => {
    const agencyRequests = requests.filter(r => r.agencyId === agency.id);
    const pendingRequests = agencyRequests.filter(
      r => r.status === 'pending' || r.status === 'in_progress'
    );
    const completedRequests = agencyRequests.filter(
      r => r.status === 'completed' || r.status === 'delivered'
    );

    // Calculate average processing time (mock implementation)
    const averageProcessingTime = completedRequests.length > 0 ? 12 : 0;

    return {
      agencyId: agency.id,
      agencyName: agency.name,
      totalRequests: agencyRequests.length,
      pendingRequests: pendingRequests.length,
      completedRequests: completedRequests.length,
      averageProcessingTime,
    };
  });
}

/**
 * Standalone helper: Check if a user can access a specific request
 * Useful for non-hook contexts and testing
 *
 * @param request - The request to check
 * @param user - User object with id, role, and agencyId
 * @returns true if user can access the request
 */
export function canAccessRequest(
  request: { agencyId?: string; [key: string]: any },
  user: {
    id: string;
    role: 'admin' | 'staff' | 'legal_reviewer';
    agencyId?: string;
  }
): boolean {
  // Admins can access all requests
  if (user.role === 'admin') return true;

  // Check if request belongs to user's agency
  if (request.agencyId !== user.agencyId) return false;

  // Staff and legal reviewers can see requests in their agency
  return user.role === 'staff' || user.role === 'legal_reviewer';
}

/**
 * Standalone helper: Check if a user can edit a specific request
 * Useful for non-hook contexts and testing
 *
 * @param request - The request to check
 * @param user - User object with id, role, and agencyId
 * @returns true if user can edit the request
 */
export function canEditRequest(
  request: { agencyId?: string; [key: string]: any },
  user: {
    id: string;
    role: 'admin' | 'staff' | 'legal_reviewer';
    agencyId?: string;
  }
): boolean {
  // Admins can edit all requests
  if (user.role === 'admin') return true;

  // Must be in user's agency
  if (request.agencyId !== user.agencyId) return false;

  // Only staff can edit (legal reviewers only review)
  return user.role === 'staff';
}

/**
 * Standalone helper: Check if a user can delete a specific request
 * Useful for non-hook contexts and testing
 *
 * @param request - The request to check
 * @param user - User object with id, role, and agencyId
 * @returns true if user can delete the request
 */
export function canDeleteRequest(
  request: { agencyId?: string; [key: string]: any },
  user: {
    id: string;
    role: 'admin' | 'staff' | 'legal_reviewer';
    agencyId?: string;
  }
): boolean {
  // Only admins can delete
  return user.role === 'admin';
}

/**
 * Standalone helper: Check if a user can transfer a request to another agency
 * Useful for non-hook contexts and testing
 *
 * @param request - The request to check
 * @param user - User object with id, role, and agencyId
 * @returns true if user can transfer the request
 */
export function canTransferRequest(
  request: { agencyId?: string; [key: string]: any },
  user: {
    id: string;
    role: 'admin' | 'staff' | 'legal_reviewer';
    agencyId?: string;
  }
): boolean {
  // Only admins can transfer across agencies
  return user.role === 'admin';
}
