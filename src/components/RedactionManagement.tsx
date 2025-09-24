// Redaction Management UI Component
// Provides interface for viewing, editing, and managing redaction versions
// Includes save/export capabilities and version history

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Divider,
  Badge,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Download as ExportIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import {
  ManualRedaction,
  RedactionVersion,
  RedactionSummary,
  redactionService,
} from '../services/redactionService';

interface RedactionManagementProps {
  recordId: string;
  fileName: string;
  currentRedactions: ManualRedaction[];
  onVersionLoad?: (redactions: ManualRedaction[]) => void;
  onRedactionSelect?: (redaction: ManualRedaction | null) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`redaction-tabpanel-${index}`}
    aria-labelledby={`redaction-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export const RedactionManagement: React.FC<RedactionManagementProps> = ({
  recordId,
  fileName,
  currentRedactions,
  onVersionLoad,
  onRedactionSelect,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [versions, setVersions] = useState<RedactionVersion[]>([]);
  const [summary, setSummary] = useState<RedactionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [versionNotes, setVersionNotes] = useState<string>('');
  const [selectedRedaction, setSelectedRedaction] = useState<ManualRedaction | null>(null);
  const [redactionDetailsOpen, setRedactionDetailsOpen] = useState<boolean>(false);

  // Load data when component mounts or props change
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, recordId, fileName]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [versionsResult, summaryResult] = await Promise.all([
        redactionService.getVersionHistory(recordId, fileName),
        redactionService.getRedactionSummary(recordId, fileName),
      ]);
      
      setVersions(versionsResult);
      setSummary(summaryResult);
    } catch (err) {
      setError('Failed to load redaction data');
      console.error('Error loading redaction data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSaveVersion = async () => {
    try {
      setLoading(true);
      const newVersion = await redactionService.saveVersion(recordId, fileName, versionNotes);
      setVersions((prev) => [newVersion, ...prev]);
      setSaveDialogOpen(false);
      setVersionNotes('');
      await loadData(); // Refresh summary
    } catch (err) {
      setError('Failed to save version');
      console.error('Error saving version:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVersion = async (versionId: string) => {
    try {
      setLoading(true);
      const redactions = await redactionService.loadVersion(recordId, fileName, versionId);
      onVersionLoad?.(redactions);
      setOpen(false);
    } catch (err) {
      setError('Failed to load version');
      console.error('Error loading version:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportVersion = async (version: RedactionVersion) => {
    try {
      // Mark as exported
      await redactionService.markVersionExported(recordId, fileName, version.versionId);
      
      // Create export data
      const exportData = {
        recordId,
        fileName,
        version: version.versionId,
        timestamp: new Date().toISOString(),
        redactions: version.redactions.map(r => ({
          id: r.id,
          pageNumber: r.pageNumber,
          coordinates: {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          },
          reason: r.reason,
          createdAt: r.createdAt,
          createdBy: r.createdBy,
        })),
        summary: {
          totalRedactions: version.redactions.length,
          byPage: version.redactions.reduce((acc, r) => {
            acc[r.pageNumber] = (acc[r.pageNumber] || 0) + 1;
            return acc;
          }, {} as Record<number, number>),
        },
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `redactions_${recordId}_${fileName}_${version.versionId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Refresh data
      await loadData();
    } catch (err) {
      setError('Failed to export version');
      console.error('Error exporting version:', err);
    }
  };

  const handleRedactionClick = (redaction: ManualRedaction) => {
    setSelectedRedaction(redaction);
    setRedactionDetailsOpen(true);
    onRedactionSelect?.(redaction);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: RedactionVersion['status']) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'saved':
        return 'success';
      case 'exported':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outlined"
        startIcon={<HistoryIcon />}
        onClick={handleOpen}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={versions.length} color="primary">
          Manage Redactions
        </Badge>
      </Button>

      {/* Main Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Redaction Management: {fileName}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => setSaveDialogOpen(true)}
                disabled={currentRedactions.length === 0}
              >
                Save Current Version
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Current Session" />
              <Tab label="Version History" />
              <Tab label="Summary" />
            </Tabs>
          </Box>

          {/* Current Session Tab */}
          <TabPanel value={activeTab} index={0}>
            <Stack spacing={2}>
              <Typography variant="h6">Current Redactions</Typography>
              
              {currentRedactions.length === 0 ? (
                <Alert severity="info">
                  No redactions in the current session. Switch to redaction mode and draw boxes to create redactions.
                </Alert>
              ) : (
                <List>
                  {currentRedactions.map((redaction) => (
                    <ListItem
                      key={redaction.id}
                      divider
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                      onClick={() => handleRedactionClick(redaction)}
                    >
                      <ListItemText
                        primary={`Page ${redaction.pageNumber} - Redaction ${redaction.id.slice(-8)}`}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              Position: ({Math.round(redaction.x)}, {Math.round(redaction.y)}) 
                              Size: {Math.round(redaction.width)} × {Math.round(redaction.height)}
                            </Typography>
                            {redaction.reason && (
                              <Typography variant="body2" color="text.secondary">
                                Reason: {redaction.reason}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Created: {formatDate(redaction.createdAt)} by {redaction.createdBy}
                            </Typography>
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRedactionClick(redaction);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>
          </TabPanel>

          {/* Version History Tab */}
          <TabPanel value={activeTab} index={1}>
            <Stack spacing={2}>
              <Typography variant="h6">Version History</Typography>
              
              {versions.length === 0 ? (
                <Alert severity="info">
                  No saved versions yet. Save your current redactions to create the first version.
                </Alert>
              ) : (
                <List>
                  {versions.map((version) => (
                    <ListItem key={version.versionId} divider>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1">
                              Version {version.versionId.slice(-8)}
                            </Typography>
                            <Chip
                              size="small"
                              label={version.status}
                              color={getStatusColor(version.status) as any}
                            />
                            <Chip
                              size="small"
                              label={`${version.redactions.length} redactions`}
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              Created: {formatDate(version.timestamp)} by {version.createdBy}
                            </Typography>
                            {version.notes && (
                              <Typography variant="body2" color="text.secondary">
                                Notes: {version.notes}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Load this version">
                            <IconButton
                              onClick={() => handleLoadVersion(version.versionId)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {version.status !== 'exported' && (
                            <Tooltip title="Export version">
                              <IconButton
                                onClick={() => handleExportVersion(version)}
                                color="secondary"
                              >
                                <ExportIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>
          </TabPanel>

          {/* Summary Tab */}
          <TabPanel value={activeTab} index={2}>
            <Stack spacing={3}>
              <Typography variant="h6">Redaction Summary</Typography>
              
              {summary ? (
                <>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {summary.totalRedactions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Redactions
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Redactions by Page
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(summary.byPage).map(([page, count]) => (
                          <Stack key={page} direction="row" justifyContent="space-between">
                            <Typography variant="body2">Page {page}</Typography>
                            <Chip size="small" label={count} />
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Version Information
                      </Typography>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Current Version</Typography>
                          <Typography variant="body2" fontFamily="monospace">
                            {summary.currentVersion.slice(-8) || 'None'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Total Versions</Typography>
                          <Typography variant="body2">{summary.versions.length}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Last Modified</Typography>
                          <Typography variant="body2">
                            {formatDate(summary.lastModified)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Alert severity="info">
                  Loading summary data...
                </Alert>
              )}
            </Stack>
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Save Version Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Current Version</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              This will save {currentRedactions.length} redactions as a new version.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Version Notes (optional)"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="Describe the changes or purpose of this version..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveVersion}
            variant="contained"
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            Save Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redaction Details Dialog */}
      <Dialog
        open={redactionDetailsOpen}
        onClose={() => setRedactionDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Redaction Details</DialogTitle>
        <DialogContent>
          {selectedRedaction && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">ID</Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {selectedRedaction.id}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Page</Typography>
                      <Typography variant="body2">{selectedRedaction.pageNumber}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Position</Typography>
                      <Typography variant="body2">
                        ({Math.round(selectedRedaction.x)}, {Math.round(selectedRedaction.y)})
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Size</Typography>
                      <Typography variant="body2">
                        {Math.round(selectedRedaction.width)} × {Math.round(selectedRedaction.height)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Type</Typography>
                      <Chip size="small" label={selectedRedaction.type} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography variant="body2">
                        {formatDate(selectedRedaction.createdAt)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Created By</Typography>
                      <Typography variant="body2">{selectedRedaction.createdBy}</Typography>
                    </Stack>
                    {selectedRedaction.reason && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Reason
                        </Typography>
                        <Typography variant="body2">{selectedRedaction.reason}</Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedactionDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RedactionManagement;