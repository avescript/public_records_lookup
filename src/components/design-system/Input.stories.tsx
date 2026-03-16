import { useState } from 'react';
// Icons for testing
import {
  Email,
  Lock,
  Person,
  Search,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { Input } from './Input';

const meta = {
  title: 'Design System/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible input component with validation states, character counting, and icon support. Built on Material-UI TextField with design system tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'standard'],
      description: 'Input visual variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'warning', 'success'],
      description: 'Input validation state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    multiline: {
      control: 'boolean',
      description: 'Enable multiline text input',
    },
    showCharCount: {
      control: 'boolean',
      description: 'Show character count',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character count',
    },
    startIcon: {
      control: false,
      description: 'Icon to display at the start',
    },
    endIcon: {
      control: false,
      description: 'Icon to display at the end',
    },
    label: {
      control: 'text',
      description: 'Input label',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below input',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler',
    },
  },
  args: {
    onChange: () => {},
    label: 'Label',
    placeholder: 'Enter text...',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    label: 'Default Input',
    placeholder: 'Enter some text...',
  },
};

// Variant stories
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    label: 'Outlined Input',
    placeholder: 'Outlined variant',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Filled Input',
    placeholder: 'Filled variant',
  },
};

export const Standard: Story = {
  args: {
    variant: 'standard',
    label: 'Standard Input',
    placeholder: 'Standard variant',
  },
};

// Size stories
export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small Input',
    placeholder: 'Small size',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium Input',
    placeholder: 'Medium size',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large Input',
    placeholder: 'Large size',
  },
};

// State stories
export const DefaultState: Story = {
  args: {
    state: 'default',
    label: 'Default State',
    placeholder: 'Normal input state',
  },
};

export const ErrorState: Story = {
  args: {
    state: 'error',
    label: 'Error Input',
    placeholder: 'This field has an error',
    helperText: 'This field is required',
  },
};

export const WarningState: Story = {
  args: {
    state: 'warning',
    label: 'Warning Input',
    placeholder: 'This field has a warning',
    helperText: 'Please double-check this value',
  },
};

export const SuccessState: Story = {
  args: {
    state: 'success',
    label: 'Success Input',
    placeholder: 'This field is valid',
    helperText: 'Looks good!',
  },
};

// Feature stories
export const WithStartIcon: Story = {
  args: {
    startIcon: <Search />,
    label: 'Search',
    placeholder: 'Search for something...',
  },
};

export const WithEndIcon: Story = {
  args: {
    endIcon: <Email />,
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithBothIcons: Story = {
  args: {
    startIcon: <Person />,
    endIcon: <Lock />,
    label: 'Username',
    placeholder: 'Enter username',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    value: 'Disabled value',
  },
};

export const Multiline: Story = {
  args: {
    multiline: true,
    label: 'Message',
    placeholder: 'Enter your message...',
    rows: 4,
  },
};

// Character count stories
export const WithCharacterCount: Story = {
  args: {
    showCharCount: true,
    maxLength: 100,
    label: 'Tweet',
    placeholder: 'What\'s happening?',
    helperText: 'Share your thoughts',
  },
};

export const CharacterCountNoLimit: Story = {
  args: {
    showCharCount: true,
    label: 'Description',
    placeholder: 'Describe the item...',
  },
};

// Interactive stories with state management
export const ControlledInput: Story = {
  render: args => {
    const [value, setValue] = useState('');

    return (
      <Input
        {...args}
        value={value}
        onChange={e => {
          setValue(e.target.value);
          args.onChange?.(e);
        }}
      />
    );
  },
  args: {
    label: 'Controlled Input',
    placeholder: 'Type something...',
    helperText: 'This input is controlled by React state',
  },
};

export const PasswordToggle: Story = {
  render: args => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        {...args}
        type={showPassword ? 'text' : 'password'}
        endIcon={
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </button>
        }
      />
    );
  },
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    helperText: 'Click the eye icon to toggle visibility',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive password input with toggle visibility functionality.',
      },
    },
  },
};

// Comprehensive showcase
export const AllVariantsAndStates: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        minWidth: '400px',
      }}
    >
      <h3>Input Variants</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          variant='outlined'
          label='Outlined'
          placeholder='Outlined variant'
        />
        <Input variant='filled' label='Filled' placeholder='Filled variant' />
        <Input
          variant='standard'
          label='Standard'
          placeholder='Standard variant'
        />
      </div>

      <h3>Input Sizes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input size='sm' label='Small' placeholder='Small size' />
        <Input size='md' label='Medium' placeholder='Medium size' />
        <Input size='lg' label='Large' placeholder='Large size' />
      </div>

      <h3>Validation States</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input state='default' label='Default' placeholder='Default state' />
        <Input
          state='success'
          label='Success'
          placeholder='Valid input'
          helperText='Looks good!'
        />
        <Input
          state='warning'
          label='Warning'
          placeholder='Warning state'
          helperText='Please verify this value'
        />
        <Input
          state='error'
          label='Error'
          placeholder='Invalid input'
          helperText='This field is required'
        />
      </div>

      <h3>With Icons</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input startIcon={<Search />} label='Search' placeholder='Search...' />
        <Input
          endIcon={<Email />}
          label='Email'
          placeholder='Enter email'
          type='email'
        />
        <Input
          startIcon={<Person />}
          endIcon={<Lock />}
          label='Username'
          placeholder='Enter username'
        />
      </div>

      <h3>Special Features</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          showCharCount
          maxLength={50}
          label='Limited Input'
          placeholder='Max 50 characters'
        />
        <Input
          multiline
          rows={3}
          label='Multiline'
          placeholder='Enter multiple lines...'
        />
        <Input
          disabled
          label='Disabled'
          placeholder='This is disabled'
          value='Disabled value'
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'All input variants, sizes, states, and features in one comprehensive view.',
      },
    },
  },
};

// Accessibility demonstration
export const AccessibilityDemo: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        minWidth: '400px',
      }}
    >
      <h3>Accessibility Features</h3>

      <Input
        label='Required Field'
        required
        placeholder='This field is required'
        helperText='Required fields are properly marked'
        aria-describedby='required-help'
      />

      <Input
        state='error'
        label='Error Field'
        placeholder='Invalid input'
        helperText='Error messages are associated with the input'
        aria-invalid='true'
        aria-describedby='error-help'
      />

      <Input
        label='Screen Reader Description'
        placeholder='With additional description'
        aria-describedby='description-help'
        helperText='This input has additional context for screen readers'
      />

      <p style={{ fontSize: '0.875rem', color: '#666', maxWidth: '500px' }}>
        All inputs include proper ARIA attributes, label associations, and
        keyboard navigation support. Error states are properly announced to
        screen readers, and required fields are clearly marked.
      </p>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Demonstrates accessibility features including ARIA attributes, label associations, and screen reader support.',
      },
    },
  },
};
