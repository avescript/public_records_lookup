import React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { FooterContent, FooterLinks, FooterRoot } from './styles';
import type { FooterProps } from './types';

export const Footer: React.FC<FooterProps> = ({ showLinks = true }) => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterRoot>
      <FooterContent>
        <Typography variant="body2" color="text.secondary">
          © {currentYear} Public Records Request Portal. All rights reserved.
        </Typography>
        {showLinks && (
          <FooterLinks>
            <Link href="/privacy" color="inherit" variant="body2">
              Privacy Policy
            </Link>
            <Link href="/terms" color="inherit" variant="body2">
              Terms of Service
            </Link>
            <Link href="/contact" color="inherit" variant="body2">
              Contact Us
            </Link>
          </FooterLinks>
        )}
      </FooterContent>
    </FooterRoot>
  );
};
