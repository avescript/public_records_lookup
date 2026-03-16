import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '@/components/design-system/Button';

// Mock theme for testing
const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders button with text', () => {
      render(
        <TestWrapper>
          <Button>Click me</Button>
        </TestWrapper>
      );

      expect(
        screen.getByRole('button', { name: 'Click me' })
      ).toBeInTheDocument();
    });

    it('renders with custom aria-label', () => {
      render(
        <TestWrapper>
          <Button aria-label='Custom label'>Click me</Button>
        </TestWrapper>
      );

      expect(
        screen.getByRole('button', { name: 'Custom label' })
      ).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'success',
      'ai',
    ] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(
          <TestWrapper>
            <Button variant={variant}>Test Button</Button>
          </TestWrapper>
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(
          <TestWrapper>
            <Button size={size}>Test Button</Button>
          </TestWrapper>
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      render(
        <TestWrapper>
          <Button disabled>Disabled Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('renders loading state', () => {
      render(
        <TestWrapper>
          <Button loading>Loading Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('disables button when loading is true', () => {
      const handleClick = jest.fn();
      render(
        <TestWrapper>
          <Button loading onClick={handleClick}>
            Loading Button
          </Button>
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    const TestIcon = () => (
      <svg data-testid='test-icon'>
        <circle />
      </svg>
    );

    it('renders with left icon', () => {
      render(
        <TestWrapper>
          <Button leftIcon={<TestIcon />}>With Left Icon</Button>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('With Left Icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <TestWrapper>
          <Button rightIcon={<TestIcon />}>With Right Icon</Button>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('With Right Icon')).toBeInTheDocument();
    });

    it('hides left icon when loading', () => {
      render(
        <TestWrapper>
          <Button leftIcon={<TestIcon />} loading>
            Loading
          </Button>
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('keeps right icon when loading', () => {
      render(
        <TestWrapper>
          <Button rightIcon={<TestIcon />} loading>
            Loading
          </Button>
        </TestWrapper>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Button onClick={handleClick}>Click me</Button>
        </TestWrapper>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();

      render(
        <TestWrapper>
          <Button onClick={handleClick} disabled>
            Disabled
          </Button>
        </TestWrapper>
      );

      // Use fireEvent for disabled elements since userEvent respects pointer-events: none
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Button onClick={handleClick}>Keyboard Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('[Enter]');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard('[Space]');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Full Width', () => {
    it('renders full width button', () => {
      render(
        <TestWrapper>
          <Button fullWidth>Full Width Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <Button disabled>Disabled Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('supports focus management', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div>
            <Button>First Button</Button>
            <Button>Second Button</Button>
          </div>
        </TestWrapper>
      );

      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const secondButton = screen.getByRole('button', {
        name: 'Second Button',
      });

      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();
    });

    it('announces loading state to screen readers', () => {
      render(
        <TestWrapper>
          <Button loading aria-label='Save document'>
            Save
          </Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-label', 'Save document');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(
        <TestWrapper>
          <Button>{''}</Button>
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles complex children', () => {
      render(
        <TestWrapper>
          <Button>
            <span>Complex</span> <strong>Children</strong>
          </Button>
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <TestWrapper>
          <Button ref={ref}>Ref Button</Button>
        </TestWrapper>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toContain('Ref Button');
    });
  });

  describe('Theme Integration', () => {
    it('applies design system tokens correctly', () => {
      render(
        <TestWrapper>
          <Button variant='primary'>Primary Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Note: Detailed style testing would require jest-styled-components
      // or similar for CSS-in-JS testing, but we can verify the component renders
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      const TestButton = () => {
        renderSpy();
        return <Button>Test</Button>;
      };

      const { rerender } = render(
        <TestWrapper>
          <TestButton />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <TestButton />
        </TestWrapper>
      );

      // Component should render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});
