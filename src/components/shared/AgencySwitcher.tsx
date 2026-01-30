'use client';

import React, { useState } from 'react';
import {
  AccountBalance,
  BusinessCenter,
  Check,
  Construction,
  ExpandMore,
  FireTruck,
  Gavel,
  LocalPolice,
  Park,
  SwapHoriz,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAgency } from '../../contexts/AgencyContext';
import { SyntheticAgency } from '../../data/syntheticDataTemplates';

// Agency icon mapping for better UX
const AGENCY_ICONS: Record<string, React.ReactElement> = {
  police: <LocalPolice />,
  fire: <FireTruck />,
  finance: <AccountBalance />,
  public_works: <Construction />,
  legal: <Gavel />,
  parks: <Park />,
};

// Agency color mapping for visual distinction
const AGENCY_COLORS: Record<string, string> = {
  police: '#1976d2', // Blue
  fire: '#d32f2f', // Red
  finance: '#388e3c', // Green
  public_works: '#f57c00', // Orange
  legal: '#7b1fa2', // Purple
  parks: '#689f38', // Light Green
};

interface AgencySwitcherProps {
  variant?: 'compact' | 'full';
  showDepartmentCount?: boolean;
  disabled?: boolean;
}

export function AgencySwitcher({
  variant = 'full',
  showDepartmentCount = true,
  disabled = false,
}: AgencySwitcherProps) {
  const { currentAgency, availableAgencies, switchAgency, isLoading } =
    useAgency();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAgencySelect = (agency: SyntheticAgency) => {
    switchAgency(agency.id);
    handleClose();
  };

  // Loading state
  if (isLoading || !currentAgency) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant='circular' width={24} height={24} />
        <Skeleton variant='text' width={variant === 'compact' ? 80 : 120} />
        {variant === 'full' && (
          <Skeleton variant='circular' width={16} height={16} />
        )}
      </Box>
    );
  }

  const currentAgencyIcon = AGENCY_ICONS[currentAgency.id] || (
    <BusinessCenter />
  );
  const currentAgencyColor = AGENCY_COLORS[currentAgency.id] || '#1976d2';

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <Tooltip title={`Current Agency: ${currentAgency.name}`} arrow>
        <Button
          onClick={handleClick}
          disabled={disabled}
          size='small'
          sx={{
            minWidth: 'unset',
            px: 1,
            color: currentAgencyColor,
            borderColor: currentAgencyColor,
            '&:hover': {
              borderColor: currentAgencyColor,
              backgroundColor: `${currentAgencyColor}08`,
            },
          }}
          variant='outlined'
          startIcon={currentAgencyIcon}
        >
          {currentAgency.id.toUpperCase()}
        </Button>
      </Tooltip>
    );
  }

  // Full variant with more details
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant='outlined'
        endIcon={<ExpandMore />}
        startIcon={currentAgencyIcon}
        sx={{
          color: currentAgencyColor,
          borderColor: currentAgencyColor,
          '&:hover': {
            borderColor: currentAgencyColor,
            backgroundColor: `${currentAgencyColor}08`,
          },
          textTransform: 'none',
          minWidth: 180,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: 1,
          }}
        >
          <Typography variant='body2' fontWeight='medium'>
            {currentAgency.name}
          </Typography>
          {showDepartmentCount && (
            <Typography variant='caption' color='text.secondary'>
              {currentAgency.departments.length} departments
            </Typography>
          )}
        </Box>
      </Button>

      <Menu
        id='agency-switcher-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'agency-switcher-button',
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxHeight: 400,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Switch Agency Context
          </Typography>
        </Box>
        <Divider />

        {availableAgencies.map(agency => {
          const isSelected = agency.id === currentAgency.id;
          const agencyIcon = AGENCY_ICONS[agency.id] || <BusinessCenter />;
          const agencyColor = AGENCY_COLORS[agency.id] || '#1976d2';

          return (
            <MenuItem
              key={agency.id}
              onClick={() => handleAgencySelect(agency)}
              selected={isSelected}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: `${agencyColor}08`,
                },
              }}
            >
              <ListItemIcon sx={{ color: agencyColor }}>
                {agencyIcon}
              </ListItemIcon>
              <ListItemText>
                <Typography variant='body2' fontWeight='medium'>
                  {agency.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {agency.departments.length} departments •{' '}
                  {agency.averageResponseTime} day avg response
                </Typography>
              </ListItemText>
              {isSelected && (
                <Check sx={{ ml: 1, color: agencyColor, fontSize: 20 }} />
              )}
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 1 }} />

        <Box
          sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SwapHoriz fontSize='small' color='action' />
          <Typography variant='caption' color='text.secondary'>
            Agency context affects data filtering and permissions
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
}

// Agency indicator chip for display contexts
interface AgencyIndicatorProps {
  agencyId?: string;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

export function AgencyIndicator({
  agencyId,
  size = 'small',
  showIcon = true,
}: AgencyIndicatorProps) {
  const { currentAgency, availableAgencies } = useAgency();

  const agency = agencyId
    ? availableAgencies.find(a => a.id === agencyId)
    : currentAgency;

  if (!agency) {
    return null;
  }

  const agencyIcon = showIcon ? AGENCY_ICONS[agency.id] : undefined;
  const agencyColor = AGENCY_COLORS[agency.id] || '#1976d2';

  return (
    <Chip
      icon={agencyIcon}
      label={agency.name}
      size={size}
      sx={{
        bgcolor: `${agencyColor}12`,
        color: agencyColor,
        borderColor: agencyColor,
        '& .MuiChip-icon': {
          color: agencyColor,
        },
      }}
      variant='outlined'
    />
  );
}
