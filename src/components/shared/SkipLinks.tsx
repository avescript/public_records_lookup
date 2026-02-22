'use client';

import React, { useEffect } from 'react';
import { alpha, Box, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useSkipLinks } from '../../utils/accessibility';

// Styled skip link that appears on focus
const SkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  left: '-10000px',
  top: '8px',
  zIndex: 10000,
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  textDecoration: 'none',
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.875rem',
  fontWeight: 600,
  border: `2px solid ${theme.palette.primary.dark}`,
  boxShadow: theme.shadows[4],
  transition: 'all 0.2s ease-in-out',

  '&:focus': {
    left: '8px',
    outline: 'none',
    transform: 'translateY(0)',
    boxShadow: theme.shadows[8],
  },

  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    textDecoration: 'underline',
  },

  // High contrast mode support
  '@media (prefers-contrast: high)': {
    backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
    border: `3px solid ${theme.palette.mode === 'dark' ? '#000000' : '#ffffff'}`,
  },
}));

// Container for skip links
const SkipLinksContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 10000,
  pointerEvents: 'none',

  '& > *': {
    pointerEvents: 'auto',
  },
}));

// Props for individual skip link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

// Individual skip link component
export const AccessibleSkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  onClick,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(event);
    } else {
      // Default behavior: focus the target element
      event.preventDefault();
      const target = document.querySelector(href);
      if (target instanceof HTMLElement) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <SkipLink href={href} onClick={handleClick}>
      {children}
    </SkipLink>
  );
};

// Main skip links navigation
interface SkipLinksNavigationProps {
  links?: Array<{ id: string; label: string; href?: string }>;
}

export const SkipLinksNavigation: React.FC<SkipLinksNavigationProps> = ({
  links = [],
}) => {
  const { skipLinks, focusSkipTarget } = useSkipLinks();

  // Default skip links if none provided
  const defaultLinks = [
    {
      id: 'main-content',
      label: 'Skip to main content',
      href: '#main-content',
    },
    { id: 'navigation', label: 'Skip to navigation', href: '#navigation' },
    { id: 'footer', label: 'Skip to footer', href: '#footer' },
  ];

  const allLinks = links.length > 0 ? links : defaultLinks;

  const handleLinkClick =
    (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      focusSkipTarget(id);
    };

  return (
    <SkipLinksContainer role='navigation' aria-label='Skip links'>
      {allLinks.map(link => (
        <AccessibleSkipLink
          key={link.id}
          href={link.href || `#${link.id}`}
          onClick={handleLinkClick(link.id)}
        >
          {link.label}
        </AccessibleSkipLink>
      ))}

      {/* Dynamic skip links from useSkipLinks hook */}
      {skipLinks.map(link => (
        <AccessibleSkipLink
          key={link.id}
          href={`#${link.id}`}
          onClick={handleLinkClick(link.id)}
        >
          {link.label}
        </AccessibleSkipLink>
      ))}
    </SkipLinksContainer>
  );
};

// Hook to register skip link targets
export const useSkipLinkTarget = (id: string, label?: string) => {
  const { addSkipLink, removeSkipLink } = useSkipLinks();

  useEffect(() => {
    if (label) {
      addSkipLink(id, label);
    }

    // Add the id to the target element if it exists
    const element = document.getElementById(id);
    if (element) {
      element.setAttribute('tabindex', '-1');
    }

    return () => {
      if (label) {
        removeSkipLink(id);
      }
    };
  }, [id, label, addSkipLink, removeSkipLink]);

  return { id };
};

// Main content wrapper with skip link target
interface MainContentProps {
  children: React.ReactNode;
  id?: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  id = 'main-content',
}) => {
  useSkipLinkTarget(id);

  return (
    <Box
      component='main'
      id={id}
      role='main'
      sx={{
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
      }}
      tabIndex={-1}
    >
      {children}
    </Box>
  );
};

// Navigation wrapper with skip link target
interface NavigationProps {
  children: React.ReactNode;
  id?: string;
  'aria-label'?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  children,
  id = 'navigation',
  'aria-label': ariaLabel = 'Main navigation',
}) => {
  useSkipLinkTarget(id);

  return (
    <Box
      component='nav'
      id={id}
      role='navigation'
      aria-label={ariaLabel}
      sx={{
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
      }}
      tabIndex={-1}
    >
      {children}
    </Box>
  );
};

// Footer wrapper with skip link target
interface FooterProps {
  children: React.ReactNode;
  id?: string;
}

export const Footer: React.FC<FooterProps> = ({ children, id = 'footer' }) => {
  useSkipLinkTarget(id);

  return (
    <Box
      component='footer'
      id={id}
      role='contentinfo'
      sx={{
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
      }}
      tabIndex={-1}
    >
      {children}
    </Box>
  );
};

export default SkipLinksNavigation;
