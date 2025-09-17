import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePathname } from 'next/navigation';
import { PublicLayout } from '../../../src/components/layouts/PublicLayout';

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

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('PublicLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header with site title and navigation', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    // Check site title
    expect(screen.getByText('Public Records Portal')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByRole('link', { name: 'Submit Request' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Track Request' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Staff Login' })).toBeInTheDocument();
  });

  test('renders children content', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div data-testid="test-content">Test Content</div>
      </PublicLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders footer with copyright', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    expect(screen.getByText('© 2024 Public Records Portal. All rights reserved.')).toBeInTheDocument();
  });

  test('highlights active navigation link for home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    const submitButton = screen.getByRole('link', { name: 'Submit Request' });
    expect(submitButton).toHaveStyle('font-weight: bold');
    
    const trackButton = screen.getByRole('link', { name: 'Track Request' });
    expect(trackButton).toHaveStyle('font-weight: normal');
  });

  test('highlights active navigation link for track page', () => {
    mockUsePathname.mockReturnValue('/track');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    const submitButton = screen.getByRole('link', { name: 'Submit Request' });
    expect(submitButton).toHaveStyle('font-weight: normal');
    
    const trackButton = screen.getByRole('link', { name: 'Track Request' });
    expect(trackButton).toHaveStyle('font-weight: bold');
  });

  test('contains correct navigation links', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    // Check href attributes
    expect(screen.getByRole('link', { name: 'Submit Request' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Track Request' })).toHaveAttribute('href', '/track');
    expect(screen.getByRole('link', { name: 'Staff Login' })).toHaveAttribute('href', '/admin/login');
  });

  test('site title links to home page', () => {
    mockUsePathname.mockReturnValue('/track');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    const titleLink = screen.getByRole('link', { name: 'Public Records Portal' });
    expect(titleLink).toHaveAttribute('href', '/');
  });

  test('staff login button has outlined variant', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div>Test Content</div>
      </PublicLayout>
    );

    const staffLoginButton = screen.getByRole('link', { name: 'Staff Login' });
    // Check if it has the outlined variant styling (MUI adds specific classes)
    expect(staffLoginButton).toHaveClass('MuiButton-outlined');
  });

  test('layout has proper structure with header, main, and footer', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(
      <PublicLayout>
        <div data-testid="content">Test Content</div>
      </PublicLayout>
    );

    // Check for header (AppBar)
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('content'));

    // Check for footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});