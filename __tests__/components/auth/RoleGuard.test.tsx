import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { RoleGuard, AdminOnly, StaffOnly, LegalOnly, ApprovalRequired } from '../../../src/components/auth/RoleGuard';
import { usePermissions } from '../../../src/hooks/usePermissions';

// Mock the usePermissions hook
jest.mock('../../../src/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

// Test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RoleGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Role Access', () => {
    it('should render children when user has required role', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn((role) => role === 'admin'),
        hasAnyRole: jest.fn((roles) => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard roles={['admin']}>
            <div data-testid="protected-content">Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required role', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '2', email: 'staff@test.com', role: 'staff', name: 'Staff' },
        hasRole: jest.fn((role) => role === 'staff'),
        hasAnyRole: jest.fn((roles) => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard roles={['admin']}>
            <div data-testid="protected-content">Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render access denied message when showAccessDenied is true', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '2', email: 'staff@test.com', role: 'staff', name: 'Staff' },
        hasRole: jest.fn((role) => role === 'staff'),
        hasAnyRole: jest.fn((roles) => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard roles={['admin']} showAccessDenied={true}>
            <div data-testid="protected-content">Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this feature.")).toBeInTheDocument();
      expect(screen.getByText('Current role: staff')).toBeInTheDocument();
    });

    it('should render custom access denied message', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '2', email: 'staff@test.com', role: 'staff', name: 'Staff' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard 
            roles={['admin']} 
            showAccessDenied={true}
            accessDeniedMessage="Custom access denied message"
          >
            <div data-testid="protected-content">Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Custom access denied message')).toBeInTheDocument();
    });

    it('should render fallback content when provided', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '2', email: 'staff@test.com', role: 'staff', name: 'Staff' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard 
            roles={['admin']}
            fallback={<div data-testid="fallback-content">Fallback Content</div>}
          >
            <div data-testid="protected-content">Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Access', () => {
    it('should grant access when user has required permission', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn((permission) => permission === 'manage_users'),
        hasAnyPermission: jest.fn((permissions) => permissions.includes('manage_users')),
        hasAllPermissions: jest.fn((permissions) => permissions.every(p => p === 'manage_users')),
        getUserPermissions: jest.fn(() => ['manage_users']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard permissions={['manage_users']}>
            <div data-testid="protected-content">User Management</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should deny access when user lacks required permission', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '2', email: 'staff@test.com', role: 'staff', name: 'Staff' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard permissions={['manage_users']}>
            <div data-testid="protected-content">User Management</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should handle requireAllPermissions=true', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn((permission) => permission === 'approve_request'),
        hasAnyPermission: jest.fn(() => true),
        hasAllPermissions: jest.fn((permissions) => permissions.length === 1 && permissions[0] === 'approve_request'),
        getUserPermissions: jest.fn(() => ['approve_request']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard 
            permissions={['approve_request', 'reject_request']} 
            requireAllPermissions={true}
          >
            <div data-testid="protected-content">Approval Actions</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Combined Role and Permission Access', () => {
    it('should require both role and permission checks to pass', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn((role) => role === 'admin'),
        hasAnyRole: jest.fn((roles) => roles.includes('admin')),
        hasPermission: jest.fn((permission) => permission === 'manage_users'),
        hasAnyPermission: jest.fn((permissions) => permissions.includes('manage_users')),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => ['manage_users']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard 
            roles={['admin']} 
            permissions={['manage_users']}
          >
            <div data-testid="protected-content">Admin User Management</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should deny access when role check passes but permission check fails', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn((role) => role === 'admin'),
        hasAnyRole: jest.fn((roles) => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RoleGuard 
            roles={['admin']} 
            permissions={['manage_users']}
          >
            <div data-testid="protected-content">Admin User Management</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Convenience Components', () => {
    it('AdminOnly should render for admin users', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn((role) => role === 'admin'),
        hasAnyRole: jest.fn((roles) => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <AdminOnly>
            <div data-testid="admin-content">Admin Only Content</div>
          </AdminOnly>
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    it('StaffOnly should render for staff and admin users', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '2', email: 'staff@test.com', role: 'staff', name: 'Staff' },
        hasRole: jest.fn((role) => role === 'staff'),
        hasAnyRole: jest.fn((roles) => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <StaffOnly>
            <div data-testid="staff-content">Staff Only Content</div>
          </StaffOnly>
        </TestWrapper>
      );

      expect(screen.getByTestId('staff-content')).toBeInTheDocument();
    });

    it('LegalOnly should render for legal reviewer and admin users', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '3', email: 'legal@test.com', role: 'legal_reviewer', name: 'Legal' },
        hasRole: jest.fn((role) => role === 'legal_reviewer'),
        hasAnyRole: jest.fn((roles) => roles.includes('legal_reviewer')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: false,
        isLegalReviewer: true,
      });

      render(
        <TestWrapper>
          <LegalOnly>
            <div data-testid="legal-content">Legal Only Content</div>
          </LegalOnly>
        </TestWrapper>
      );

      expect(screen.getByTestId('legal-content')).toBeInTheDocument();
    });

    it('ApprovalRequired should render for users with approval permissions', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn((permission) => ['approve_request', 'reject_request'].includes(permission)),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn((permissions) => 
          permissions.every(p => ['approve_request', 'reject_request'].includes(p))
        ),
        getUserPermissions: jest.fn(() => ['approve_request', 'reject_request']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <ApprovalRequired>
            <div data-testid="approval-content">Approval Content</div>
          </ApprovalRequired>
        </TestWrapper>
      );

      expect(screen.getByTestId('approval-content')).toBeInTheDocument();
    });
  });
});