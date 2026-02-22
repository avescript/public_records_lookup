'use client';

import React from 'react';
import { Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  getContainerProps,
  responsivePatterns,
  useResponsive,
} from '../../theme/responsive';
import { ThemeSwitcher } from '../shared/ThemeSwitcher';

interface BaseLayoutProps {
  children: React.ReactNode;
}

// Navigation items configuration
const navigationItems = [
  { href: '/', label: 'Submit Request' },
  { href: '/status', label: 'Track Request' },
  { href: '/staff', label: 'Staff Console' },
  { href: '/admin', label: 'Admin Tools' },
];

export function BaseLayout({ children }: BaseLayoutProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Mobile navigation drawer
  const mobileNavigation = (
    <Drawer
      anchor='right'
      open={mobileMenuOpen}
      onClose={handleMobileMenuClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          pt: 2,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6'>Menu</Typography>
        <IconButton onClick={handleMobileMenuClose} size='small'>
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ px: 1 }}>
        {navigationItems.map(item => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              onClick={handleMobileMenuClose}
              selected={pathname === item.href}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: pathname === item.href ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Theme switcher in mobile menu */}
        <ListItem sx={{ px: 2, pt: 2 }}>
          <Box sx={{ width: '100%' }}>
            <Typography
              variant='subtitle2'
              color='text.secondary'
              sx={{ mb: 1 }}
            >
              Theme
            </Typography>
            <ThemeSwitcher variant='inline' showLabel={false} />
          </Box>
        </ListItem>
      </List>
    </Drawer>
  );

  // Desktop navigation
  const desktopNavigation = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {navigationItems.map(item => (
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
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {item.label}
        </Button>
      ))}

      {/* Theme switcher for desktop */}
      <Box sx={{ ml: 2 }}>
        <ThemeSwitcher variant='icon' size='small' />
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
        color: 'text.primary',
      }}
    >
      <AppBar
        position='static'
        sx={{
          boxShadow: theme.shadows[2],
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            ...getContainerProps('wide').sx,
            maxWidth: 'lg !important',
            mx: 'auto',
          }}
        >
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
            <Link href='/'>Public Records Portal</Link>
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && desktopNavigation}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color='inherit'
              onClick={handleMobileMenuToggle}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      {isMobile && mobileNavigation}

      {/* Main Content */}
      <Box
        component='main'
        role='main'
        sx={{
          flexGrow: 1,
          ...responsivePatterns.responsivePadding,
          bgcolor: 'background.default',
        }}
      >
        <Container
          maxWidth='lg'
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
          py: { xs: 2, sm: 3 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        <Container maxWidth='lg'>
          <Typography
            variant='body2'
            color='text.secondary'
            align='center'
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            © 2024 Public Records Portal. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
