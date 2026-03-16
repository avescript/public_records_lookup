/**
 * Enhanced Data Management Component
 * Epic 8: Synthetic Data & Public Domain Corpus
 * Admin interface for managing synthetic datasets and enhanced AI matching
 */

import React, { useEffect, useState } from 'react';
import {
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Science as ScienceIcon,
  Storage as StorageIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { SYNTHETIC_AGENCIES } from '../../data/syntheticDataTemplates';
import enhancedAIMatchingService from '../../services/enhancedAIMatchingService';

interface DatasetStats {
  metadata: {
    generatedAt: string;
    version: string;
    totalRequests: number;
    totalDocuments: number;
    agencies: string[];
    complexity: {
      simple: number;
      medium: number;
      complex: number;
    };
    testScenarios: string[];
  };
  analytics: {
    requestsByAgency: Record<string, number>;
    documentsByAgency: Record<string, number>;
    complexityDistribution: Record<string, number>;
    averageExpectedMatches: number;
  };
}

interface GenerateOptions {
  requestCount: number;
  documentsPerAgency: number;
  includeEdgeCases: boolean;
  includePerformanceData: boolean;
}

export default function EnhancedDataManagement() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
    requestCount: 100,
    documentsPerAgency: 85,
    includeEdgeCases: true,
    includePerformanceData: true,
  });

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const analytics = enhancedAIMatchingService.getDatasetAnalytics();
      if (analytics) {
        setStats(analytics);
        setInitialized(true);
      } else {
        setInitialized(false);
      }
    } catch (error) {
      console.error('Error checking initialization status:', error);
      setInitialized(false);
    }
  };

  const handleInitializeDataset = async () => {
    setLoading(true);
    setError(null);

    try {
      await enhancedAIMatchingService.initialize(generateOptions);
      const analytics = enhancedAIMatchingService.getDatasetAnalytics();
      setStats(analytics);
      setInitialized(true);
      setGenerateDialogOpen(false);

      console.log('✅ Enhanced synthetic dataset initialized successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to initialize dataset'
      );
      console.error('❌ Failed to initialize dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateDataset = async () => {
    setLoading(true);
    setError(null);

    try {
      await enhancedAIMatchingService.regenerateData(generateOptions);
      const analytics = enhancedAIMatchingService.getDatasetAnalytics();
      setStats(analytics);
      setGenerateDialogOpen(false);

      console.log('✅ Enhanced synthetic dataset regenerated successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to regenerate dataset'
      );
      console.error('❌ Failed to regenerate dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMatching = async () => {
    if (!initialized) {
      setError('Dataset not initialized. Please initialize first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const testQuery =
        'police incident reports use of force body camera footage';
      const result = await enhancedAIMatchingService.findMatches(
        'test-request',
        testQuery,
        {
          maxResults: 5,
          minConfidence: 0.5,
        }
      );

      console.log('🧪 Test matching result:', result);
      alert(
        `Test matching completed successfully!\n\nFound ${result.candidates.length} matches in ${result.searchMetadata.processingTimeMs}ms\n\nCheck console for detailed results.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAgencyDetails = (agencyId: string) => {
    setSelectedAgency(agencyId);
    setDetailsDialogOpen(true);
  };

  const handleExportData = () => {
    if (!stats) return;

    const dataToExport = {
      stats,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthetic-dataset-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'success';
      case 'medium':
        return 'warning';
      case 'complex':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!initialized && !loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ScienceIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant='h5' gutterBottom>
              Enhanced Synthetic Data Generator v2
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
              Initialize the enhanced synthetic dataset with multi-agency
              support
            </Typography>
            <Button
              variant='contained'
              startIcon={<StorageIcon />}
              onClick={() => setGenerateDialogOpen(true)}
              size='large'
            >
              Initialize Dataset
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4' component='h1'>
          Enhanced Data Management v2
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => setGenerateDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Regenerate
          </Button>
          <Button
            startIcon={<ScienceIcon />}
            onClick={handleTestMatching}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            Test Matching
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
            disabled={!stats}
          >
            Export Stats
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {stats && (
        <Grid container spacing={3}>
          {/* Overview Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant='h6'
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <AssessmentIcon sx={{ mr: 1 }} />
                  Dataset Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant='h4' color='primary'>
                        {stats.metadata.totalRequests}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total Requests
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant='h4' color='secondary'>
                        {stats.metadata.totalDocuments}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total Documents
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant='h4' color='success.main'>
                        {stats.metadata.agencies.length}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Agencies
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant='h4' color='info.main'>
                        {stats.analytics.averageExpectedMatches.toFixed(1)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Avg Matches/Request
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant='body2' color='text.secondary'>
                      Generated: {formatDate(stats.metadata.generatedAt)}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Version: {stats.metadata.version}
                    </Typography>
                  </Box>
                  <Box>
                    {Object.entries(stats.metadata.complexity).map(
                      ([complexity, count]) => (
                        <Chip
                          key={complexity}
                          label={`${complexity}: ${count}`}
                          color={getComplexityColor(complexity) as any}
                          size='small'
                          sx={{ mr: 1 }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Agency Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant='h6'
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <AnalyticsIcon sx={{ mr: 1 }} />
                  Requests by Agency
                </Typography>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agency</TableCell>
                        <TableCell align='right'>Requests</TableCell>
                        <TableCell align='right'>Documents</TableCell>
                        <TableCell align='center'>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {SYNTHETIC_AGENCIES.map(agency => (
                        <TableRow key={agency.id}>
                          <TableCell>
                            <Typography variant='body2' fontWeight='medium'>
                              {agency.name}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {agency.departments.length} departments
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            {stats.analytics.requestsByAgency[agency.id] || 0}
                          </TableCell>
                          <TableCell align='right'>
                            {stats.analytics.documentsByAgency[agency.id] || 0}
                          </TableCell>
                          <TableCell align='center'>
                            <Tooltip title='View Details'>
                              <IconButton
                                size='small'
                                onClick={() =>
                                  handleViewAgencyDetails(agency.id)
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Test Scenarios */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Test Scenarios
                </Typography>
                <List dense>
                  {stats.metadata.testScenarios.map((scenario, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={scenario.replace(/_/g, ' ').toUpperCase()}
                        secondary={`Scenario type: ${scenario.split('_')[0]}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          size='small'
                          label='Available'
                          color='success'
                          variant='outlined'
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Generate Dataset Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {initialized
            ? 'Regenerate Enhanced Dataset'
            : 'Initialize Enhanced Dataset'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Configure the synthetic data generation parameters for multi-agency
            testing.
          </Typography>

          <TextField
            label='Number of Requests'
            type='number'
            value={generateOptions.requestCount}
            onChange={e =>
              setGenerateOptions(prev => ({
                ...prev,
                requestCount: parseInt(e.target.value) || 100,
              }))
            }
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label='Documents per Agency'
            type='number'
            value={generateOptions.documentsPerAgency}
            onChange={e =>
              setGenerateOptions(prev => ({
                ...prev,
                documentsPerAgency: parseInt(e.target.value) || 85,
              }))
            }
            fullWidth
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={generateOptions.includeEdgeCases}
                onChange={e =>
                  setGenerateOptions(prev => ({
                    ...prev,
                    includeEdgeCases: e.target.checked,
                  }))
                }
              />
            }
            label='Include Edge Cases'
            sx={{ display: 'block', mb: 1 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={generateOptions.includePerformanceData}
                onChange={e =>
                  setGenerateOptions(prev => ({
                    ...prev,
                    includePerformanceData: e.target.checked,
                  }))
                }
              />
            }
            label='Include Performance Test Data'
            sx={{ display: 'block' }}
          />

          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mt: 2, display: 'block' }}
          >
            Estimated generation time:{' '}
            {Math.ceil(
              (generateOptions.requestCount +
                generateOptions.documentsPerAgency * 6) /
                100
            )}{' '}
            seconds
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={
              initialized ? handleRegenerateDataset : handleInitializeDataset
            }
            variant='contained'
            disabled={loading}
          >
            {loading
              ? 'Generating...'
              : initialized
                ? 'Regenerate'
                : 'Initialize'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Agency Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Agency Details:{' '}
          {selectedAgency &&
            SYNTHETIC_AGENCIES.find(a => a.id === selectedAgency)?.name}
        </DialogTitle>
        <DialogContent>
          {selectedAgency && (
            <Box>
              {(() => {
                const agency = SYNTHETIC_AGENCIES.find(
                  a => a.id === selectedAgency
                );
                if (!agency) return null;

                const requestCount =
                  stats?.analytics.requestsByAgency[selectedAgency] || 0;
                const documentCount =
                  stats?.analytics.documentsByAgency[selectedAgency] || 0;

                return (
                  <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Typography variant='h6' color='primary'>
                          {requestCount}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Generated Requests
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant='h6' color='secondary'>
                          {documentCount}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Generated Documents
                        </Typography>
                      </Grid>
                    </Grid>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                          Departments ({agency.departments.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {agency.departments.map((dept, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={dept.replace(/_/g, ' ').toUpperCase()}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Common Request Types</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {agency.commonRequestTypes.map((type, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={type.replace(/_/g, ' ').toUpperCase()}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Average Response Time: {agency.averageResponseTime}{' '}
                        business days
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Complexity Weight:{' '}
                        {(agency.complexityWeight * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
