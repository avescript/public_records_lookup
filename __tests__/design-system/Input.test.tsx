import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Input } from '@/components/design-system/Input';

// Mock theme for testing
const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders input with label', () => {
      render(
        <TestWrapper>
          <Input label='Test Input' />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
      render(
        <TestWrapper>
          <Input placeholder='Enter text here' />
        </TestWrapper>
      );

      expect(
        screen.getByPlaceholderText('Enter text here')
      ).toBeInTheDocument();
    });

    it('renders input with helper text', () => {
      render(
        <TestWrapper>
          <Input helperText='This is helper text' />
        </TestWrapper>
      );

      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(
          <TestWrapper>
            <Input size={size} label={`${size} Input`} />
          </TestWrapper>
        );

        expect(screen.getByLabelText(`${size} Input`)).toBeInTheDocument();
      });
    });
  });

  describe('States', () => {
    const states = ['default', 'error', 'warning', 'success'] as const;

    states.forEach(state => {
      it(`renders ${state} state correctly`, () => {
        render(
          <TestWrapper>
            <Input state={state} label={`${state} Input`} />
          </TestWrapper>
        );

        expect(screen.getByLabelText(`${state} Input`)).toBeInTheDocument();
      });
    });

    it('renders disabled state', () => {
      render(
        <TestWrapper>
          <Input disabled label='Disabled Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Disabled Input');
      expect(input).toBeDisabled();
    });

    it('shows error state with error prop', () => {
      render(
        <TestWrapper>
          <Input error label='Error Input' helperText='Error message' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Error Input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    const TestIcon = () => (
      <svg data-testid='test-icon'>
        <circle />
      </svg>
    );

    it('renders with start icon', () => {
      render(
        <TestWrapper>
          <Input startIcon={<TestIcon />} label='Input with start icon' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Input with start icon')
      ).toBeInTheDocument();
    });

    it('renders with end icon', () => {
      render(
        <TestWrapper>
          <Input endIcon={<TestIcon />} label='Input with end icon' />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Input with end icon')).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    it('shows character count when enabled', () => {
      render(
        <TestWrapper>
          <Input showCharCount maxLength={10} label='Character Count Input' />
        </TestWrapper>
      );

      expect(screen.getByText('0/10')).toBeInTheDocument();
    });

    it('updates character count on input', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input showCharCount maxLength={10} label='Character Count Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Character Count Input');
      await user.type(input, 'Hello');

      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('prevents input when max length is reached', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input maxLength={5} label='Max Length Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText(
        'Max Length Input'
      ) as HTMLInputElement;
      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello');
    });

    it('shows character count without max length', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input showCharCount label='Character Count Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Character Count Input');
      await user.type(input, 'Test');

      expect(screen.getByText('4 characters')).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('renders multiline input', () => {
      render(
        <TestWrapper>
          <Input multiline label='Multiline Input' />
        </TestWrapper>
      );

      const textarea = screen.getByLabelText('Multiline Input');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('handles different input types', () => {
      const types = ['text', 'email', 'password', 'number'] as const;

      types.forEach(type => {
        const { unmount } = render(
          <TestWrapper>
            <Input type={type} label={`${type} Input`} />
          </TestWrapper>
        );

        const input = screen.getByLabelText(`${type} Input`);
        expect(input).toHaveAttribute('type', type);

        unmount();
      });
    });
  });

  describe('Value Management', () => {
    it('handles controlled input', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input
            value='controlled'
            onChange={handleChange}
            label='Controlled Input'
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText(
        'Controlled Input'
      ) as HTMLInputElement;
      expect(input.value).toBe('controlled');

      await user.clear(input);
      await user.type(input, 'new value');

      expect(handleChange).toHaveBeenCalled();
    });

    it('handles uncontrolled input', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input defaultValue='uncontrolled' label='Uncontrolled Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText(
        'Uncontrolled Input'
      ) as HTMLInputElement;
      expect(input.value).toBe('uncontrolled');

      await user.clear(input);
      await user.type(input, 'new value');

      expect(input.value).toBe('new value');
    });

    it('calls onChange callback', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Input onChange={handleChange} label='Callback Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Callback Input');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalledTimes(4); // Once per character
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(
        <TestWrapper>
          <Input label='Accessible Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Accessible Input');
      expect(input).toBeInTheDocument();
    });

    it('associates helper text with input', () => {
      render(
        <TestWrapper>
          <Input
            label='Input with helper'
            helperText='Helper text'
            id='helper-input'
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Input with helper');
      expect(input).toHaveAttribute('aria-describedby', 'helper-input-helper');
    });

    it('sets aria-invalid for error state', () => {
      render(
        <TestWrapper>
          <Input error label='Error Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Error Input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div>
            <Input label='First Input' />
            <Input label='Second Input' />
          </div>
        </TestWrapper>
      );

      await user.tab();
      expect(screen.getByLabelText('First Input')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Second Input')).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value', () => {
      render(
        <TestWrapper>
          <Input value='' label='Empty Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Empty Input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();

      render(
        <TestWrapper>
          <Input ref={ref} label='Ref Input' />
        </TestWrapper>
      );

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('handles rapid typing', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <TestWrapper>
          <Input onChange={handleChange} label='Rapid Type Input' />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Rapid Type Input');
      await user.type(input, 'rapid typing test', { delay: 1 });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('works with form submission', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <form onSubmit={handleSubmit}>
            <Input name='test-input' label='Form Input' />
            <button type='submit'>Submit</button>
          </form>
        </TestWrapper>
      );

      const input = screen.getByLabelText('Form Input');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      await user.type(input, 'test value');
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('maintains focus after state changes', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            label='Focus Test Input'
          />
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const input = screen.getByLabelText('Focus Test Input');
      input.focus();

      await user.type(input, 'test');
      expect(input).toHaveFocus();
    });
  });
});
