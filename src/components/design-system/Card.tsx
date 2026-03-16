/**
 * Card Component - Design System Foundation
 * Flexible container component for grouping related content with consistent styling
 */

'use client';

import React, { forwardRef } from 'react';
import { Card as MuiCard, CardProps as MuiCardProps } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  borderRadius,
  colors,
  shadows,
  spacing,
} from '@/theme/design-system/tokens';

// Extended Card Props
export interface CardProps extends Omit<MuiCardProps, 'variant'> {
  /** Card visual variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive' | 'ai';
  /** Card padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Card border radius */
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether card is hoverable/clickable */
  hoverable?: boolean;
  /** Whether card should have focus outline */
  focusable?: boolean;
}

// Styled Card Component
const StyledCard = styled(MuiCard, {
  shouldForwardProp: prop =>
    !['variant', 'padding', 'borderRadius', 'hoverable', 'focusable'].includes(
      prop as string
    ),
})<CardProps>(({
  variant = 'default',
  padding = 'md',
  borderRadius: cardBorderRadius = 'md',
  hoverable = false,
  focusable = false,
  onClick,
}) => {
  // Padding configurations
  const paddingConfig = {
    none: '0',
    sm: spacing[4], // 16px
    md: spacing[6], // 24px
    lg: spacing[8], // 32px
  };

  // Border radius configurations
  const borderRadiusConfig = {
    sm: borderRadius.sm,
    md: borderRadius.lg,
    lg: borderRadius.xl,
    xl: borderRadius['2xl'],
  };

  // Variant configurations
  const variantConfig = {
    default: {
      backgroundColor: colors.neutral[0],
      border: 'none',
      boxShadow: shadows.base,
    },
    outlined: {
      backgroundColor: colors.neutral[0],
      border: `1px solid ${colors.neutral[300]}`,
      boxShadow: 'none',
    },
    elevated: {
      backgroundColor: colors.neutral[0],
      border: 'none',
      boxShadow: shadows.lg,
    },
    interactive: {
      backgroundColor: colors.neutral[0],
      border: `1px solid ${colors.neutral[300]}`,
      boxShadow: shadows.sm,
      cursor: 'pointer',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: shadows.md,
        borderColor: colors.neutral[400],
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: shadows.sm,
      },
    },
    ai: {
      backgroundColor: colors.ai[50],
      border: `1px solid ${colors.ai[200]}`,
      boxShadow: shadows.sm,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${colors.ai[400]} 0%, ${colors.ai[600]} 100%)`,
        borderRadius: `${borderRadiusConfig[cardBorderRadius]} ${borderRadiusConfig[cardBorderRadius]} 0 0`,
      },
    },
  };

  const currentVariant = variantConfig[variant];
  const isClickable = onClick || hoverable;

  return {
    padding: paddingConfig[padding],
    borderRadius: borderRadiusConfig[cardBorderRadius],
    ...currentVariant,

    // Interactive styles
    ...(isClickable && {
      cursor: 'pointer',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        ...(variant !== 'interactive' && {
          boxShadow: shadows.md,
          transform: 'translateY(-1px)',
        }),
        ...currentVariant['&:hover'],
      },
      '&:active': {
        ...(variant !== 'interactive' && {
          transform: 'translateY(0)',
        }),
        ...currentVariant['&:active'],
      },
    }),

    // Focus styles for keyboard navigation
    ...(focusable && {
      '&:focus': {
        outline: 'none',
        boxShadow: `${shadows.sm}, 0 0 0 3px ${colors.primary[200]}`,
      },
      '&:focus-visible': {
        outline: 'none',
        boxShadow: `${shadows.sm}, 0 0 0 3px ${colors.primary[200]}`,
      },
    }),

    // Remove default Material-UI card styles
    '&.MuiCard-root': {
      borderRadius: borderRadiusConfig[cardBorderRadius],
      ...currentVariant,
    },
  };
});

// Card Header Component
export interface CardHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}

const CardHeaderStyled = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: spacing[4],
});

const CardHeaderContent = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[3],
  flex: 1,
});

const CardHeaderText = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
});

const CardHeaderTitle = styled('h3')({
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 600,
  color: colors.neutral[800],
  lineHeight: 1.4,
});

const CardHeaderSubtitle = styled('p')({
  margin: 0,
  fontSize: '0.875rem',
  color: colors.neutral[600],
  lineHeight: 1.4,
});

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  avatar,
  className,
}) => (
  <CardHeaderStyled className={className}>
    <CardHeaderContent>
      {avatar && <div>{avatar}</div>}
      <CardHeaderText>
        {title && <CardHeaderTitle>{title}</CardHeaderTitle>}
        {subtitle && <CardHeaderSubtitle>{subtitle}</CardHeaderSubtitle>}
      </CardHeaderText>
    </CardHeaderContent>
    {action && <div>{action}</div>}
  </CardHeaderStyled>
);

// Card Content Component
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContentStyled = styled('div')({
  // Content area - no default styles needed as it inherits from card
});

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => <CardContentStyled className={className}>{children}</CardContentStyled>;

// Card Footer Component
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'between';
}

const CardFooterStyled = styled('div')<{ justify: string }>(
  {
    display: 'flex',
    alignItems: 'center',
    marginTop: spacing[4],
    gap: spacing[2],
  },
  ({ justify }) => ({
    justifyContent:
      {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        between: 'space-between',
      }[justify] || 'flex-start',
  })
);

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  justify = 'end',
}) => (
  <CardFooterStyled justify={justify} className={className}>
    {children}
  </CardFooterStyled>
);

/**
 * Card Component
 *
 * Flexible container component for grouping related content.
 * Supports multiple variants, interactive states, and accessibility.
 *
 * @example
 * ```tsx
 * <Card variant="outlined" padding="lg">
 *   <CardHeader
 *     title="Card Title"
 *     subtitle="Card subtitle"
 *     action={<Button size="sm">Action</Button>}
 *   />
 *   <CardContent>
 *     Card content goes here
 *   </CardContent>
 *   <CardFooter>
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Save</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      borderRadius = 'md',
      hoverable = false,
      focusable = false,
      onClick,
      tabIndex,
      ...props
    },
    ref
  ) => {
    // Determine if card should be focusable
    const shouldBeFocusable = focusable || (onClick && !props.disabled);
    const cardTabIndex = shouldBeFocusable ? (tabIndex ?? 0) : tabIndex;

    return (
      <StyledCard
        ref={ref}
        variant={variant}
        padding={padding}
        borderRadius={borderRadius}
        hoverable={hoverable}
        focusable={shouldBeFocusable}
        onClick={onClick}
        tabIndex={cardTabIndex}
        role={onClick ? 'button' : undefined}
        {...props}
      >
        {children}
      </StyledCard>
    );
  }
);

Card.displayName = 'Card';

export default Card;
