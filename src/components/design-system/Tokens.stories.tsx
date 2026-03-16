import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import {
  borderRadius,
  colors,
  shadows,
  spacing,
  transitions,
  typography,
} from '../../theme/design-system/tokens';

const meta = {
  title: 'Design System/Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Design system tokens defining colors, typography, spacing, shadows, and other design constants used throughout the application.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Color palette showcase
export const Colors: Story = {
  render: () => (
    <div style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}>
      <h2
        style={{
          marginBottom: '2rem',
          fontFamily: typography.fontFamily.primary,
        }}
      >
        Color Palette
      </h2>

      {Object.entries(colors).map(([paletteName, palette]) => (
        <div key={paletteName} style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              marginBottom: '1rem',
              textTransform: 'capitalize',
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {paletteName}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
            }}
          >
            {Object.entries(palette).map(([shade, color]) => (
              <div
                key={shade}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: borderRadius.md,
                  border: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: color,
                    borderRadius: borderRadius.sm,
                    marginBottom: '0.5rem',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <div
                  style={{
                    fontSize: typography.fontSize.sm.size,
                    fontWeight: 'bold',
                  }}
                >
                  {shade}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.xs.size,
                    color: '#666',
                  }}
                >
                  {color}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Complete color palette with all color scales used in the design system.',
      },
    },
  },
};

// Typography showcase
export const Typography: Story = {
  render: () => (
    <div style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}>
      <h2 style={{ marginBottom: '2rem' }}>Typography Scale</h2>

      <div style={{ marginBottom: '3rem' }}>
        <h3>Font Families</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong>Primary:</strong>{' '}
            <span style={{ fontFamily: typography.fontFamily.primary }}>
              {typography.fontFamily.primary}
            </span>
          </div>
          <div>
            <strong>Secondary:</strong>{' '}
            <span style={{ fontFamily: typography.fontFamily.secondary }}>
              {typography.fontFamily.secondary}
            </span>
          </div>
          <div>
            <strong>Monospace:</strong>{' '}
            <span style={{ fontFamily: typography.fontFamily.mono }}>
              {typography.fontFamily.mono}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3>Font Sizes</h3>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {Object.entries(typography.fontSize).map(([sizeName, sizeObj]) => (
            <div
              key={sizeName}
              style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}
            >
              <div
                style={{
                  minWidth: '80px',
                  fontSize: typography.fontSize.sm.size,
                  color: '#666',
                }}
              >
                {sizeName}
              </div>
              <div
                style={{
                  fontSize: sizeObj.size,
                  lineHeight: sizeObj.lineHeight,
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
              <div
                style={{ fontSize: typography.fontSize.xs.size, color: '#888' }}
              >
                {sizeObj.size}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>Font Weights</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(typography.fontWeight).map(([weightName, weight]) => (
            <div
              key={weightName}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              <div
                style={{
                  minWidth: '80px',
                  fontSize: typography.fontSize.sm.size,
                  color: '#666',
                }}
              >
                {weightName}
              </div>
              <div
                style={{
                  fontWeight: weight,
                  fontSize: typography.fontSize.base.size,
                }}
              >
                Font weight example text
              </div>
              <div
                style={{ fontSize: typography.fontSize.xs.size, color: '#888' }}
              >
                {weight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Typography scale showing font sizes, weights, and families used throughout the design system.',
      },
    },
  },
};

// Spacing showcase
export const Spacing: Story = {
  render: () => (
    <div style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}>
      <h2 style={{ marginBottom: '2rem' }}>Spacing Scale</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(spacing).map(([spaceName, spaceValue]) => (
          <div
            key={spaceName}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <div
              style={{
                minWidth: '60px',
                fontSize: typography.fontSize.sm.size,
                color: '#666',
              }}
            >
              {spaceName}
            </div>
            <div
              style={{
                width: spaceValue,
                height: '24px',
                backgroundColor: colors.primary[500],
                borderRadius: borderRadius.xs,
              }}
            />
            <div
              style={{ fontSize: typography.fontSize.xs.size, color: '#888' }}
            >
              {spaceValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Spacing scale showing all spacing values used for margins, padding, and layout.',
      },
    },
  },
};

// Shadows showcase
export const Shadows: Story = {
  render: () => (
    <div style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}>
      <h2 style={{ marginBottom: '2rem' }}>Shadow Scale</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
        }}
      >
        {Object.entries(shadows).map(([shadowName, shadowValue]) => (
          <div key={shadowName} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'white',
                borderRadius: borderRadius.md,
                boxShadow: shadowValue,
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: typography.fontSize.sm.size,
                color: '#666',
              }}
            >
              {shadowName}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xs.size,
                color: '#888',
                wordBreak: 'break-all',
              }}
            >
              {shadowValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shadow scale showing all elevation levels used in the design system.',
      },
    },
  },
};

// Border radius showcase
export const BorderRadius: Story = {
  render: () => (
    <div style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}>
      <h2 style={{ marginBottom: '2rem' }}>Border Radius Scale</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '2rem',
        }}
      >
        {Object.entries(borderRadius).map(([radiusName, radiusValue]) => (
          <div key={radiusName} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: colors.primary[500],
                borderRadius: radiusValue,
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: typography.fontSize.sm.size,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {radiusName}
            </div>
            <div
              style={{ fontSize: typography.fontSize.xs.size, color: '#888' }}
            >
              {radiusValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Border radius scale showing all corner radius values used for rounded elements.',
      },
    },
  },
};

// Transitions showcase
export const Transitions: Story = {
  render: () => {
    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

    return (
      <div
        style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}
      >
        <h2 style={{ marginBottom: '2rem' }}>Transition Scale</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3>Duration</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {Object.entries(transitions.duration).map(
                ([durationName, durationValue]) => (
                  <div
                    key={durationName}
                    style={{
                      padding: '1rem',
                      backgroundColor: colors.neutral[50],
                      borderRadius: borderRadius.md,
                      border: '2px solid transparent',
                      cursor: 'pointer',
                      transition: `all ${durationValue} ease`,
                      transform:
                        hoveredItem === durationName
                          ? 'scale(1.05)'
                          : 'scale(1)',
                      borderColor:
                        hoveredItem === durationName
                          ? colors.primary[500]
                          : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredItem(durationName)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div
                      style={{
                        fontWeight: typography.fontWeight.medium,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {durationName}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm.size,
                        color: '#666',
                      }}
                    >
                      {durationValue}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h3>Easing</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {Object.entries(transitions.easing).map(
                ([easingName, easingValue]) => (
                  <div key={easingName} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontWeight: typography.fontWeight.medium,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {easingName}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.xs.size,
                        color: '#888',
                        wordBreak: 'break-all',
                      }}
                    >
                      {easingValue}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <p
          style={{
            marginTop: '2rem',
            fontSize: typography.fontSize.sm.size,
            color: '#666',
          }}
        >
          Hover over the duration examples to see the transition effects in
          action.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Transition scale showing duration and easing values used for animations and interactions.',
      },
    },
  },
};

// All tokens overview
export const Overview: Story = {
  render: () => (
    <div style={{ padding: '2rem', fontFamily: typography.fontFamily.primary }}>
      <h1 style={{ marginBottom: '2rem' }}>Design System Tokens</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: '1px solid ' + colors.neutral[200],
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: colors.primary[600] }}>
            Colors
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm.size,
              color: '#666',
              margin: 0,
            }}
          >
            Comprehensive color palette with primary, secondary, semantic, and
            neutral colors.
          </p>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: '1px solid ' + colors.neutral[200],
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: colors.primary[600] }}>
            Typography
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm.size,
              color: '#666',
              margin: 0,
            }}
          >
            Font families, sizes, weights, and line heights for consistent text
            hierarchy.
          </p>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: '1px solid ' + colors.neutral[200],
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: colors.primary[600] }}>
            Spacing
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm.size,
              color: '#666',
              margin: 0,
            }}
          >
            Consistent spacing scale for margins, padding, and layout
            components.
          </p>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: '1px solid ' + colors.neutral[200],
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: colors.primary[600] }}>
            Shadows
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm.size,
              color: '#666',
              margin: 0,
            }}
          >
            Elevation system using shadows to create visual hierarchy and depth.
          </p>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: '1px solid ' + colors.neutral[200],
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: colors.primary[600] }}>
            Border Radius
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm.size,
              color: '#666',
              margin: 0,
            }}
          >
            Corner radius values for creating consistent rounded elements.
          </p>
        </div>

        <div
          style={{
            padding: '1.5rem',
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: '1px solid ' + colors.neutral[200],
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: colors.primary[600] }}>
            Transitions
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm.size,
              color: '#666',
              margin: 0,
            }}
          >
            Animation duration and easing values for smooth interactions.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: colors.primary[50],
          borderRadius: borderRadius.lg,
          border: '1px solid ' + colors.primary[200],
        }}
      >
        <h2 style={{ marginBottom: '1rem', color: colors.primary[700] }}>
          Usage
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.base.size,
            color: '#666',
            lineHeight: '1.6',
          }}
        >
          These design tokens are the foundation of our design system. They
          ensure consistency across all components and provide a single source
          of truth for design decisions. All components in the design system use
          these tokens for styling, creating a cohesive and maintainable user
          interface.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Overview of all design system tokens and their purpose in creating consistent UI patterns.',
      },
    },
  },
};
