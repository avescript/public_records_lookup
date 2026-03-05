'use client';

import React, { useState } from 'react';
import {
  Check,
  DarkMode,
  LightMode,
  Palette,
  SettingsBrightness,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import { type ThemeMode, useThemeMode } from '../../contexts/ThemeContext';

// Theme option configuration
interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    mode: 'light',
    label: 'Light',
    icon: <LightMode />,
    description: 'Light mode',
  },
  {
    mode: 'dark',
    label: 'Dark',
    icon: <DarkMode />,
    description: 'Dark mode',
  },
  {
    mode: 'system',
    label: 'System',
    icon: <SettingsBrightness />,
    description: 'Follow system preference',
  },
];

// Component props
interface ThemeSwitcherProps {
  variant?: 'icon' | 'menu' | 'inline';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  tooltip?: string;
}

// Main theme switcher component
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'icon',
  showLabel = false,
  size = 'medium',
  tooltip = 'Change theme',
}) => {
  const { mode, setThemeMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (variant === 'icon') {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (selectedMode: ThemeMode) => {
    setThemeMode(selectedMode);
    handleClose();
  };

  // Get current theme option
  const currentOption =
    themeOptions.find(option => option.mode === mode) || themeOptions[2];

  // Render icon button variant
  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={tooltip} arrow>
          <IconButton
            onClick={handleClick}
            size={size}
            sx={{
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: alpha('#000', 0.08),
                transform: 'scale(1.05)',
              },
            }}
          >
            {currentOption.icon}
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 180,
              mt: 1.5,
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                px: 2,
                py: 1.5,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {themeOptions.map(option => (
            <MenuItem
              key={option.mode}
              onClick={() => handleThemeSelect(option.mode)}
              selected={mode === option.mode}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha('#000', 0.08),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color:
                    mode === option.mode ? 'primary.main' : 'text.secondary',
                }}
              >
                {option.icon}
              </ListItemIcon>
              <Box>
                <ListItemText
                  primary={option.label}
                  secondary={option.description}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: mode === option.mode ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                  }}
                />
              </Box>
              {mode === option.mode && (
                <Check
                  sx={{
                    ml: 1,
                    color: 'primary.main',
                    fontSize: 18,
                  }}
                />
              )}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // Render menu variant (horizontal layout)
  if (variant === 'menu') {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 0.5,
          backgroundColor: alpha('#000', 0.05),
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {themeOptions.map(option => (
          <Tooltip key={option.mode} title={option.description} arrow>
            <IconButton
              size={size}
              onClick={() => handleThemeSelect(option.mode)}
              sx={{
                backgroundColor:
                  mode === option.mode ? 'primary.main' : 'transparent',
                color:
                  mode === option.mode
                    ? 'primary.contrastText'
                    : 'text.secondary',
                '&:hover': {
                  backgroundColor:
                    mode === option.mode ? 'primary.dark' : alpha('#000', 0.08),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {option.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    );
  }

  // Render inline variant (with labels)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {showLabel && (
        <Typography variant='subtitle2' color='text.secondary'>
          Theme
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {themeOptions.map(option => (
          <Box
            key={option.mode}
            onClick={() => handleThemeSelect(option.mode)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 1.5,
              cursor: 'pointer',
              backgroundColor:
                mode === option.mode ? alpha('#000', 0.08) : 'transparent',
              border: '1px solid',
              borderColor: mode === option.mode ? 'primary.main' : 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: alpha('#000', 0.04),
                borderColor:
                  mode === option.mode ? 'primary.dark' : 'text.secondary',
              },
            }}
          >
            <Box
              sx={{
                color: mode === option.mode ? 'primary.main' : 'text.secondary',
              }}
            >
              {option.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='body2'
                sx={{
                  fontWeight: mode === option.mode ? 600 : 400,
                  color: mode === option.mode ? 'primary.main' : 'text.primary',
                }}
              >
                {option.label}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {option.description}
              </Typography>
            </Box>
            {mode === option.mode && (
              <Check
                sx={{
                  color: 'primary.main',
                  fontSize: 18,
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Quick toggle button (switches between light and dark only)
export const QuickThemeToggle: React.FC<{
  size?: 'small' | 'medium' | 'large';
}> = ({ size = 'medium' }) => {
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} arrow>
      <IconButton
        onClick={toggleTheme}
        size={size}
        sx={{
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            backgroundColor: alpha('#000', 0.08),
            transform: 'rotate(180deg)',
          },
        }}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

// Theme indicator (shows current theme without interaction)
export const ThemeIndicator: React.FC = () => {
  const { mode, isDarkMode } = useThemeMode();
  const currentOption =
    themeOptions.find(option => option.mode === mode) || themeOptions[2];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 1,
        backgroundColor: alpha('#000', 0.05),
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ color: 'text.secondary' }}>{currentOption.icon}</Box>
      <Typography variant='body2' color='text.secondary'>
        {currentOption.label} Theme
      </Typography>
    </Box>
  );
};

export default ThemeSwitcher;
