/**
 * Migration Dashboard Component
 * Epic V2-7 Phase 5: Priority 3 Migration Tooling
 *
 * Visual dashboard for tracking design system migration progress,
 * component usage statistics, and development guidance.
 * Only available in development mode.
 */

'use client';

import React, { useState } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { useMigrationStats } from '@/hooks/useMigrationStats';

interface MigrationDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

function TabPanel({ children, value, index, ...other }: any) {
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`migration-tabpanel-${index}`}
      aria-labelledby={`migration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MigrationDashboard: React.FC<MigrationDashboardProps> = ({
  isOpen = true,
  onClose,
  position = 'top-right',
}) => {
  const {
    progress,
    componentStats,
    warnings,
    highPriorityComponents,
    refreshStats,
    clearWarnings,
    isEnabled,
  } = useMigrationStats();

  const [activeTab, setActiveTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Don't render in production
  if (!isEnabled) {
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      width: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: 6,
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 16, right: 16 };
      case 'top-left':
        return { ...baseStyles, top: 16, left: 16 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 16, left: 16 };
      default:
        return { ...baseStyles, top: 16, right: 16 };
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color='error' />;
      case 'warning':
        return <WarningIcon color='warning' />;
      case 'info':
      default:
        return <InfoIcon color='info' />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Paper elevation={8} sx={getPositionStyles()}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          <Typography variant='h6'>Migration Dashboard</Typography>
        </Box>
        <Box>
          <Button
            color='inherit'
            size='small'
            onClick={refreshStats}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          {onClose && (
            <Button color='inherit' size='small' onClick={onClose}>
              ×
            </Button>
          )}
        </Box>
      </Box>

      {/* Progress Overview */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box textAlign='center'>
              <Typography variant='h4' color='primary'>
                {progress.overallPercentage.toFixed(1)}%
              </Typography>
              <Typography variant='caption'>Overall Progress</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign='center'>
              <Typography variant='h4' color='secondary'>
                {progress.migratedComponents}
              </Typography>
              <Typography variant='caption'>
                of {progress.totalComponents} components
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <LinearProgress
          variant='determinate'
          value={progress.overallPercentage}
          sx={{ mt: 2, height: 8, borderRadius: 4 }}
        />

        {progress.highPriorityRemaining > 0 && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            {progress.highPriorityRemaining} high-priority components need
            migration
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} variant='fullWidth'>
        <Tab
          label={
            <Badge badgeContent={componentStats.length} color='primary'>
              Components
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={warnings.length} color='error'>
              Warnings
            </Badge>
          }
        />
      </Tabs>

      {/* Component Stats Tab */}
      <TabPanel value={activeTab} index={0}>
        <List dense>
          {componentStats.map(stat => {
            const isHighPriority = highPriorityComponents.includes(
              stat.componentName
            );
            const isComplete = stat.migrationPercentage >= 80;

            return (
              <ListItem key={stat.componentName}>
                <ListItemIcon>
                  {isComplete ? (
                    <CheckCircleIcon color='success' />
                  ) : (
                    <CircularProgress
                      variant='determinate'
                      value={stat.migrationPercentage}
                      size={24}
                      color={isHighPriority ? 'warning' : 'primary'}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stat.componentName}
                      {isHighPriority && (
                        <Chip
                          size='small'
                          label='High Priority'
                          color='warning'
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant='caption'>
                        Migration: {stat.migrationCount} | Legacy:{' '}
                        {stat.legacyCount}
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={stat.migrationPercentage}
                        sx={{ mt: 0.5, height: 4 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </TabPanel>

      {/* Warnings Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant='h6'>Migration Guidance</Typography>
          {warnings.length > 0 && (
            <Button size='small' onClick={clearWarnings}>
              Clear All
            </Button>
          )}
        </Box>

        {warnings.length === 0 ? (
          <Alert severity='success'>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon />
              No migration warnings! Great job!
            </Box>
          </Alert>
        ) : (
          <List dense>
            {warnings.map(warning => (
              <ListItem key={warning.id}>
                <ListItemIcon>{getSeverityIcon(warning.severity)}</ListItemIcon>
                <ListItemText
                  primary={warning.message}
                  secondary={
                    <Box>
                      {warning.component && (
                        <Typography variant='caption' display='block'>
                          Component: {warning.component}
                        </Typography>
                      )}
                      {warning.filePath && (
                        <Typography
                          variant='caption'
                          display='block'
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {warning.filePath}
                        </Typography>
                      )}
                      {warning.suggestion && (
                        <Typography
                          variant='caption'
                          display='block'
                          color='text.secondary'
                        >
                          💡 {warning.suggestion}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Quick Actions */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant='caption' color='text.secondary'>
          Development Mode • Auto-refresh every 10s
        </Typography>
      </Box>
    </Paper>
  );
};

export default MigrationDashboard;
