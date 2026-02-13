// Icons for testing
import { Add, ArrowForward, Delete, Download } from '@mui/icons-material';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from './Button';

const meta = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible button component with multiple variants, states, and sizes. Built on Material-UI with design system tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'danger',
        'success',
        'AI',
      ],
      description: 'Button visual variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    startIcon: {
      control: false,
      description: 'Icon to display at the start',
    },
    endIcon: {
      control: false,
      description: 'Icon to display at the end',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
  args: {
    onClick: action('clicked'),
    children: 'Button',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

// Variant stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

export const AI: Story = {
  args: {
    variant: 'AI',
    children: 'AI Assistant',
  },
};

// Size stories
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

// State stories
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// Icon stories
export const WithStartIcon: Story = {
  args: {
    startIcon: <Download />,
    children: 'Download',
  },
};

export const WithEndIcon: Story = {
  args: {
    endIcon: <ArrowForward />,
    children: 'Next',
  },
};

export const WithBothIcons: Story = {
  args: {
    startIcon: <Add />,
    endIcon: <ArrowForward />,
    children: 'Add and Continue',
  },
};

// Complex stories
export const LoadingWithIcon: Story = {
  args: {
    loading: true,
    startIcon: <Download />,
    children: 'Downloading...',
  },
};

export const DangerWithIcon: Story = {
  args: {
    variant: 'danger',
    startIcon: <Delete />,
    children: 'Delete Item',
  },
};

// Playground story for all combinations
export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <h3>Button Variants</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant='primary'>Primary</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='outline'>Outline</Button>
        <Button variant='ghost'>Ghost</Button>
        <Button variant='danger'>Danger</Button>
        <Button variant='success'>Success</Button>
        <Button variant='AI'>AI</Button>
      </div>

      <h3>Button Sizes</h3>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Button size='sm'>Small</Button>
        <Button size='md'>Medium</Button>
        <Button size='lg'>Large</Button>
      </div>

      <h3>Button States</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button>Normal</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>

      <h3>Buttons with Icons</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button startIcon={<Download />}>Download</Button>
        <Button endIcon={<ArrowForward />}>Continue</Button>
        <Button startIcon={<Add />} endIcon={<ArrowForward />}>
          Add & Continue
        </Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'All button variants, sizes, states, and icon combinations in one view for easy comparison.',
      },
    },
  },
};

// Accessibility story
export const AccessibilityDemo: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <h3>Accessibility Features</h3>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button aria-label='Save document'>
          <Download />
        </Button>
        <Button aria-describedby='tooltip-help'>Need Help?</Button>
        <Button disabled aria-label='Action not available'>
          Disabled Action
        </Button>
      </div>

      <p style={{ fontSize: '0.875rem', color: '#666', maxWidth: '500px' }}>
        All buttons include proper ARIA labels, keyboard navigation support, and
        focus management. Disabled buttons are properly announced to screen
        readers. Icon-only buttons should include aria-label.
      </p>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Demonstrates accessibility features including ARIA labels, keyboard navigation, and screen reader support.',
      },
    },
  },
};
