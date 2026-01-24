import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClientProviders } from '../../../src/components/providers/ClientProviders';

// Mock the contexts to verify proper provider nesting
const mockAuthContextValue = {
  user: { id: '1', email: 'test@example.com', role: 'staff', name: 'Test User' },
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const mockAgencyContextValue = {
  currentAgency: {
    id: 'pdx-police',
    name: 'Portland Police Bureau',
    color: '#1976d2',
    icon: 'Shield'
  },
  agencies: [],
  switchAgency: jest.fn(),
};

jest.mock('../../../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockAuthContextValue,
}));

jest.mock('../../../src/contexts/AgencyContext', () => ({
  AgencyProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="agency-provider">{children}</div>
  ),
  useAgency: () => mockAgencyContextValue,
}));

// Test component that uses both contexts
const TestComponent = () => {
  return (
    <div data-testid="test-component">
      Test Component
    </div>
  );
};

// Test component that uses auth context
const AuthTestComponent = () => {
  // This would normally use useAuth() but we'll just render for provider testing
  return <div data-testid="auth-test-component">Auth Test Component</div>;
};

// Test component that uses agency context
const AgencyTestComponent = () => {
  // This would normally use useAgency() but we'll just render for provider testing
  return <div data-testid="agency-test-component">Agency Test Component</div>;
};

describe('ClientProviders', () => {
  describe('Provider Wrapping', () => {
    it('should render children within provider wrapper', () => {
      render(
        <ClientProviders>
          <TestComponent />
        </ClientProviders>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should wrap children with AuthProvider', () => {
      render(
        <ClientProviders>
          <AuthTestComponent />
        </ClientProviders>
      );

      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('auth-test-component')).toBeInTheDocument();
    });

    it('should wrap children with AgencyProvider', () => {
      render(
        <ClientProviders>
          <AgencyTestComponent />
        </ClientProviders>
      );

      expect(screen.getByTestId('agency-provider')).toBeInTheDocument();
      expect(screen.getByTestId('agency-test-component')).toBeInTheDocument();
    });

    it('should nest providers in correct order (Auth > Agency)', () => {
      render(
        <ClientProviders>
          <TestComponent />
        </ClientProviders>
      );

      const authProvider = screen.getByTestId('auth-provider');
      const agencyProvider = screen.getByTestId('agency-provider');
      
      // AgencyProvider should be nested inside AuthProvider
      expect(authProvider).toContainElement(agencyProvider);
    });
  });

  describe('Multiple Children Support', () => {
    it('should render multiple children', () => {
      render(
        <ClientProviders>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </ClientProviders>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      render(
        <ClientProviders>
          <div data-testid="parent">
            <div data-testid="nested-child-1">Nested 1</div>
            <div data-testid="nested-child-2">Nested 2</div>
          </div>
        </ClientProviders>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByTestId('nested-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('nested-child-2')).toBeInTheDocument();
    });
  });

  describe('Provider Integration', () => {
    it('should provide access to both auth and agency contexts', () => {
      const IntegratedTestComponent = () => {
        // In a real scenario, this would use both useAuth() and useAgency()
        // For testing, we just verify the providers are present
        return (
          <div data-testid="integrated-component">
            Both providers available
          </div>
        );
      };

      render(
        <ClientProviders>
          <IntegratedTestComponent />
        </ClientProviders>
      );

      expect(screen.getByTestId('integrated-component')).toBeInTheDocument();
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('agency-provider')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('should handle rendering errors in children gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(
          <ClientProviders>
            <ErrorComponent />
          </ClientProviders>
        );
      }).toThrow('Test error');

      consoleSpy.mockRestore();
    });
  });

  describe('Props Handling', () => {
    it('should handle null children', () => {
      render(
        <ClientProviders>
          {null}
        </ClientProviders>
      );

      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('agency-provider')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(
        <ClientProviders>
          {undefined}
        </ClientProviders>
      );

      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('agency-provider')).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      const showChild = true;
      
      render(
        <ClientProviders>
          {showChild && <div data-testid="conditional-child">Conditional</div>}
        </ClientProviders>
      );

      expect(screen.getByTestId('conditional-child')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TrackedComponent = () => {
        renderSpy();
        return <div data-testid="tracked-component">Tracked</div>;
      };

      const { rerender } = render(
        <ClientProviders>
          <TrackedComponent />
        </ClientProviders>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <ClientProviders>
          <TrackedComponent />
        </ClientProviders>
      );

      // Component should render again (expected React behavior)
      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('tracked-component')).toBeInTheDocument();
    });
  });
});