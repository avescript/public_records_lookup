/**
 * Sensitivity Mode Selector Component
 * US-V2-030: Enhanced AI Redaction System
 *
 * Visual component for selecting and configuring redaction sensitivity modes
 * with real-time preview of what will be detected at each level.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  enhancedPIIEngine,
  RedactionSensitivityMode,
  SensitivityModeConfig,
} from '../../../services/enhancedPIIEngine';
import { PIIType } from '../../../services/piiDetectionService';

interface SensitivityModeSelectorProps {
  selectedMode: RedactionSensitivityMode;
  onModeSelect: (mode: RedactionSensitivityMode) => void;
  previewData?: {
    totalPII: number;
    byType: Record<PIIType, number>;
  };
  showPreview?: boolean;
  compact?: boolean;
}

const getSeverityColor = (mode: RedactionSensitivityMode) => {
  switch (mode) {
    case RedactionSensitivityMode.LIGHT:
      return '#4caf50'; // Green
    case RedactionSensitivityMode.STANDARD:
      return '#ff9800'; // Orange
    case RedactionSensitivityMode.STRICT:
      return '#f44336'; // Red
    default:
      return '#757575'; // Gray
  }
};

const getSeverityIcon = (mode: RedactionSensitivityMode) => {
  switch (mode) {
    case RedactionSensitivityMode.LIGHT:
      return <InfoIcon />;
    case RedactionSensitivityMode.STANDARD:
      return <WarningIcon />;
    case RedactionSensitivityMode.STRICT:
      return <SecurityIcon />;
    default:
      return <InfoIcon />;
  }
};

export const SensitivityModeSelector: React.FC<
  SensitivityModeSelectorProps
> = ({
  selectedMode,
  onModeSelect,
  previewData,
  showPreview = true,
  compact = false,
}) => {
  const [expandedMode, setExpandedMode] =
    useState<RedactionSensitivityMode | null>(null);
  const sensitivityModes = enhancedPIIEngine.getAllSensitivityModes();

  // Calculate preview statistics for each mode
  const calculateModePreview = (config: SensitivityModeConfig) => {
    if (!previewData) return null;

    let estimatedDetections = 0;
    let coveredTypes = 0;

    config.piiTypesIncluded.forEach(piiType => {
      if (previewData.byType[piiType]) {
        estimatedDetections += previewData.byType[piiType];
        coveredTypes++;
      }
    });

    // Apply confidence threshold estimation (simplified)
    const thresholdMultiplier = 1 - (config.confidenceThreshold / 100) * 0.3;
    estimatedDetections = Math.round(estimatedDetections * thresholdMultiplier);

    return {
      estimatedDetections,
      coveredTypes,
      coveragePercentage: Math.round(
        (estimatedDetections / previewData.totalPII) * 100
      ),
    };
  };

  const ModeCard = ({ config }: { config: SensitivityModeConfig }) => {
    const isSelected = selectedMode === config.mode;
    const preview = calculateModePreview(config);
    const isExpanded = expandedMode === config.mode;

    return (
      <Card
        sx={{
          border: 2,
          borderColor: isSelected ? 'primary.main' : 'divider',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: isSelected ? 'primary.main' : 'primary.light',
            transform: 'translateY(-2px)',
            boxShadow: 3,
          },
          position: 'relative',
        }}
        onClick={() => onModeSelect(config.mode)}
      >
        <CardContent sx={{ pb: compact ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ color: getSeverityColor(config.mode), mr: 1 }}>
              {getSeverityIcon(config.mode)}
            </Box>
            <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ flex: 1 }}>
              {config.mode.charAt(0).toUpperCase() + config.mode.slice(1)} Mode
            </Typography>
            {isSelected && <CheckCircleIcon color='primary' />}
          </Box>

          {!compact && (
            <Typography variant='body2' color='text.secondary' paragraph>
              {config.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              size='small'
              label={`${config.confidenceThreshold}% threshold`}
              variant={isSelected ? 'filled' : 'outlined'}
            />
            <Chip
              size='small'
              label={`${config.piiTypesIncluded.length} PII types`}
              variant={isSelected ? 'filled' : 'outlined'}
            />
            {config.legalExemptionsEnabled && (
              <Chip
                size='small'
                label='Legal exemptions'
                color='secondary'
                variant={isSelected ? 'filled' : 'outlined'}
              />
            )}
          </Box>

          {showPreview && preview && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='caption' color='text.secondary'>
                Estimated Coverage: {preview.coveragePercentage}%
              </Typography>
              <LinearProgress
                variant='determinate'
                value={preview.coveragePercentage}
                sx={{
                  mt: 0.5,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getSeverityColor(config.mode),
                  },
                }}
              />
              <Typography variant='caption' color='text.secondary'>
                ~{preview.estimatedDetections} detections from{' '}
                {preview.coveredTypes} PII types
              </Typography>
            </Box>
          )}

          {!compact && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                {config.contextAnalysisDepth} context analysis
              </Typography>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  setExpandedMode(isExpanded ? null : config.mode);
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          )}

          <Collapse in={isExpanded && !compact}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant='subtitle2' gutterBottom>
                PII Types Included:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {config.piiTypesIncluded.slice(0, 8).map(piiType => (
                  <Chip
                    key={piiType}
                    size='small'
                    label={piiType.replace(/_/g, ' ')}
                    variant='outlined'
                  />
                ))}
                {config.piiTypesIncluded.length > 8 && (
                  <Chip
                    size='small'
                    label={`+${config.piiTypesIncluded.length - 8} more`}
                    variant='outlined'
                    color='secondary'
                  />
                )}
              </Box>

              <Typography variant='subtitle2' gutterBottom>
                Features:
              </Typography>
              <List dense sx={{ py: 0 }}>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleIcon fontSize='small' color='success' />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${config.confidenceThreshold}% minimum confidence`}
                    primaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleIcon fontSize='small' color='success' />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${config.contextAnalysisDepth} context analysis`}
                    primaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {config.legalExemptionsEnabled ? (
                      <CheckCircleIcon fontSize='small' color='success' />
                    ) : (
                      <VisibilityOffIcon fontSize='small' color='disabled' />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary='Legal exemption detection'
                    primaryTypographyProps={{
                      variant: 'caption',
                      color: config.legalExemptionsEnabled
                        ? 'inherit'
                        : 'text.disabled',
                    }}
                  />
                </ListItem>
              </List>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {sensitivityModes.map(config => (
          <Box key={config.mode} sx={{ minWidth: 200 }}>
            <ModeCard config={config} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {sensitivityModes.map(config => (
        <Grid item xs={12} md={4} key={config.mode}>
          <ModeCard config={config} />
        </Grid>
      ))}
    </Grid>
  );
};

export default SensitivityModeSelector;
