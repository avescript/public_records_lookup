'use client';

import React from 'react';
import {
  Close as CloseIcon,
  Dashboard,
  ExitToApp,
  Menu as MenuIcon,
  Settings,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@/components/migration';

import { useAuth } from '../../contexts/AuthContext';
import {
  getContainerProps,
  responsivePatterns,
  useResponsive,
} from '../../theme/responsive';
import { AdminButton, PermissionButton, RoleChip } from '../auth';
import { ClientProviders } from '../providers/ClientProviders';
import { AgencySwitcher } from '../shared/AgencySwitcher';
import { ThemeSwitcher } from '../shared/ThemeSwitcher';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Admin navigation items configuration
const navigationItems = [
  {
    href: '/admin/staff',
    label: 'Request Queue',
    icon: <Dashboard />,
    roles: ['admin', 'staff'],
  },
  {
    href: '/admin/tools',
    label: 'Admin Tools',
    icon: <Settings />,
    roles: ['admin'],
    adminOnly: true,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Mobile/Tablet navigation drawer
  const drawerNavigation = (
    <Drawer
      anchor='left'
      open={mobileMenuOpen}
      onClose={handleMobileMenuClose}
      variant={isTablet && !isMobile ? 'persistent' : 'temporary'}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.contrastText',
              color: 'primary.main',
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </Avatar>
          <Typography variant='subtitle2' noWrap>
            Admin Console
          </Typography>
        </Box>
        <IconButton
          onClick={handleMobileMenuClose}
          size='small'
          sx={{ color: 'inherit' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant='body2' color='text.secondary' noWrap>
          {user?.email}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <RoleChip size='small' />
        </Box>
      </Box>

      {/* Navigation Items */}
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {navigationItems.map(item => {
          if (item.adminOnly) {
            return (
              <PermissionButton
                key={item.href}
                requiredRoles={item.roles}
                component={ListItemButton}
                href={item.href}
                LinkComponent={Link}
                onClick={handleMobileMenuClose}
                selected={pathname === item.href}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: pathname === item.href ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                />
              </PermissionButton>
            );
          }

          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={handleMobileMenuClose}
                selected={pathname === item.href}
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: pathname === item.href ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Theme Switcher */}
      <Box sx={{ p: 2 }}>
        <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
          Theme
        </Typography>
        <ThemeSwitcher variant='inline' showLabel={false} />
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant='outlined'
          color='error'
          onClick={handleLogout}
          startIcon={<ExitToApp />}
          sx={{
            borderRadius: 1.5,
            textTransform: 'none',
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );

  // Desktop navigation
  const desktopNavigation = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {/* Agency Switcher */}
      <Box sx={{ mr: 2 }}>
        <AgencySwitcher variant='compact' showDepartmentCount={false} />
      </Box>

      {/* Admin Status Indicator */}
      <RoleChip sx={{ mr: 2 }} />

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {navigationItems.map(item => {
          if (item.adminOnly) {
            return (
              <PermissionButton
                key={item.href}
                requiredRoles={item.roles}
                color='inherit'
                component={Link}
                href={item.href}
                sx={{
                  fontWeight: pathname === item.href ? 600 : 400,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {item.label}
              </PermissionButton>
            );
          }

          return (
            <Button
              key={item.href}
              color='inherit'
              component={Link}
              href={item.href}
              sx={{
                fontWeight: pathname === item.href ? 600 : 400,
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {item.label}
            </Button>
          );
        })}

        {/* Theme Switcher */}
        <Box sx={{ ml: 1 }}>
          <ThemeSwitcher variant='icon' size='small' />
        </Box>

        {/* Logout Button */}
        <Button
          color='inherit'
          onClick={handleLogout}
          startIcon={<ExitToApp />}
          variant='outlined'
          sx={{
            ml: 2,
            px: 2,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* App Bar */}
      <AppBar
        position='static'
        sx={{
          bgcolor: 'primary.dark',
          boxShadow: theme.shadows[3],
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            ...getContainerProps('wide').sx,
            maxWidth: 'xl !important',
            mx: 'auto',
          }}
        >
          {/* Mobile Menu Button */}
          {(isMobile || isTablet) && (
            <IconButton
              color='inherit'
              onClick={handleMobileMenuToggle}
              sx={{
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Title */}
          <Typography
            variant='h6'
            component='div'
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              '& a': {
                color: 'inherit',
                textDecoration: 'none',
                transition: 'opacity 0.2s ease-in-out',
                '&:hover': {
                  opacity: 0.8,
                },
              },
            }}
          >
            <Link href='/admin'>Admin Console</Link>
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && !isTablet && desktopNavigation}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      {(isMobile || isTablet) && drawerNavigation}

      {/* Main Content */}
      <Box
        component='main'
        role='main'
        sx={{
          flexGrow: 1,
          ...responsivePatterns.responsivePadding,
          bgcolor: 'grey.50',
          minHeight: 0,
        }}
      >
        <Container
          maxWidth='xl'
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component='footer'
        role='contentinfo'
        sx={{
          py: { xs: 2, sm: 2.5 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        <Container maxWidth='xl'>
          <Typography
            variant='body2'
            color='text.secondary'
            align='center'
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Staff Portal - Public Records Management System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
