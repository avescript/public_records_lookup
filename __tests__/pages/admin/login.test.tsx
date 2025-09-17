import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from '../../../src/app/admin/login/page';

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

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    window.location.href = '';
  });

  test('renders login form with all elements', () => {
    render(<LoginPage />);

    // Check for login form elements
    expect(screen.getByText('Staff Login')).toBeInTheDocument();
    expect(screen.getByText('Access the Public Records Management System')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('displays development credentials', () => {
    render(<LoginPage />);

    expect(screen.getByText('Development Credentials:')).toBeInTheDocument();
    expect(screen.getByText(/admin@records.gov \/ admin123/)).toBeInTheDocument();
    expect(screen.getByText(/staff@records.gov \/ staff123/)).toBeInTheDocument();
    expect(screen.getByText(/legal@records.gov \/ legal123/)).toBeInTheDocument();
  });

  test('shows back to public portal link', () => {
    render(<LoginPage />);

    const backLink = screen.getByRole('link', { name: /back to public portal/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  test('successfully logs in with valid admin credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@records.gov');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });

    // Should redirect to admin staff page
    await waitFor(() => {
      expect(window.location.href).toBe('/admin/staff');
    });

    // Should save user to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'auth_user',
      expect.stringContaining('admin@records.gov')
    );
  });

  test('successfully logs in with valid staff credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'staff@records.gov');
    await user.type(passwordInput, 'staff123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.location.href).toBe('/admin/staff');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'auth_user',
      expect.stringContaining('staff@records.gov')
    );
  });

  test('shows error message for invalid credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    expect(window.location.href).toBe('');
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('shows error for wrong password with valid email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@records.gov');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  test('requires email and password fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();

    // Try to submit without filling fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Form should not submit (browser validation will prevent it)
    expect(window.location.href).toBe('');
  });

  test('clears error message on new login attempt', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // First failed attempt
    await user.type(emailInput, 'invalid@test.com');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Clear and try again
    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'admin@records.gov');
    await user.type(passwordInput, 'admin123');
    
    // Error should be cleared before submitting
    expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
  });

  test('disables submit button during loading', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@records.gov');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  test('has proper form accessibility', () => {
    render(<LoginPage />);

    const form = screen.getByRole('form', { hidden: true });
    expect(form).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoFocus');

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('login icon is displayed', () => {
    render(<LoginPage />);

    // Check for login icon (should be rendered by MUI LoginIcon)
    const loginIcon = document.querySelector('[data-testid="LoginIcon"]');
    expect(loginIcon).toBeInTheDocument();
  });
});