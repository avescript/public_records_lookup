import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  withRoleAccess,
  withAdminAccess,
  withStaffAccess,
  withLegalAccess,
  withPermissions,
} from '../../../src/components/auth/withRoleAccess';
import { usePermissions } from '../../../src/hooks/usePermissions';

// Mock the usePermissions hook
jest.mock('../../../src/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>;

// Test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// Test component
interface TestComponentProps {
  message: string;
  onClick?: () => void;
}

const TestComponent: React.FC<TestComponentProps> = ({ message, onClick }) => (
  <div data-testid='test-component' onClick={onClick}>
    {message}
  </div>
);

const FallbackComponent: React.FC<TestComponentProps> = ({ message }) => (
  <div data-testid='fallback-component'>Fallback: {message}</div>
);

describe('withRoleAccess HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Role Access', () => {
    it('should render component when user has required role', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(role => role === 'admin'),
        hasAnyRole: jest.fn(roles => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin'],
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Admin Content' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render component when user lacks required role', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '2',
          email: 'staff@test.com',
          role: 'staff',
          name: 'Staff',
        },
        hasRole: jest.fn(role => role === 'staff'),
        hasAnyRole: jest.fn(roles => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin'],
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Admin Content' />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });

    it('should render fallback component when access denied and fallback provided', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '2',
          email: 'staff@test.com',
          role: 'staff',
          name: 'Staff',
        },
        hasRole: jest.fn(role => role === 'staff'),
        hasAnyRole: jest.fn(roles => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin'],
        fallback: FallbackComponent,
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Admin Content' />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
      expect(screen.getByText('Fallback: Admin Content')).toBeInTheDocument();
    });

    it('should handle requireAllRoles option', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(role => role === 'admin'),
        hasAnyRole: jest.fn(roles => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin', 'staff'],
        requireAllRoles: true,
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Multi Role Content' />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  describe('Permission-Based Access', () => {
    it('should render component when user has required permission', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(permission => permission === 'manage_users'),
        hasAnyPermission: jest.fn(permissions =>
          permissions.includes('manage_users')
        ),
        hasAllPermissions: jest.fn(permissions =>
          permissions.every(p => p === 'manage_users')
        ),
        getUserPermissions: jest.fn(() => ['manage_users']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        permissions: ['manage_users'],
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='User Management' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should not render component when user lacks required permission', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '2',
          email: 'staff@test.com',
          role: 'staff',
          name: 'Staff',
        },
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

      const ProtectedComponent = withRoleAccess(TestComponent, {
        permissions: ['manage_users'],
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='User Management' />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });

    it('should handle requireAllPermissions option', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(permission => permission === 'approve_request'),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(
          permissions =>
            permissions.length === 1 && permissions[0] === 'approve_request'
        ),
        getUserPermissions: jest.fn(() => ['approve_request']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        permissions: ['approve_request', 'reject_request'],
        requireAllPermissions: true,
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Full Approval Access' />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  describe('Combined Role and Permission Access', () => {
    it('should require both role and permission checks to pass', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(role => role === 'admin'),
        hasAnyRole: jest.fn(roles => roles.includes('admin')),
        hasPermission: jest.fn(permission => permission === 'manage_users'),
        hasAnyPermission: jest.fn(permissions =>
          permissions.includes('manage_users')
        ),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => ['manage_users']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin'],
        permissions: ['manage_users'],
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Admin User Management' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should deny access when role check passes but permission check fails', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(role => role === 'admin'),
        hasAnyRole: jest.fn(roles => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin'],
        permissions: ['manage_users'],
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Admin User Management' />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  describe('hideOnDenied Option', () => {
    it('should render component when hideOnDenied is false and access denied', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '2',
          email: 'staff@test.com',
          role: 'staff',
          name: 'Staff',
        },
        hasRole: jest.fn(role => role === 'staff'),
        hasAnyRole: jest.fn(roles => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      const ProtectedComponent = withRoleAccess(TestComponent, {
        roles: ['admin'],
        hideOnDenied: false,
      });

      render(
        <TestWrapper>
          <ProtectedComponent message='Admin Content' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  describe('Convenience HOCs', () => {
    it('withAdminAccess should work for admin users', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(role => role === 'admin'),
        hasAnyRole: jest.fn(roles => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const AdminComponent = withAdminAccess(TestComponent);

      render(
        <TestWrapper>
          <AdminComponent message='Admin Only' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Admin Only')).toBeInTheDocument();
    });

    it('withStaffAccess should work for staff users', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '2',
          email: 'staff@test.com',
          role: 'staff',
          name: 'Staff',
        },
        hasRole: jest.fn(role => role === 'staff'),
        hasAnyRole: jest.fn(roles => roles.includes('staff')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: true,
        isLegalReviewer: false,
      });

      const StaffComponent = withStaffAccess(TestComponent);

      render(
        <TestWrapper>
          <StaffComponent message='Staff Access' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Staff Access')).toBeInTheDocument();
    });

    it('withLegalAccess should work for legal reviewer users', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '3',
          email: 'legal@test.com',
          role: 'legal_reviewer',
          name: 'Legal',
        },
        hasRole: jest.fn(role => role === 'legal_reviewer'),
        hasAnyRole: jest.fn(roles => roles.includes('legal_reviewer')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: false,
        isLegalReviewer: true,
      });

      const LegalComponent = withLegalAccess(TestComponent);

      render(
        <TestWrapper>
          <LegalComponent message='Legal Access' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Legal Access')).toBeInTheDocument();
    });

    it('withPermissions should work with specific permissions', () => {
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(permission => permission === 'manage_users'),
        hasAnyPermission: jest.fn(permissions =>
          permissions.includes('manage_users')
        ),
        hasAllPermissions: jest.fn(permissions =>
          permissions.every(p => p === 'manage_users')
        ),
        getUserPermissions: jest.fn(() => ['manage_users']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const UserManagementComponent = withPermissions(TestComponent, [
        'manage_users',
      ]);

      render(
        <TestWrapper>
          <UserManagementComponent message='User Management' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should preserve component props and functionality', () => {
      const mockClick = jest.fn();
      mockUsePermissions.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
        },
        hasRole: jest.fn(role => role === 'admin'),
        hasAnyRole: jest.fn(roles => roles.includes('admin')),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      const AdminComponent = withAdminAccess(TestComponent);

      render(
        <TestWrapper>
          <AdminComponent message='Clickable Admin' onClick={mockClick} />
        </TestWrapper>
      );

      const component = screen.getByTestId('test-component');
      component.click();

      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });
});
