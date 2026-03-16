// Icons for testing
import {
  Email,
  Favorite,
  LocationOn,
  MoreVert,
  Person,
  Phone,
  Settings,
  Share,
  SmartToy,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from './Button';
import { Card, CardContent, CardFooter, CardHeader } from './Card';

const meta = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Flexible card container component with variants and sub-components. Built on Material-UI Card with design system tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated', 'interactive', 'AI'],
      description: 'Card visual variant',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for interactive cards',
    },
    role: {
      control: 'text',
      description: 'ARIA role for accessibility',
    },
    tabIndex: {
      control: 'number',
      description: 'Tab index for keyboard navigation',
    },
  },
  args: {
    onClick: () => {},
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card stories
export const Default: Story = {
  args: {
    children: (
      <CardContent>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Default Card</h3>
        <p style={{ margin: 0, color: '#666' }}>
          This is a default card with basic content.
        </p>
      </CardContent>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <CardContent>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Outlined Card</h3>
        <p style={{ margin: 0, color: '#666' }}>
          This card has a visible border with no shadow.
        </p>
      </CardContent>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <CardContent>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Elevated Card</h3>
        <p style={{ margin: 0, color: '#666' }}>
          This card has a more prominent shadow for emphasis.
        </p>
      </CardContent>
    ),
  },
};

export const Interactive: Story = {
  args: {
    variant: 'interactive',
    onClick: () => {},
    children: (
      <CardContent>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Interactive Card</h3>
        <p style={{ margin: 0, color: '#666' }}>
          This card responds to hover and click interactions.
        </p>
      </CardContent>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive cards have hover effects and can be clicked. They automatically receive proper keyboard navigation support.',
      },
    },
  },
};

export const AI: Story = {
  args: {
    variant: 'AI',
    children: (
      <CardContent>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <SmartToy style={{ color: '#7C3AED' }} />
          <h3 style={{ margin: 0 }}>AI Assistant</h3>
        </div>
        <p style={{ margin: 0, color: '#666' }}>
          This card variant is designed for AI-related content and features.
        </p>
      </CardContent>
    ),
  },
};

// Card with header, content, and footer
export const FullCard: Story = {
  args: {
    children: (
      <>
        <CardHeader
          title='Card Title'
          subtitle='Card Subtitle'
          action={
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <MoreVert />
            </button>
          }
        />
        <CardContent>
          <p style={{ margin: 0, color: '#666' }}>
            This is a complete card with header, content, and footer sections.
          </p>
        </CardContent>
        <CardFooter>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size='sm' variant='outline'>
              Cancel
            </Button>
            <Button size='sm' variant='primary'>
              Save
            </Button>
          </div>
        </CardFooter>
      </>
    ),
  },
};

// Complex card examples
export const UserProfileCard: Story = {
  render: () => (
    <Card variant='outlined' style={{ maxWidth: '300px' }}>
      <CardHeader
        title='John Doe'
        subtitle='Software Engineer'
        action={
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <MoreVert />
          </button>
        }
      />
      <CardContent>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Email style={{ fontSize: '1rem', color: '#666' }} />
            <span style={{ fontSize: '0.875rem' }}>john.doe@example.com</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone style={{ fontSize: '1rem', color: '#666' }} />
            <span style={{ fontSize: '0.875rem' }}>+1 (555) 123-4567</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LocationOn style={{ fontSize: '1rem', color: '#666' }} />
            <span style={{ fontSize: '0.875rem' }}>San Francisco, CA</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <Button size='sm' variant='outline' fullWidth>
            Message
          </Button>
          <Button size='sm' variant='primary' fullWidth>
            Connect
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example of a user profile card with contact information and action buttons.',
      },
    },
  },
};

export const StatisticsCard: Story = {
  render: () => (
    <Card variant='elevated' style={{ minWidth: '200px' }}>
      <CardContent>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <h4
            style={{
              margin: 0,
              color: '#666',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
            }}
          >
            Total Sales
          </h4>
          <TrendingUp style={{ color: '#10B981', fontSize: '1.25rem' }} />
        </div>
        <div
          style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}
        >
          $47,382
        </div>
        <div style={{ fontSize: '0.875rem', color: '#10B981' }}>
          +12.5% from last month
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example of a statistics card displaying key metrics with visual indicators.',
      },
    },
  },
};

export const AIInsightCard: Story = {
  render: () => (
    <Card variant='AI' style={{ maxWidth: '400px' }}>
      <CardHeader
        title='AI Recommendation'
        subtitle='Based on your recent activity'
        action={<SmartToy style={{ color: '#7C3AED' }} />}
      />
      <CardContent>
        <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
          The AI assistant has identified potential improvements to optimize
          your workflow efficiency.
        </p>
        <div
          style={{
            background: '#F3F4F6',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #E5E7EB',
          }}
        >
          <strong style={{ fontSize: '0.875rem' }}>Suggested Action:</strong>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Consider automating the document review process to save
            approximately 2.5 hours per week.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size='sm' variant='outline'>
            Dismiss
          </Button>
          <Button size='sm' variant='primary'>
            Apply Suggestion
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example of an AI-themed card for displaying intelligent recommendations and insights.',
      },
    },
  },
};

// Interactive card with complex behavior
export const InteractiveNotificationCard: Story = {
  render: () => (
    <Card
      variant='interactive'
      onClick={() => {}}
      style={{ maxWidth: '350px', cursor: 'pointer' }}
      role='button'
      tabIndex={0}
    >
      <CardContent>
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
        >
          <Warning
            style={{ color: '#F59E0B', fontSize: '1.5rem', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
              System Maintenance Scheduled
            </h4>
            <p
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                color: '#666',
              }}
            >
              Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM
              EST.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>
              2 hours ago
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive notification card that responds to clicks and keyboard navigation.',
      },
    },
  },
};

// Card showcase
export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        maxWidth: '1000px',
      }}
    >
      <Card variant='default'>
        <CardContent>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Default</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            Standard card with subtle shadow
          </p>
        </CardContent>
      </Card>

      <Card variant='outlined'>
        <CardContent>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Outlined</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            Card with border, no shadow
          </p>
        </CardContent>
      </Card>

      <Card variant='elevated'>
        <CardContent>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Elevated</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            Card with prominent shadow
          </p>
        </CardContent>
      </Card>

      <Card variant='interactive' onClick={() => {}}>
        <CardContent>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Interactive</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            Clickable with hover effects
          </p>
        </CardContent>
      </Card>

      <Card variant='AI'>
        <CardContent>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <SmartToy style={{ color: '#7C3AED', fontSize: '1.25rem' }} />
            <h4 style={{ margin: 0 }}>AI</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            AI-themed variant
          </p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'All card variants displayed together for easy comparison.',
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
        gap: '1rem',
        maxWidth: '500px',
      }}
    >
      <h3>Accessibility Features</h3>

      <Card
        variant='interactive'
        onClick={() => {}}
        role='button'
        tabIndex={0}
        aria-label='Clickable notification card'
      >
        <CardContent>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>
            Accessible Interactive Card
          </h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            This card includes proper ARIA attributes and keyboard navigation
            support.
          </p>
        </CardContent>
      </Card>

      <Card variant='outlined'>
        <CardHeader
          title='Card with Semantic Structure'
          subtitle='Proper heading hierarchy'
        />
        <CardContent>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            Cards maintain proper semantic structure with headings and content
            organization.
          </p>
        </CardContent>
      </Card>

      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        All cards support keyboard navigation when interactive, include proper
        ARIA attributes, and maintain semantic HTML structure for screen
        readers.
      </p>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Demonstrates accessibility features including keyboard navigation, ARIA attributes, and semantic structure.',
      },
    },
  },
};
