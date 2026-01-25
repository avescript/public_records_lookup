'use client';

import React from 'react';
import { ExitToApp } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '../../contexts/AuthContext';
import { ClientProviders } from '../providers/ClientProviders';
import { AgencySwitcher } from '../shared/AgencySwitcher';
import { RoleChip, AdminButton, PermissionButton } from '../auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link
              href="/admin"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              Admin Console
            </Link>
          </Typography>

          {/* Agency Switcher */}
          <Box sx={{ mr: 3 }}>
            <AgencySwitcher variant="compact" showDepartmentCount={false} />
          </Box>

          {/* Admin Status Indicator */}
          <RoleChip sx={{ mr: 3 }} />

          {/* Admin Navigation */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              color="inherit"
              component={Link}
              href="/admin/staff"
              sx={{
                fontWeight: pathname === '/admin/staff' ? 'bold' : 'normal',
              }}
            >
              Request Queue
            </Button>
            
            {/* Admin Tools - Admin Only */}
            <PermissionButton
              requiredRoles={['admin']}
              color="inherit"
              component={Link}
              href="/admin/tools"
              sx={{
                fontWeight: pathname === '/admin/tools' ? 'bold' : 'normal',
              }}
            >
              Admin Tools
            </PermissionButton>
            
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<ExitToApp />}
              variant="outlined"
              sx={{ ml: 2 }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 3, bgcolor: 'grey.50' }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>

      <Box component="footer" sx={{ py: 2, bgcolor: 'grey.200' }}>
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            Staff Portal - Public Records Management System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
