import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedRoute } from '../../../src/components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper with AuthProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

// Helper component to simulate authenticated user
function AuthenticatedWrapper({ 
  children, 
  userRole = 'staff' 
}: { 
  children: React.ReactNode;
  userRole?: 'admin' | 'staff' | 'legal_reviewer';
}) {
  const { login } = useAuth();
  
  React.useEffect(() => {
    const email = userRole === 'admin' ? 'admin@records.gov' : 
                  userRole === 'legal_reviewer' ? 'legal@records.gov' : 
                  'staff@records.gov';
    login(email, `${userRole}123`);
  }, [login, userRole]);

  return <>{children}</>;
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    window.location.href = '';
  });

  test('shows loading state initially', () => {
    render(
      <TestWrapper>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('redirects to login when user is not authenticated', async () => {
    render(
      <TestWrapper>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/admin/login');
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('renders children when user is authenticated', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('allows access when user has required role', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper userRole="admin">
          <ProtectedRoute requiredRole="admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  test('denies access when user lacks required role', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper userRole="staff">
          <ProtectedRoute requiredRole="admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  test('allows admin access to any role-protected route', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper userRole="admin">
          <ProtectedRoute requiredRole="staff">
            <div data-testid="staff-content">Staff Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('staff-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Staff Content')).toBeInTheDocument();
  });

  test('allows legal reviewer access to legal reviewer routes', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper userRole="legal_reviewer">
          <ProtectedRoute requiredRole="legal_reviewer">
            <div data-testid="legal-content">Legal Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('legal-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Legal Content')).toBeInTheDocument();
  });

  test('denies legal reviewer access to admin routes', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper userRole="legal_reviewer">
          <ProtectedRoute requiredRole="admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  test('works without required role (general authentication)', async () => {
    render(
      <TestWrapper>
        <AuthenticatedWrapper userRole="staff">
          <ProtectedRoute>
            <div data-testid="general-content">General Protected Content</div>
          </ProtectedRoute>
        </AuthenticatedWrapper>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('general-content')).toBeInTheDocument();
    });

    expect(screen.getByText('General Protected Content')).toBeInTheDocument();
  });

  test('restores authentication from localStorage', async () => {
    const savedUser = {
      id: '1',
      email: 'staff@records.gov',
      role: 'staff',
      name: 'Records Officer'
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedUser));

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div data-testid="restored-content">Restored Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('restored-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Restored Content')).toBeInTheDocument();
  });

  test('handles corrupted localStorage gracefully', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-json');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/admin/login');
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});