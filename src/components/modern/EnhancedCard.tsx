'use client';

import React from 'react';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Fade,
  IconButton,
  Skeleton,
  Typography,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { useResponsive } from '../../theme/responsive';
import { useFocusManager } from '../accessibility/FocusManagement';

// Enhanced Card variants
export type EnhancedCardVariant =
  | 'elevated'
  | 'outlined'
  | 'filled'
  | 'interactive'
  | 'notification'
  | 'gradient';

// Enhanced Card props
export interface EnhancedCardProps {
  children: React.ReactNode;
  variant?: EnhancedCardVariant;
  loading?: boolean;
  interactive?: boolean;
  clickable?: boolean;
  hoverable?: boolean;
  selected?: boolean;
  favorite?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  gradient?: {
    from: string;
    to: string;
    direction?:
      | 'to right'
      | 'to left'
      | 'to top'
      | 'to bottom'
      | 'to top right'
      | 'to bottom right';
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  priority?: 'low' | 'medium' | 'high';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onFavorite?: (favorite: boolean) => void;
  onExpand?: (expanded: boolean) => void;
  onShare?: () => void;
  'aria-label'?: string;
  id?: string;
}

// Styled components
const StyledCard = styled(Card, {
  shouldForwardProp: prop =>
    ![
      'variant',
      'interactive',
      'clickable',
      'hoverable',
      'selected',
      'gradient',
      'status',
      'priority',
    ].includes(prop as string),
})<{
  variant?: EnhancedCardVariant;
  interactive?: boolean;
  clickable?: boolean;
  hoverable?: boolean;
  selected?: boolean;
  gradient?: EnhancedCardProps['gradient'];
  status?: EnhancedCardProps['status'];
  priority?: EnhancedCardProps['priority'];
}>(({
  theme,
  variant,
  interactive,
  clickable,
  hoverable,
  selected,
  gradient,
  status,
  priority,
}) => {
  const baseStyles = {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: theme.transitions.create(
      ['transform', 'box-shadow', 'border-color', 'background-color'],
      {
        duration: theme.transitions.duration.shorter,
      }
    ),

    // Focus styles
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
  };

  // Variant-specific styles
  const variantStyles = (() => {
    switch (variant) {
      case 'elevated':
        return {
          boxShadow: theme.shadows[4],
          backgroundColor: theme.palette.background.paper,
          border: 'none',
        };

      case 'outlined':
        return {
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          backgroundColor: theme.palette.background.paper,
        };

      case 'filled':
        return {
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: 'none',
        };

      case 'interactive':
        return {
          cursor: 'pointer',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8],
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
        };

      case 'notification':
        return {
          borderLeft: `4px solid ${theme.palette.info.main}`,
          backgroundColor: alpha(theme.palette.info.main, 0.05),
          boxShadow: theme.shadows[2],
        };

      case 'gradient':
        return {
          background: gradient
            ? `linear-gradient(${gradient.direction || 'to right'}, ${gradient.from}, ${gradient.to})`
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[6],
        };

      default:
        return {
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        };
    }
  })();

  // Interactive styles
  const interactiveStyles =
    interactive || clickable
      ? {
          cursor: 'pointer',
          '&:hover': {
            transform: hoverable !== false ? 'translateY(-1px)' : 'none',
            boxShadow: theme.shadows[4],
            ...(!gradient && {
              backgroundColor: alpha(theme.palette.action.hover, 0.04),
            }),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }
      : {};

  // Selected styles
  const selectedStyles = selected
    ? {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
      }
    : {};

  // Status styles
  const statusStyles = status
    ? (() => {
        const statusColors = {
          success: theme.palette.success.main,
          warning: theme.palette.warning.main,
          error: theme.palette.error.main,
          info: theme.palette.info.main,
        };

        return {
          borderLeft: `4px solid ${statusColors[status]}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '2px',
            backgroundColor: statusColors[status],
            opacity: 0.3,
          },
        };
      })()
    : {};

  // Priority styles
  const priorityStyles = priority
    ? (() => {
        const priorityColors = {
          low: theme.palette.success.main,
          medium: theme.palette.warning.main,
          high: theme.palette.error.main,
        };

        return {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: theme.spacing(1),
            right: theme.spacing(1),
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: priorityColors[priority],
          },
        };
      })()
    : {};

  return {
    ...baseStyles,
    ...variantStyles,
    ...interactiveStyles,
    ...selectedStyles,
    ...statusStyles,
    ...priorityStyles,
  };
});

// Loading skeleton component
const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <Card>
    <CardHeader
      avatar={
        <Skeleton animation='wave' variant='circular' width={40} height={40} />
      }
      title={<Skeleton animation='wave' height={10} width='80%' />}
      subheader={<Skeleton animation='wave' height={10} width='40%' />}
    />
    <CardContent>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          animation='wave'
          height={10}
          width={i === lines - 1 ? '60%' : '100%'}
          sx={{ mb: 1 }}
        />
      ))}
    </CardContent>
  </Card>
);

// Enhanced Card component
export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  variant = 'outlined',
  loading = false,
  interactive = false,
  clickable = false,
  hoverable = true,
  selected = false,
  favorite = false,
  expandable = false,
  expanded = false,
  gradient,
  status,
  priority,
  className,
  onClick,
  onFavorite,
  onExpand,
  onShare,
  'aria-label': ariaLabel,
  id,
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const { announce } = useFocusManager();
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const [isFavorite, setIsFavorite] = React.useState(favorite);

  // Handle expand/collapse
  const handleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpand?.(newExpanded);
    announce(`Card ${newExpanded ? 'expanded' : 'collapsed'}`, 'polite');
  };

  // Handle favorite toggle
  const handleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);
    onFavorite?.(newFavorite);
    announce(
      `${newFavorite ? 'Added to' : 'Removed from'} favorites`,
      'polite'
    );
  };

  // Handle share
  const handleShare = (event: React.MouseEvent) => {
    event.stopPropagation();
    onShare?.();
    announce('Share dialog opened', 'polite');
  };

  // Handle card click
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(event);
    }
  };

  // Show loading skeleton
  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <Fade in timeout={300}>
      <StyledCard
        variant={variant}
        interactive={interactive}
        clickable={clickable}
        hoverable={hoverable}
        selected={selected}
        gradient={gradient}
        status={status}
        priority={priority}
        className={className}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={ariaLabel}
        id={id}
        sx={{
          // Responsive adjustments
          width: '100%',
          ...(isMobile && {
            '&:hover': {
              transform: 'none', // Disable hover effects on mobile
            },
          }),
        }}
      >
        {/* Priority indicator */}
        {priority && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                priority === 'high'
                  ? 'error.main'
                  : priority === 'medium'
                    ? 'warning.main'
                    : 'success.main',
              zIndex: 1,
            }}
            aria-label={`${priority} priority`}
          />
        )}

        {/* Main content */}
        {children}

        {/* Action buttons */}
        {(expandable || onFavorite || onShare) && (
          <CardActions
            sx={{
              justifyContent: 'space-between',
              px: 2,
              py: 1,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onFavorite && (
                <IconButton
                  onClick={handleFavorite}
                  aria-label={
                    isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                  size='small'
                  color={isFavorite ? 'error' : 'default'}
                >
                  {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              )}

              {onShare && (
                <IconButton
                  onClick={handleShare}
                  aria-label='Share'
                  size='small'
                >
                  <ShareIcon />
                </IconButton>
              )}
            </Box>

            {expandable && (
              <IconButton
                onClick={handleExpand}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                aria-expanded={isExpanded}
                size='small'
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </CardActions>
        )}

        {/* Expandable content */}
        {expandable && (
          <Fade in={isExpanded}>
            <Box sx={{ display: isExpanded ? 'block' : 'none' }}>
              {/* Expandable content would go here */}
            </Box>
          </Fade>
        )}
      </StyledCard>
    </Fade>
  );
};

// Pre-configured card variants for common use cases

// Notification Card
export const NotificationCard: React.FC<{
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
  avatar?: React.ReactNode;
  onDismiss?: () => void;
}> = ({ title, message, type = 'info', timestamp, avatar, onDismiss }) => {
  return (
    <EnhancedCard variant='notification' status={type}>
      <CardHeader
        avatar={
          avatar || (
            <Avatar sx={{ bgcolor: `${type}.main` }}>{title.charAt(0)}</Avatar>
          )
        }
        title={title}
        subheader={timestamp}
        action={
          onDismiss && (
            <IconButton
              onClick={onDismiss}
              size='small'
              aria-label='Dismiss notification'
            >
              <MoreVertIcon />
            </IconButton>
          )
        }
      />
      <CardContent>
        <Typography variant='body2' color='text.secondary'>
          {message}
        </Typography>
      </CardContent>
    </EnhancedCard>
  );
};

// Interactive Card for dashboard items
export const DashboardCard: React.FC<{
  title: string;
  subtitle?: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ title, subtitle, value, trend, icon, onClick }) => {
  return (
    <EnhancedCard variant='interactive' clickable onClick={onClick}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant='h4' component='div' sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            <Typography variant='h6' color='text.secondary'>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant='body2' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip
                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                size='small'
                color={trend.isPositive ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          {icon && (
            <Box sx={{ color: 'primary.main', fontSize: 40 }}>{icon}</Box>
          )}
        </Box>
      </CardContent>
    </EnhancedCard>
  );
};

export default EnhancedCard;
