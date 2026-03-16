'use client';

import React from 'react';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Container,
  Divider,
  Fade,
  Grid,
  Link,
  Paper,
  Slide,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { useThemeMode } from '../../contexts/ThemeContext';
import {
  getContainerProps,
  responsivePatterns,
  useResponsive,
} from '../../theme/responsive';
import { Footer, MainContent, Navigation } from '../shared/SkipLinks';

import { EnhancedCard } from './EnhancedCard';

// Dashboard layout props
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  sidebar?: React.ReactNode;
  headerActions?: React.ReactNode;
  stats?: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    icon?: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  }>;
  quickActions?: React.ReactNode;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp?: string;
  }>;
  containerMaxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  spacing?: number;
  variant?: 'default' | 'compact' | 'spacious';
  className?: string;
}

// Styled components
const DashboardRoot = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
}));

const DashboardHeader = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.appBar - 1,
  borderRadius: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ContentGrid = styled(Grid)(({ theme }) => ({
  flex: 1,
  alignItems: 'stretch',
}));

const SidebarContainer = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  height: 'fit-content',
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto',

  // Custom scrollbar
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.action.disabled,
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

// Stats card component
const StatsCard: React.FC<
  DashboardLayoutProps['stats'][0] & { delay?: number }
> = ({ title, value, subtitle, trend, icon, color = 'primary', delay = 0 }) => {
  const { isDarkMode } = useThemeMode();

  return (
    <Slide direction='up' in timeout={300 + delay}>
      <EnhancedCard
        variant='elevated'
        sx={theme => ({
          height: '100%',
          background: `linear-gradient(135deg, 
            ${theme.palette[color].main}15 0%, 
            ${theme.palette[color].light}08 100%)`,
          border: `1px solid ${theme.palette[color].main}20`,
        })}
      >
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='h3'
                component='div'
                sx={{
                  fontWeight: 700,
                  color: `${color}.main`,
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                }}
              >
                {value}
              </Typography>
              <Typography
                variant='h6'
                color='text.primary'
                sx={{
                  fontWeight: 600,
                  mb: subtitle ? 0.5 : 2,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: trend.isPositive
                      ? 'success.main'
                      : 'error.main',
                    color: 'white',
                    width: 'fit-content',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </Box>
              )}
            </Box>
            {icon && (
              <Box
                sx={{
                  color: `${color}.main`,
                  fontSize: { xs: 32, sm: 40 },
                  opacity: 0.8,
                  ml: 2,
                }}
              >
                {icon}
              </Box>
            )}
          </Box>
        </Box>
      </EnhancedCard>
    </Slide>
  );
};

// Dashboard Layout component
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  sidebar,
  headerActions,
  stats,
  quickActions,
  notifications,
  containerMaxWidth = 'xl',
  spacing = 3,
  variant = 'default',
  className,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const theme = useAppTheme();

  // Variant-specific spacing
  const variantSpacing = {
    compact: 2,
    default: 3,
    spacious: 4,
  };

  const actualSpacing = variantSpacing[variant];

  return (
    <DashboardRoot className={className}>
      {/* Dashboard Header */}
      <DashboardHeader elevation={1}>
        <Container maxWidth={containerMaxWidth} sx={{ py: 3 }}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize='small' />}
              sx={{ mb: 2 }}
              aria-label='breadcrumb navigation'
            >
              {breadcrumbs.map((crumb, index) => (
                <Link
                  key={index}
                  color={
                    index === breadcrumbs.length - 1
                      ? 'text.primary'
                      : 'inherit'
                  }
                  href={crumb.href}
                  onClick={crumb.onClick}
                  sx={{
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {crumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          )}

          {/* Title and Actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0,
            }}
          >
            <Box>
              {title && (
                <Typography
                  variant='h4'
                  component='h1'
                  sx={{
                    fontWeight: 700,
                    mb: subtitle ? 0.5 : 0,
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant='h6' color='text.secondary'>
                  {subtitle}
                </Typography>
              )}
            </Box>

            {headerActions && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {headerActions}
              </Box>
            )}
          </Box>
        </Container>
      </DashboardHeader>

      {/* Main Content */}
      <MainContent id='dashboard-main'>
        <Container
          maxWidth={containerMaxWidth}
          sx={{ py: actualSpacing, flex: 1 }}
        >
          {/* Stats Section */}
          {stats && stats.length > 0 && (
            <Fade in timeout={500}>
              <StatsGrid
                container
                spacing={actualSpacing}
                sx={{ mb: actualSpacing }}
              >
                {stats.map((stat, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={stats.length === 2 ? 6 : stats.length === 3 ? 4 : 3}
                    key={index}
                  >
                    <StatsCard {...stat} delay={index * 100} />
                  </Grid>
                ))}
              </StatsGrid>
            </Fade>
          )}

          {/* Quick Actions */}
          {quickActions && (
            <Fade in timeout={700}>
              <Box sx={{ mb: actualSpacing }}>{quickActions}</Box>
            </Fade>
          )}

          {/* Main Content Grid */}
          <ContentGrid container spacing={actualSpacing}>
            {/* Sidebar */}
            {sidebar && !isMobile && (
              <Grid item xs={12} md={3} lg={3}>
                <Slide direction='right' in timeout={600}>
                  <SidebarContainer>{sidebar}</SidebarContainer>
                </Slide>
              </Grid>
            )}

            {/* Main Content Area */}
            <Grid
              item
              xs={12}
              md={sidebar && !isMobile ? 9 : 12}
              lg={sidebar && !isMobile ? 9 : 12}
            >
              <Fade in timeout={800}>
                <Box sx={{ height: '100%' }}>{children}</Box>
              </Fade>
            </Grid>
          </ContentGrid>

          {/* Mobile Sidebar (Bottom) */}
          {sidebar && isMobile && (
            <Slide direction='up' in timeout={1000}>
              <Box sx={{ mt: actualSpacing }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Additional Information
                </Typography>
                {sidebar}
              </Box>
            </Slide>
          )}
        </Container>
      </MainContent>
    </DashboardRoot>
  );
};

// Pre-configured dashboard variants
export const CompactDashboard: React.FC<
  Omit<DashboardLayoutProps, 'variant'>
> = props => <DashboardLayout {...props} variant='compact' />;

export const SpaciousDashboard: React.FC<
  Omit<DashboardLayoutProps, 'variant'>
> = props => <DashboardLayout {...props} variant='spacious' />;

export default DashboardLayout;
