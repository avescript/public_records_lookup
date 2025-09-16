'use client';

import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import Link from 'next/link';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Public Records Portal
            </Link>
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="inherit" component={Link} href="/">
              Submit Request
            </Button>
            <Button color="inherit" component={Link} href="/status">
              Track Request
            </Button>
            <Button color="inherit" component={Link} href="/staff">
              Staff Console
            </Button>
            <Button color="inherit" component={Link} href="/admin">
              Admin Tools
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
      
      <Box component="footer" sx={{ py: 2, bgcolor: 'grey.100' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Public Records Portal. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}