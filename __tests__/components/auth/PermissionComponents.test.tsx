import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { 
  PermissionButton, 
  PermissionIconButton,
  PermissionMenuItem,
  RoleChip,
  AdminButton,
  StaffButton,
  LegalButton,
  ApprovalButton,
  RejectButton
} from '../../../src/components/auth/PermissionComponents';
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

describe('Permission Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PermissionButton', () => {
    it('should render button when user has required role', () => {
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
          <PermissionButton requiredRoles={['admin']}>
            Admin Action
          </PermissionButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Admin Action' })).toBeInTheDocument();
    });

    it('should not render button when user lacks required role', () => {
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
          <PermissionButton requiredRoles={['admin']}>
            Admin Action
          </PermissionButton>
        </TestWrapper>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render button when user has required permission', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
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
          <PermissionButton requiredPermissions={['manage_users']}>
            Manage Users
          </PermissionButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Manage Users' })).toBeInTheDocument();
    });

    it('should show access denied message when showAccessDenied is true', () => {
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
          <PermissionButton 
            requiredRoles={['admin']} 
            showAccessDenied={true}
          >
            Admin Action
          </PermissionButton>
        </TestWrapper>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText("You don't have permission for this action.")).toBeInTheDocument();
    });

    it('should handle button clicks correctly', () => {
      const mockClick = jest.fn();
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
          <PermissionButton requiredRoles={['admin']} onClick={mockClick}>
            Click Me
          </PermissionButton>
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('PermissionIconButton', () => {
    it('should render icon button when user has permission', () => {
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
          <PermissionIconButton requiredRoles={['admin']} aria-label="admin-action">
            <span>Icon</span>
          </PermissionIconButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'admin-action' })).toBeInTheDocument();
    });

    it('should not render icon button when user lacks permission', () => {
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
          <PermissionIconButton requiredRoles={['admin']} aria-label="admin-action">
            <span>Icon</span>
          </PermissionIconButton>
        </TestWrapper>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('RoleChip', () => {
    it('should render admin role chip correctly', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
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
          <RoleChip />
        </TestWrapper>
      );

      expect(screen.getByText('Administrator')).toBeInTheDocument();
      // Check that chip has correct styling classes
      const chip = screen.getByText('Administrator').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorError');
    });

    it('should render staff role chip correctly', () => {
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
          <RoleChip />
        </TestWrapper>
      );

      expect(screen.getByText('Staff')).toBeInTheDocument();
      const chip = screen.getByText('Staff').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorPrimary');
    });

    it('should render legal reviewer role chip correctly', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '3', email: 'legal@test.com', role: 'legal_reviewer', name: 'Legal' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
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
          <RoleChip />
        </TestWrapper>
      );

      expect(screen.getByText('Legal Reviewer')).toBeInTheDocument();
      const chip = screen.getByText('Legal Reviewer').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorWarning');
    });

    it('should render chip without icon when showIcon is false', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
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
          <RoleChip showIcon={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Administrator')).toBeInTheDocument();
      // Check that chip doesn't have icon
      const chip = screen.getByText('Administrator').closest('.MuiChip-root');
      expect(chip?.querySelector('.MuiChip-icon')).toBeNull();
    });

    it('should return null when no user is present', () => {
      mockUsePermissions.mockReturnValue({
        user: null,
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn(() => false),
        hasAnyPermission: jest.fn(() => false),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => []),
        isAdmin: false,
        isStaff: false,
        isLegalReviewer: false,
      });

      const { container } = render(
        <TestWrapper>
          <RoleChip />
        </TestWrapper>
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Convenience Components', () => {
    it('AdminButton should work for admin users', () => {
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
          <AdminButton>Admin Action</AdminButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Admin Action' })).toBeInTheDocument();
    });

    it('StaffButton should work for staff users', () => {
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
          <StaffButton>Staff Action</StaffButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Staff Action' })).toBeInTheDocument();
    });

    it('LegalButton should work for legal reviewer users', () => {
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
          <LegalButton>Legal Action</LegalButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Legal Action' })).toBeInTheDocument();
    });

    it('ApprovalButton should work when user has approve permission', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn((permission) => permission === 'approve_request'),
        hasAnyPermission: jest.fn((permissions) => permissions.includes('approve_request')),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => ['approve_request']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <ApprovalButton>Approve</ApprovalButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    });

    it('RejectButton should work when user has reject permission', () => {
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin' },
        hasRole: jest.fn(() => false),
        hasAnyRole: jest.fn(() => false),
        hasPermission: jest.fn((permission) => permission === 'reject_request'),
        hasAnyPermission: jest.fn((permissions) => permissions.includes('reject_request')),
        hasAllPermissions: jest.fn(() => false),
        getUserPermissions: jest.fn(() => ['reject_request']),
        isAdmin: true,
        isStaff: false,
        isLegalReviewer: false,
      });

      render(
        <TestWrapper>
          <RejectButton>Reject</RejectButton>
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    });
  });
});