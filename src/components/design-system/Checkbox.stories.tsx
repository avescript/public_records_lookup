import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'Design System/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Checkbox component provides a consistent way to handle binary selections.
Built with Material-UI foundation and design system tokens for consistent theming.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual variant of the checkbox',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size variant',
    },
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether checkbox is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Error state styling',
    },
    required: {
      control: 'boolean',
      description: 'Whether checkbox is required (shows asterisk)',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic checkbox variants
export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Already checked',
    checked: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Subscribe to newsletter',
    helperText: 'You can unsubscribe at any time',
  },
};

// Size variants
export const SmallSize: Story = {
  args: {
    label: 'Small checkbox',
    size: 'small',
  },
};

export const MediumSize: Story = {
  args: {
    label: 'Medium checkbox',
    size: 'medium',
  },
};

export const LargeSize: Story = {
  args: {
    label: 'Large checkbox',
    size: 'large',
  },
};

// Variant styles
export const PrimaryVariant: Story = {
  args: {
    label: 'Primary checkbox',
    variant: 'primary',
    checked: true,
  },
};

export const SecondaryVariant: Story = {
  args: {
    label: 'Secondary checkbox',
    variant: 'secondary',
    checked: true,
  },
};

// States
export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled & checked',
    disabled: true,
    checked: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Required field',
    required: true,
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Terms acceptance',
    error: true,
    helperText: 'You must accept the terms to continue',
  },
};

// Without label (standalone)
export const WithoutLabel: Story = {
  args: {
    helperText: 'Standalone checkbox with helper text',
  },
};

// Interactive examples
export const InteractiveGroup: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Checkbox label="Option 1" />
        <Checkbox label="Option 2" helperText="Additional information" />
        <Checkbox label="Option 3 (disabled)" disabled />
        <Checkbox label="Required option" required error helperText="This field is required" />
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Checkbox label="Small checkbox" size="small" />
        <Checkbox label="Medium checkbox" size="medium" />
        <Checkbox label="Large checkbox" size="large" />
      </div>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Checkbox label="Primary variant" variant="primary" checked />
        <Checkbox label="Secondary variant" variant="secondary" checked />
      </div>
    );
  },
};