import type { Meta, StoryObj } from '@storybook/nextjs';

import { Radio, RadioGroup } from './Radio';

const meta = {
  title: 'Design System/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Radio components provide consistent way to handle single-selection choices.
Includes both individual Radio components and RadioGroup for managing multiple options.
Built with Material-UI foundation and design system tokens.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual variant of the radio buttons',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size variant',
    },
    direction: {
      control: 'select',
      options: ['row', 'column'],
      description: 'Layout direction',
    },
    error: {
      control: 'boolean',
      description: 'Error state styling',
    },
    required: {
      control: 'boolean',
      description: 'Whether selection is required (shows asterisk)',
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample options for stories
const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const detailedOptions = [
  {
    value: 'basic',
    label: 'Basic Plan',
    helperText: '$10/month - Perfect for individuals',
  },
  {
    value: 'pro',
    label: 'Pro Plan',
    helperText: '$25/month - Great for small teams',
  },
  {
    value: 'enterprise',
    label: 'Enterprise Plan',
    helperText: '$100/month - Full features for large organizations',
  },
];

const disabledOptions = [
  { value: 'available', label: 'Available Option' },
  { value: 'disabled', label: 'Disabled Option', disabled: true },
  { value: 'another', label: 'Another Available Option' },
];

// Basic radio group variants
export const Default: Story = {
  args: {
    label: 'Choose an option',
    options: basicOptions,
    value: 'option1',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Select your plan',
    options: detailedOptions,
    helperText: 'You can change your plan at any time',
    value: 'pro',
  },
};

// Layout directions
export const ColumnLayout: Story = {
  args: {
    label: 'Vertical layout',
    options: basicOptions,
    direction: 'column',
  },
};

export const RowLayout: Story = {
  args: {
    label: 'Horizontal layout',
    options: basicOptions,
    direction: 'row',
  },
};

// Size variants
export const SmallSize: Story = {
  args: {
    label: 'Small radio group',
    options: basicOptions,
    size: 'small',
  },
};

export const MediumSize: Story = {
  args: {
    label: 'Medium radio group',
    options: basicOptions,
    size: 'medium',
  },
};

export const LargeSize: Story = {
  args: {
    label: 'Large radio group',
    options: basicOptions,
    size: 'large',
  },
};

// Variant styles
export const PrimaryVariant: Story = {
  args: {
    label: 'Primary variant',
    options: basicOptions,
    variant: 'primary',
    value: 'option2',
  },
};

export const SecondaryVariant: Story = {
  args: {
    label: 'Secondary variant',
    options: basicOptions,
    variant: 'secondary',
    value: 'option2',
  },
};

// States
export const Required: Story = {
  args: {
    label: 'Required selection',
    options: basicOptions,
    required: true,
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Choose your preference',
    options: basicOptions,
    error: true,
    errorMessage: 'Please select an option to continue',
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Some options disabled',
    options: disabledOptions,
    helperText: 'Some options may not be available',
  },
};

// Without label
export const WithoutLabel: Story = {
  args: {
    options: basicOptions,
    helperText: 'Radio group without main label',
  },
};

// Individual Radio component stories
export const SingleRadio: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Radio label='Individual radio button' value='single' />
        <Radio label='Another radio' value='another' />
        <Radio label='Disabled radio' value='disabled' disabled />
      </div>
    );
  },
};

// Complex interactive example
export const InteractiveExample: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <RadioGroup
          label='Notification Preferences'
          options={[
            {
              value: 'all',
              label: 'All notifications',
              helperText: 'Receive everything',
            },
            {
              value: 'important',
              label: 'Important only',
              helperText: 'Only critical updates',
            },
            {
              value: 'none',
              label: 'None',
              helperText: 'Turn off all notifications',
            },
          ]}
          value='important'
        />

        <RadioGroup
          label='Theme Preference'
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System default' },
          ]}
          direction='row'
          variant='secondary'
        />
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <RadioGroup
          label='Small size'
          options={basicOptions}
          size='small'
          direction='row'
        />
        <RadioGroup
          label='Medium size'
          options={basicOptions}
          size='medium'
          direction='row'
        />
        <RadioGroup
          label='Large size'
          options={basicOptions}
          size='large'
          direction='row'
        />
      </div>
    );
  },
};
