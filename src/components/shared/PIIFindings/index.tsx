'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Alert,
  Collapse,
  IconButton,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

import {
  PIIFinding,
  PIIType,
  PIIFindingsResult,
  piiDetectionService,
} from '../../../services/piiDetectionService';

interface PIIFindingsProps {
  recordId: string;
  onFindingSelect?: (finding: PIIFinding) => void;
  groupBy?: 'type' | 'page' | 'confidence' | 'file';
  showEmptyState?: boolean;
}

interface PIIFindingItemProps {
  finding: PIIFinding;
  onClick?: () => void;
  showDetails?: boolean;
}

const PIITypeColors: Record<PIIType, string> = {
  [PIIType.SSN]: '#f44336',
  [PIIType.PHONE]: '#ff9800',
  [PIIType.ADDRESS]: '#2196f3',
  [PIIType.PERSON_NAME]: '#4caf50',
  [PIIType.EMAIL]: '#9c27b0',
  [PIIType.DOB]: '#ff5722',
  [PIIType.DRIVERS_LICENSE]: '#795548',
  [PIIType.ACCOUNT_NUMBER]: '#607d8b',
  [PIIType.ROUTING_NUMBER]: '#3f51b5',
  [PIIType.MEDICAL_ID]: '#e91e63',
};

const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 0.9) return <CheckCircleIcon color="success" />;
  if (confidence >= 0.8) return <InfoIcon color="primary" />;
  if (confidence >= 0.7) return <WarningIcon color="warning" />;
  return <ErrorIcon color="error" />;
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.9) return 'High';
  if (confidence >= 0.8) return 'Medium-High';
  if (confidence >= 0.7) return 'Medium';
  return 'Low';
};

const PIIFindingItem: React.FC<PIIFindingItemProps> = ({
  finding,
  onClick,
  showDetails = true,
}) => {
  return (
    <ListItem
      {...(onClick ? { button: true as any } : {})}
      onClick={onClick}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          backgroundColor: 'action.hover',
        } : {},
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <ListItemIcon>
          {getConfidenceIcon(finding.confidence)}
        </ListItemIcon>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: showDetails ? 1 : 0 }}>
            <Chip
              label={finding.piiType}
              size="small"
              sx={{
                backgroundColor: PIITypeColors[finding.piiType],
                color: 'white',
                fontWeight: 'bold',
              }}
            />
            <Typography variant="body2" component="span">
              {finding.text}
            </Typography>
            <Chip
              label={`${Math.round(finding.confidence * 100)}%`}
              size="small"
              variant="outlined"
              color={finding.confidence >= 0.8 ? 'success' : 'warning'}
            />
          </Stack>
          {showDetails && (
            <Box sx={{ pl: 0 }}>
              <Typography variant="caption" color="text.secondary" component="div">
                {finding.reasoning}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                Location: Page {finding.pageNumber}, {finding.fileName}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                Coordinates: ({finding.x}, {finding.y}) - {finding.width} × {finding.height}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ListItem>
  );
};

const PIIFindings: React.FC<PIIFindingsProps> = ({
  recordId,
  onFindingSelect,
  groupBy = 'type',
  showEmptyState = true,
}) => {
  const [findingsResult, setFindingsResult] = useState<PIIFindingsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showOnlyHighRisk, setShowOnlyHighRisk] = useState(false);

  useEffect(() => {
    const loadFindings = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await piiDetectionService.getFindingsForRecord(recordId);
        setFindingsResult(result);
        
        // Auto-expand first few groups
        const firstGroups = new Set(['SSN', 'PHONE', 'ADDRESS'].slice(0, 2));
        setExpandedGroups(firstGroups);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PII findings';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadFindings();
  }, [recordId]);

  const filteredFindings = useMemo(() => {
    if (!findingsResult) return [];

    let filtered = findingsResult.findings;

    // Apply confidence filter
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(finding => {
        switch (confidenceFilter) {
          case 'high': return finding.confidence >= 0.8;
          case 'medium': return finding.confidence >= 0.7 && finding.confidence < 0.8;
          case 'low': return finding.confidence < 0.7;
          default: return true;
        }
      });
    }

    // Apply high-risk filter
    if (showOnlyHighRisk) {
      const highRiskTypes = [PIIType.SSN, PIIType.ACCOUNT_NUMBER, PIIType.MEDICAL_ID, PIIType.DRIVERS_LICENSE];
      filtered = filtered.filter(finding => highRiskTypes.includes(finding.piiType));
    }

    return filtered;
  }, [findingsResult, confidenceFilter, showOnlyHighRisk]);

  const groupedFindings = useMemo(() => {
    if (!filteredFindings.length) return {};

    const groups: Record<string, PIIFinding[]> = {};

    filteredFindings.forEach(finding => {
      let key: string;
      
      switch (groupBy) {
        case 'type':
          key = finding.piiType;
          break;
        case 'page':
          key = `Page ${finding.pageNumber} (${finding.fileName})`;
          break;
        case 'confidence':
          key = getConfidenceLabel(finding.confidence);
          break;
        case 'file':
          key = finding.fileName;
          break;
        default:
          key = finding.piiType;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(finding);
    });

    // Sort groups
    return Object.keys(groups)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = groups[key].sort((a, b) => b.confidence - a.confidence);
        return sorted;
      }, {} as Record<string, PIIFinding[]>);
  }, [filteredFindings, groupBy]);

  const handleToggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleFindingClick = (finding: PIIFinding) => {
    onFindingSelect?.(finding);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            PII Detection Results
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyzing document for PII...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            PII Detection Results
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!findingsResult || findingsResult.findings.length === 0) {
    if (!showEmptyState) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            PII Detection Results
          </Typography>
          <Alert severity="info" icon={<SecurityIcon />}>
            <Typography variant="body2">
              No PII detected in this record. The document appears to be safe for public release.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              PII Detection Results
            </Typography>
            <Chip
              label={`${filteredFindings.length} findings`}
              color={findingsResult.highConfidenceFindings > 0 ? 'warning' : 'info'}
              variant="outlined"
            />
          </Stack>

          {/* Summary Stats */}
          <Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                label={`${findingsResult.totalFindings} total`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${findingsResult.highConfidenceFindings} high confidence`}
                color="warning"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${findingsResult.piiTypesDetected.length} types`}
                variant="outlined"
              />
            </Stack>
          </Box>

          {/* Filters */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Confidence</InputLabel>
              <Select
                value={confidenceFilter}
                label="Confidence"
                onChange={(e) => setConfidenceFilter(e.target.value as typeof confidenceFilter)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="high">High (≥80%)</MenuItem>
                <MenuItem value="medium">Medium (70-79%)</MenuItem>
                <MenuItem value="low">Low (&lt;70%)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyHighRisk}
                  onChange={(e) => setShowOnlyHighRisk(e.target.checked)}
                  size="small"
                />
              }
              label="High-risk only"
            />
          </Stack>

          {filteredFindings.length === 0 && (
            <Alert severity="info">
              No findings match the current filters.
            </Alert>
          )}

          {/* Grouped Findings */}
          {Object.entries(groupedFindings).map(([groupKey, findings]) => (
            <Accordion
              key={groupKey}
              expanded={expandedGroups.has(groupKey)}
              onChange={() => handleToggleGroup(groupKey)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {groupKey}
                  </Typography>
                  <Chip
                    size="small"
                    label={findings.length}
                    color={groupBy === 'type' ? 'primary' : 'default'}
                    sx={{
                      backgroundColor: groupBy === 'type' ? PIITypeColors[groupKey as PIIType] : undefined,
                      color: groupBy === 'type' ? 'white' : undefined,
                    }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {findings.map((finding, index) => (
                    <PIIFindingItem
                      key={`${finding.recordId}-${finding.pageNumber}-${index}`}
                      finding={finding}
                      onClick={onFindingSelect ? () => handleFindingClick(finding) : undefined}
                    />
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PIIFindings;