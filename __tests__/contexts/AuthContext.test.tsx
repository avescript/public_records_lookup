import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

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

// Test component to access auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button
        data-testid="login-admin"
        onClick={() => login('admin@records.gov', 'admin123')}
      >
        Login Admin
      </button>
      <button
        data-testid="login-staff"
        onClick={() => login('staff@records.gov', 'staff123')}
      >
        Login Staff
      </button>
      <button
        data-testid="login-invalid"
        onClick={() => login('invalid@test.com', 'wrong')}
      >
        Login Invalid
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

function TestApp() {
  return (
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test('initializes with no user and loading state', async () => {
    render(<TestApp />);

    // Initially should be loading
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Should still be unauthenticated after loading
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('restores user from localStorage on initialization', async () => {
    const savedUser = {
      id: '1',
      email: 'admin@records.gov',
      role: 'admin',
      name: 'System Administrator',
    };

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedUser));

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(
        JSON.stringify(savedUser)
      );
    });
  });

  test('successfully logs in admin user', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await user.click(screen.getByTestId('login-admin'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      const userData = JSON.parse(
        screen.getByTestId('user').textContent || '{}'
      );
      expect(userData.email).toBe('admin@records.gov');
      expect(userData.role).toBe('admin');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'auth_user',
      expect.stringContaining('admin@records.gov')
    );
  });

  test('successfully logs in staff user', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await user.click(screen.getByTestId('login-staff'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      const userData = JSON.parse(
        screen.getByTestId('user').textContent || '{}'
      );
      expect(userData.email).toBe('staff@records.gov');
      expect(userData.role).toBe('staff');
    });
  });

  test('fails login with invalid credentials', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await user.click(screen.getByTestId('login-invalid'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('logs out user successfully', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // First login
    await act(async () => {
      await user.click(screen.getByTestId('login-admin'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Then logout
    await act(async () => {
      await user.click(screen.getByTestId('logout'));
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
  });

  test('handles corrupted localStorage data gracefully', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValue('invalid-json');

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing saved user:',
      expect.any(Error)
    );
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');

    consoleSpy.mockRestore();
  });

  test('useAuth throws error when used outside AuthProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
