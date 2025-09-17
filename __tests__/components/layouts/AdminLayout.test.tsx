import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { usePathname } from 'next/navigation';
import { AdminLayout } from '../../../src/components/layouts/AdminLayout';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Test wrapper with AuthProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

// Mock authenticated user component
function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
  const { login } = useAuth();
  
  React.useEffect(() => {
    login('admin@records.gov', 'admin123');
  }, [login]);

  return <AdminLayout>{children}</AdminLayout>;
}

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
  });

  test('renders admin header with title and navigation', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    // Wait for authentication to complete
    await screen.findByText('Admin Console');
    
    // Check admin title
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByRole('link', { name: 'Request Queue' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin Tools' })).toBeInTheDocument();
    
    // Check staff access indicator
    expect(screen.getByText('Staff Access')).toBeInTheDocument();
    
    // Check logout button
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('renders children content in admin layout', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div data-testid="admin-content">Admin Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    await screen.findByTestId('admin-content');
    expect(screen.getByText('Admin Test Content')).toBeInTheDocument();
  });

  test('renders admin footer', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    await screen.findByText('Staff Portal - Public Records Management System');
    expect(screen.getByText('Staff Portal - Public Records Management System')).toBeInTheDocument();
  });

  test('highlights active navigation link for staff page', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const requestQueueButton = await screen.findByRole('link', { name: 'Request Queue' });
    expect(requestQueueButton).toHaveStyle('font-weight: bold');
    
    const adminToolsButton = screen.getByRole('link', { name: 'Admin Tools' });
    expect(adminToolsButton).toHaveStyle('font-weight: normal');
  });

  test('highlights active navigation link for admin tools page', async () => {
    mockUsePathname.mockReturnValue('/admin/tools');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const requestQueueButton = await screen.findByRole('link', { name: 'Request Queue' });
    expect(requestQueueButton).toHaveStyle('font-weight: normal');
    
    const adminToolsButton = screen.getByRole('link', { name: 'Admin Tools' });
    expect(adminToolsButton).toHaveStyle('font-weight: bold');
  });

  test('contains correct navigation links', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const requestQueueLink = await screen.findByRole('link', { name: 'Request Queue' });
    expect(requestQueueLink).toHaveAttribute('href', '/admin/staff');
    
    const adminToolsLink = screen.getByRole('link', { name: 'Admin Tools' });
    expect(adminToolsLink).toHaveAttribute('href', '/admin/tools');
  });

  test('admin console title links to admin home', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const titleLink = await screen.findByRole('link', { name: 'Admin Console' });
    expect(titleLink).toHaveAttribute('href', '/admin');
  });

  test('logout button triggers logout and redirect', async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const logoutButton = await screen.findByRole('button', { name: /logout/i });
    
    await user.click(logoutButton);
    
    // Check that window.location.href was set to redirect to home
    expect(window.location.href).toBe('/');
  });

  test('has proper admin styling with darker header', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const header = await screen.findByRole('banner');
    expect(header).toBeInTheDocument();
    // The AppBar should have the primary.dark styling
    expect(header).toHaveClass('MuiAppBar-root');
  });

  test('layout has proper admin structure', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div data-testid="admin-content">Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    // Check for header (AppBar)
    const header = await screen.findByRole('banner');
    expect(header).toBeInTheDocument();

    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('admin-content'));

    // Check for footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  test('staff access chip is displayed', async () => {
    mockUsePathname.mockReturnValue('/admin/staff');
    
    render(
      <TestWrapper>
        <AuthenticatedAdminLayout>
          <div>Test Content</div>
        </AuthenticatedAdminLayout>
      </TestWrapper>
    );

    const staffChip = await screen.findByText('Staff Access');
    expect(staffChip).toBeInTheDocument();
    // Check that it's rendered as a chip with secondary color
    expect(staffChip.closest('.MuiChip-root')).toBeInTheDocument();
  });
});