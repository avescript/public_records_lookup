/**
 * Redaction History and Versioning
 * US-V2-031: Track changes and enable rollback functionality
 *
 * Features:
 * - Version history with thumbnails
 * - Rollback to previous versions
 * - Compare versions side-by-side
 * - Export version history report
 * - Collaborative change tracking
 */

import React, { useEffect, useState } from 'react';
import {
  AccountCircle as UserIcon,
  CompareArrows as CompareIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  RestoreFromTrash as RestoreIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';

import {
  EditorHistoryState,
  InteractiveRedaction,
} from './InteractiveRedactionCanvas';

interface RedactionVersion {
  id: string;
  recordId: string;
  fileName: string;
  pageNumber: number;
  redactions: InteractiveRedaction[];
  timestamp: string;
  createdBy: string;
  createdByName?: string;
  action: string;
  description?: string;
  thumbnail?: string;
  status: 'draft' | 'saved' | 'approved' | 'exported';
  approvedBy?: string;
  approvedAt?: string;
  changeCount: number;
  qualityScore?: number;
}

interface RedactionHistoryManagerProps {
  open: boolean;
  onClose: () => void;
  history: EditorHistoryState[];
  currentRedactions: InteractiveRedaction[];
  onRestoreVersion: (redactions: InteractiveRedaction[]) => void;
  recordId: string;
  fileName: string;
  pageNumber: number;
  readOnly?: boolean;
}

export const RedactionHistoryManager: React.FC<
  RedactionHistoryManagerProps
> = ({
  open,
  onClose,
  history,
  currentRedactions,
  onRestoreVersion,
  recordId,
  fileName,
  pageNumber,
  readOnly = false,
}) => {
  const [versions, setVersions] = useState<RedactionVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  // Convert history states to versions
  useEffect(() => {
    const convertedVersions: RedactionVersion[] = history.map(
      (state, index) => {
        const changeCount =
          index === 0
            ? state.redactions.length
            : Math.abs(
                state.redactions.length - history[index - 1].redactions.length
              );

        return {
          id: state.id,
          recordId,
          fileName,
          pageNumber,
          redactions: state.redactions,
          timestamp: new Date(state.timestamp).toISOString(),
          createdBy: 'current_user', // TODO: Get from auth context
          createdByName: 'Current User',
          action: state.action,
          description: generateVersionDescription(
            state,
            index > 0 ? history[index - 1] : null
          ),
          status: index === history.length - 1 ? 'draft' : 'saved',
          changeCount,
          qualityScore: calculateVersionQuality(state.redactions),
        };
      }
    );

    setVersions(convertedVersions.reverse()); // Show most recent first
  }, [history, recordId, fileName, pageNumber]);

  /**
   * Generate human-readable description of changes
   */
  const generateVersionDescription = (
    currentState: EditorHistoryState,
    previousState: EditorHistoryState | null
  ): string => {
    if (!previousState) {
      return `Initial version with ${currentState.redactions.length} redactions`;
    }

    const currentCount = currentState.redactions.length;
    const previousCount = previousState.redactions.length;
    const diff = currentCount - previousCount;

    if (diff > 0) {
      return `Added ${diff} redaction${diff === 1 ? '' : 's'}`;
    } else if (diff < 0) {
      return `Removed ${Math.abs(diff)} redaction${Math.abs(diff) === 1 ? '' : 's'}`;
    } else {
      return 'Modified existing redactions';
    }
  };

  /**
   * Calculate quality score for a version
   */
  const calculateVersionQuality = (
    redactions: InteractiveRedaction[]
  ): number => {
    if (redactions.length === 0) return 0;

    // Simple quality calculation based on redaction properties
    const scores = redactions.map(redaction => {
      let score = 50; // Base score

      // Bonus for AI-suggested redactions with high confidence
      if (redaction.isAISuggested && redaction.confidenceScore) {
        score += redaction.confidenceScore * 0.3;
      }

      // Bonus for having a reason
      if (redaction.reason) {
        score += 10;
      }

      // Bonus for appropriate size (not too small or too large)
      const area = redaction.width * redaction.height;
      if (area > 100 && area < 10000) {
        score += 10;
      }

      return Math.min(100, score);
    });

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
  };

  /**
   * Restore a specific version
   */
  const restoreVersion = async (version: RedactionVersion) => {
    if (readOnly) return;

    try {
      setLoading(true);
      onRestoreVersion(version.redactions);

      // Close dialog after successful restore
      setTimeout(() => {
        onClose();
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to restore version:', error);
      setLoading(false);
    }
  };

  /**
   * Select versions for comparison
   */
  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        // Replace the first selected with the new one
        return [prev[1], versionId];
      }
    });
  };

  /**
   * Compare selected versions
   */
  const compareVersions = () => {
    if (selectedVersions.length === 2) {
      setShowComparison(true);
    }
  };

  /**
   * Export version history
   */
  const exportHistory = () => {
    const exportData = {
      recordId,
      fileName,
      pageNumber,
      exportedAt: new Date().toISOString(),
      versions: versions.map(version => ({
        ...version,
        redactions: version.redactions.length,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `redaction-history-${recordId}-${fileName}-page${pageNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: RedactionVersion['status']) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'saved':
        return 'primary';
      case 'approved':
        return 'success';
      case 'exported':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Card sx={{ m: 0, borderRadius: 0, height: '100%' }}>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={1}>
                <HistoryIcon />
                <Typography variant='h6'>Version History</Typography>
              </Box>
            }
            subheader={`${versions.length} version(s)`}
            action={
              <Stack direction='row' spacing={1}>
                <Button
                  size='small'
                  startIcon={<CompareIcon />}
                  disabled={selectedVersions.length !== 2}
                  onClick={compareVersions}
                >
                  Compare
                </Button>
                <IconButton
                  size='small'
                  onClick={exportHistory}
                  title='Export History'
                >
                  <DownloadIcon />
                </IconButton>
              </Stack>
            }
          />

          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {versions.length === 0 ? (
              <Box p={3} textAlign='center'>
                <Typography color='text.secondary'>
                  No version history available
                </Typography>
              </Box>
            ) : (
              <List>
                {versions.map((version, index) => (
                  <React.Fragment key={version.id}>
                    <ListItem
                      sx={{
                        bgcolor: selectedVersions.includes(version.id)
                          ? 'action.selected'
                          : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleVersionSelection(version.id)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <UserIcon />
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={1}
                            mb={0.5}
                          >
                            <Typography variant='body2' fontWeight='medium'>
                              {version.action}
                            </Typography>
                            <Chip
                              size='small'
                              label={version.status}
                              color={getStatusColor(version.status)}
                            />
                            {version.qualityScore && (
                              <Chip
                                size='small'
                                label={`${version.qualityScore}%`}
                                color={
                                  version.qualityScore > 80
                                    ? 'success'
                                    : 'warning'
                                }
                                variant='outlined'
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant='caption' display='block'>
                              {version.description}
                            </Typography>
                            <Box
                              display='flex'
                              alignItems='center'
                              gap={1}
                              mt={0.5}
                            >
                              <PersonIcon fontSize='small' />
                              <Typography variant='caption'>
                                {version.createdByName || version.createdBy}
                              </Typography>
                              <ScheduleIcon fontSize='small' />
                              <Typography variant='caption'>
                                {formatDistanceToNow(
                                  new Date(version.timestamp)
                                )}{' '}
                                ago
                              </Typography>
                            </Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {format(new Date(version.timestamp), 'PPpp')}
                            </Typography>
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <Stack direction='row' spacing={1}>
                          <Tooltip title='View Version'>
                            <IconButton size='small'>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {!readOnly && (
                            <Tooltip title='Restore Version'>
                              <IconButton
                                size='small'
                                onClick={e => {
                                  e.stopPropagation();
                                  restoreVersion(version);
                                }}
                                disabled={loading}
                              >
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>

                    {index < versions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Drawer>

      {/* Version comparison dialog */}
      <Dialog
        open={showComparison}
        onClose={() => setShowComparison(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>Compare Versions</DialogTitle>
        <DialogContent>
          {selectedVersions.length === 2 && (
            <Stack spacing={2}>
              <Alert severity='info'>
                Comparing versions: Select redactions to see detailed
                differences
              </Alert>

              <Box display='flex' gap={2}>
                {selectedVersions.map((versionId, index) => {
                  const version = versions.find(v => v.id === versionId);
                  if (!version) return null;

                  return (
                    <Card key={versionId} sx={{ flex: 1 }}>
                      <CardHeader
                        title={`Version ${index + 1}`}
                        subheader={version.action}
                      />
                      <CardContent>
                        <Typography variant='body2' gutterBottom>
                          {version.description}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {version.redactions.length} redactions
                        </Typography>
                        <Typography variant='caption' display='block'>
                          {format(new Date(version.timestamp), 'PPpp')}
                        </Typography>
                        {version.qualityScore && (
                          <Chip
                            size='small'
                            label={`Quality: ${version.qualityScore}%`}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              <Box>
                <Typography variant='h6' gutterBottom>
                  Changes Summary
                </Typography>
                {(() => {
                  const version1 = versions.find(
                    v => v.id === selectedVersions[0]
                  );
                  const version2 = versions.find(
                    v => v.id === selectedVersions[1]
                  );

                  if (!version1 || !version2) return null;

                  const diff =
                    version2.redactions.length - version1.redactions.length;

                  return (
                    <Stack spacing={1}>
                      <Typography variant='body2'>
                        Redactions: {version1.redactions.length} →{' '}
                        {version2.redactions.length}
                        {diff !== 0 && (
                          <Chip
                            size='small'
                            label={diff > 0 ? `+${diff}` : `${diff}`}
                            color={diff > 0 ? 'success' : 'error'}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>

                      {version1.qualityScore && version2.qualityScore && (
                        <Typography variant='body2'>
                          Quality Score: {version1.qualityScore}% →{' '}
                          {version2.qualityScore}%
                          <Chip
                            size='small'
                            label={
                              version2.qualityScore > version1.qualityScore
                                ? `+${version2.qualityScore - version1.qualityScore}%`
                                : `${version2.qualityScore - version1.qualityScore}%`
                            }
                            color={
                              version2.qualityScore > version1.qualityScore
                                ? 'success'
                                : 'error'
                            }
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      )}
                    </Stack>
                  );
                })()}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComparison(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
