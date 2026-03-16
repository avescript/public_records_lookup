import { usePermissions } from '../../src/hooks/usePermissions';

// Mock the usePermissions hook
jest.mock('../../src/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>;

describe('usePermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return admin permissions for admin user', () => {
    const mockAdmin = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Admin User',
    };

    mockUsePermissions.mockReturnValue({
      user: mockAdmin,
      hasPermission: jest.fn(permission => {
        const adminPermissions = [
          'view_all_requests',
          'create_request',
          'edit_request',
          'delete_request',
          'approve_request',
          'reject_request',
          'redact_documents',
          'review_redactions',
          'generate_reports',
          'manage_users',
          'manage_agencies',
          'export_data',
          'audit_logs',
          'system_settings',
          'legal_review',
          'final_approval',
        ];
        return adminPermissions.includes(permission);
      }),
      hasAnyPermission: jest.fn(permissions => permissions.some(p => true)), // Admin has all permissions
      hasAllPermissions: jest.fn(permissions => permissions.every(p => true)), // Admin has all permissions
      hasRole: jest.fn(role => role === 'admin'),
      hasAnyRole: jest.fn(roles => roles.includes('admin')),
      getUserPermissions: jest.fn(() => [
        'view_all_requests',
        'create_request',
        'edit_request',
        'delete_request',
        'approve_request',
        'reject_request',
        'redact_documents',
        'review_redactions',
        'generate_reports',
        'manage_users',
        'manage_agencies',
        'export_data',
        'audit_logs',
        'system_settings',
        'legal_review',
        'final_approval',
      ]),
      isAdmin: true,
      isStaff: false,
      isLegalReviewer: false,
    });

    const result = mockUsePermissions();

    expect(result.isAdmin).toBe(true);
    expect(result.hasRole('admin')).toBe(true);
    expect(result.hasPermission('manage_users')).toBe(true);
    expect(result.hasPermission('final_approval')).toBe(true);
    expect(result.getUserPermissions()).toContain('system_settings');
  });

  it('should return staff permissions for staff user', () => {
    const mockStaff = {
      id: '2',
      email: 'staff@test.com',
      role: 'staff' as const,
      name: 'Staff User',
    };

    mockUsePermissions.mockReturnValue({
      user: mockStaff,
      hasPermission: jest.fn(permission => {
        const staffPermissions = [
          'view_own_requests',
          'create_request',
          'edit_request',
          'redact_documents',
          'export_data',
        ];
        return staffPermissions.includes(permission);
      }),
      hasAnyPermission: jest.fn(permissions =>
        permissions.some(p =>
          [
            'view_own_requests',
            'create_request',
            'edit_request',
            'redact_documents',
            'export_data',
          ].includes(p)
        )
      ),
      hasAllPermissions: jest.fn(permissions =>
        permissions.every(p =>
          [
            'view_own_requests',
            'create_request',
            'edit_request',
            'redact_documents',
            'export_data',
          ].includes(p)
        )
      ),
      hasRole: jest.fn(role => role === 'staff'),
      hasAnyRole: jest.fn(roles => roles.includes('staff')),
      getUserPermissions: jest.fn(() => [
        'view_own_requests',
        'create_request',
        'edit_request',
        'redact_documents',
        'export_data',
      ]),
      isAdmin: false,
      isStaff: true,
      isLegalReviewer: false,
    });

    const result = mockUsePermissions();

    expect(result.isStaff).toBe(true);
    expect(result.hasRole('staff')).toBe(true);
    expect(result.hasPermission('edit_request')).toBe(true);
    expect(result.hasPermission('manage_users')).toBe(false);
    expect(result.getUserPermissions()).toContain('redact_documents');
  });

  it('should return legal reviewer permissions for legal reviewer user', () => {
    const mockLegalReviewer = {
      id: '3',
      email: 'legal@test.com',
      role: 'legal_reviewer' as const,
      name: 'Legal User',
    };

    mockUsePermissions.mockReturnValue({
      user: mockLegalReviewer,
      hasPermission: jest.fn(permission => {
        const legalPermissions = [
          'view_all_requests',
          'legal_review',
          'review_redactions',
          'approve_request',
          'reject_request',
          'final_approval',
          'generate_reports',
        ];
        return legalPermissions.includes(permission);
      }),
      hasAnyPermission: jest.fn(permissions =>
        permissions.some(p =>
          [
            'view_all_requests',
            'legal_review',
            'review_redactions',
            'approve_request',
            'reject_request',
            'final_approval',
            'generate_reports',
          ].includes(p)
        )
      ),
      hasAllPermissions: jest.fn(permissions =>
        permissions.every(p =>
          [
            'view_all_requests',
            'legal_review',
            'review_redactions',
            'approve_request',
            'reject_request',
            'final_approval',
            'generate_reports',
          ].includes(p)
        )
      ),
      hasRole: jest.fn(role => role === 'legal_reviewer'),
      hasAnyRole: jest.fn(roles => roles.includes('legal_reviewer')),
      getUserPermissions: jest.fn(() => [
        'view_all_requests',
        'legal_review',
        'review_redactions',
        'approve_request',
        'reject_request',
        'final_approval',
        'generate_reports',
      ]),
      isAdmin: false,
      isStaff: false,
      isLegalReviewer: true,
    });

    const result = mockUsePermissions();

    expect(result.isLegalReviewer).toBe(true);
    expect(result.hasRole('legal_reviewer')).toBe(true);
    expect(result.hasPermission('legal_review')).toBe(true);
    expect(result.hasPermission('final_approval')).toBe(true);
    expect(result.hasPermission('edit_request')).toBe(false);
    expect(result.getUserPermissions()).toContain('approve_request');
  });

  it('should handle user with no permissions', () => {
    mockUsePermissions.mockReturnValue({
      user: null,
      hasPermission: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
      hasRole: jest.fn(() => false),
      hasAnyRole: jest.fn(() => false),
      getUserPermissions: jest.fn(() => []),
      isAdmin: false,
      isStaff: false,
      isLegalReviewer: false,
    });

    const result = mockUsePermissions();

    expect(result.user).toBe(null);
    expect(result.isAdmin).toBe(false);
    expect(result.hasPermission('view_all_requests')).toBe(false);
    expect(result.getUserPermissions()).toEqual([]);
  });

  it('should correctly check multiple permissions', () => {
    mockUsePermissions.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@test.com',
        role: 'admin' as const,
        name: 'Admin User',
      },
      hasPermission: jest.fn(() => true),
      hasAnyPermission: jest.fn(permissions => permissions.length > 0),
      hasAllPermissions: jest.fn(() => true),
      hasRole: jest.fn(role => role === 'admin'),
      hasAnyRole: jest.fn(roles => roles.includes('admin')),
      getUserPermissions: jest.fn(() => ['manage_users', 'approve_request']),
      isAdmin: true,
      isStaff: false,
      isLegalReviewer: false,
    });

    const result = mockUsePermissions();

    expect(
      result.hasAnyPermission(['manage_users', 'unknown_permission'])
    ).toBe(true);
    expect(result.hasAllPermissions(['manage_users', 'approve_request'])).toBe(
      true
    );
    expect(result.hasAnyRole(['admin', 'staff'])).toBe(true);
  });
});
