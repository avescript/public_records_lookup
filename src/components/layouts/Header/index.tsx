import React from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { HeaderRoot, HeaderToolbar, HeaderActions } from './styles';
import type { HeaderProps } from './types';

export const Header: React.FC<HeaderProps> = ({
  title = 'Public Records Request Portal',
  showSearch = true,
}) => {
  return (
    <HeaderRoot position="sticky">
      <HeaderToolbar>
        <Typography variant="h6" component="h1">
          {title}
        </Typography>
        <HeaderActions>
          {showSearch && (
            <IconButton color="inherit" aria-label="search">
              <SearchIcon />
            </IconButton>
          )}
        </HeaderActions>
      </HeaderToolbar>
    </HeaderRoot>
  );
};
