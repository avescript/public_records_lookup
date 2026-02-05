import React, { useCallback, useMemo, useState } from 'react';
import {
  Archive as ArchiveIcon,
  Assignment as AssignIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Download as ExportIcon,
  Email as EmailIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Group as BatchIcon,
  Info as InfoIcon,
  Label as TagIcon,
  Pause as PauseIcon,
  PlayArrow as StartIcon,
  Schedule as ScheduleIcon,
  Stop as StopIcon,
  Update as UpdateIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useRecordSelection } from '../../../contexts/RecordSelectionContext';
import { EnhancedMatchCandidate } from '../../../types/enhanced-search';

interface BatchOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'export' | 'update' | 'notification' | 'workflow' | 'archive';
  requiresApproval?: boolean;
  estimatedTimePerRecord?: number; // seconds
  permissions?: string[];
}

interface BatchJobConfig {
  operation: BatchOperation;
  parameters: Record<string, any>;
  recordIds: string[];
  priority: 'low' | 'medium' | 'high';
  scheduledTime?: Date;
  notifyOnComplete?: boolean;
  approvalRequired?: boolean;
}

interface BatchJobStatus {
  id: string;
  config: BatchJobConfig;
  status:
    | 'pending'
    | 'running'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: number;
  processedCount: number;
  totalCount: number;
  startTime?: Date;
  endTime?: Date;
  results?: BatchJobResult[];
  errors?: BatchJobError[];
}

interface BatchJobResult {
  recordId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

interface BatchJobError {
  recordId?: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

interface BatchProcessingSystemProps {
  open: boolean;
  onClose: () => void;
  selectedRecords?: EnhancedMatchCandidate[];
  onJobCreated?: (job: BatchJobStatus) => void;
}

const BATCH_OPERATIONS: BatchOperation[] = [
  {
    id: 'export-pdf',
    name: 'Export to PDF',
    description: 'Generate PDF documents for selected records',
    icon: <ExportIcon />,
    category: 'export',
    estimatedTimePerRecord: 3,
  },
  {
    id: 'export-csv',
    name: 'Export to CSV',
    description: 'Export record metadata to CSV format',
    icon: <ExportIcon />,
    category: 'export',
    estimatedTimePerRecord: 1,
  },
  {
    id: 'update-status',
    name: 'Update Status',
    description: 'Bulk update record status',
    icon: <UpdateIcon />,
    category: 'update',
    requiresApproval: true,
    estimatedTimePerRecord: 2,
    permissions: ['records.update'],
  },
  {
    id: 'add-tags',
    name: 'Add Tags',
    description: 'Add tags to multiple records',
    icon: <TagIcon />,
    category: 'update',
    estimatedTimePerRecord: 1,
    permissions: ['records.update'],
  },
  {
    id: 'assign-reviewer',
    name: 'Assign Reviewer',
    description: 'Assign records to specific reviewers',
    icon: <AssignIcon />,
    category: 'workflow',
    requiresApproval: true,
    estimatedTimePerRecord: 1,
    permissions: ['workflow.assign'],
  },
  {
    id: 'send-notification',
    name: 'Send Notification',
    description: 'Send notifications about selected records',
    icon: <EmailIcon />,
    category: 'notification',
    estimatedTimePerRecord: 2,
    permissions: ['notifications.send'],
  },
  {
    id: 'archive-records',
    name: 'Archive Records',
    description: 'Move records to archive storage',
    icon: <ArchiveIcon />,
    category: 'archive',
    requiresApproval: true,
    estimatedTimePerRecord: 5,
    permissions: ['records.archive'],
  },
];

export const BatchProcessingSystem: React.FC<BatchProcessingSystemProps> = ({
  open,
  onClose,
  selectedRecords,
  onJobCreated,
}) => {
  const { selectedRecords: contextRecords, clearSelection } =
    useRecordSelection();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedOperation, setSelectedOperation] =
    useState<BatchOperation | null>(null);
  const [jobConfig, setJobConfig] = useState<Partial<BatchJobConfig>>({});
  const [jobStatus, setJobStatus] = useState<BatchJobStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Use provided records or context records
  const targetRecords = useMemo(
    () => selectedRecords || contextRecords,
    [selectedRecords, contextRecords]
  );

  const estimatedTotalTime = useMemo(() => {
    if (!selectedOperation || !targetRecords.length) return 0;
    return (
      (selectedOperation.estimatedTimePerRecord || 1) * targetRecords.length
    );
  }, [selectedOperation, targetRecords.length]);

  const handleOperationSelect = (operation: BatchOperation) => {
    setSelectedOperation(operation);
    setJobConfig({
      operation,
      recordIds: targetRecords.map(r => r.id),
      priority: 'medium',
      notifyOnComplete: true,
      approvalRequired: operation.requiresApproval,
    });
    setActiveStep(1);
  };

  const handleConfigUpdate = (updates: Partial<BatchJobConfig>) => {
    setJobConfig(prev => ({ ...prev, ...updates }));
  };

  const handleStartJob = async () => {
    if (!selectedOperation || !jobConfig.recordIds?.length) return;

    const job: BatchJobStatus = {
      id: `batch-${Date.now()}`,
      config: jobConfig as BatchJobConfig,
      status: 'pending',
      progress: 0,
      processedCount: 0,
      totalCount: jobConfig.recordIds.length,
      results: [],
      errors: [],
    };

    setJobStatus(job);
    setIsRunning(true);
    setActiveStep(2);

    // Simulate batch processing
    await simulateBatchExecution(job);
    onJobCreated?.(job);
  };

  const simulateBatchExecution = async (job: BatchJobStatus) => {
    const updateStatus = (updates: Partial<BatchJobStatus>) => {
      setJobStatus(prev => (prev ? { ...prev, ...updates } : null));
    };

    updateStatus({ status: 'running', startTime: new Date() });

    for (let i = 0; i < job.totalCount; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      const recordId = job.config.recordIds[i];
      const success = Math.random() > 0.1; // 90% success rate

      const result: BatchJobResult = {
        recordId,
        success,
        result: success ? `Processed ${selectedOperation?.name}` : undefined,
        error: success
          ? undefined
          : `Failed to process ${selectedOperation?.name}`,
        duration: Math.random() * 2 + 0.5,
      };

      if (!success) {
        const error: BatchJobError = {
          recordId,
          error: result.error!,
          timestamp: new Date(),
          recoverable: true,
        };
        updateStatus({
          errors: [...(job.errors || []), error],
        });
      }

      updateStatus({
        progress: ((i + 1) / job.totalCount) * 100,
        processedCount: i + 1,
        results: [...(job.results || []), result],
      });
    }

    const hasErrors = job.errors && job.errors.length > 0;
    updateStatus({
      status: hasErrors ? 'completed' : 'completed',
      endTime: new Date(),
      progress: 100,
    });

    setIsRunning(false);
    setActiveStep(3);
  };

  const renderOperationSelection = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Select Batch Operation
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Choose the operation to perform on {targetRecords.length} selected
        records
      </Typography>

      <Grid container spacing={2}>
        {BATCH_OPERATIONS.map(operation => (
          <Grid item xs={12} md={6} key={operation.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedOperation?.id === operation.id ? 2 : 1,
                borderColor:
                  selectedOperation?.id === operation.id
                    ? 'primary.main'
                    : 'divider',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleOperationSelect(operation)}
            >
              <CardContent>
                <Stack direction='row' spacing={2} alignItems='flex-start'>
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}>
                    {operation.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' gutterBottom>
                      {operation.name}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      {operation.description}
                    </Typography>
                    <Stack direction='row' spacing={1}>
                      <Chip
                        label={operation.category}
                        size='small'
                        variant='outlined'
                      />
                      {operation.requiresApproval && (
                        <Chip
                          label='Requires Approval'
                          size='small'
                          color='warning'
                          variant='outlined'
                        />
                      )}
                      {operation.estimatedTimePerRecord && (
                        <Chip
                          label={`~${operation.estimatedTimePerRecord}s per record`}
                          size='small'
                          variant='outlined'
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderJobConfiguration = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Configure Batch Job
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Set parameters for &quot;{selectedOperation?.name}&quot; on{' '}
        {targetRecords.length} records
      </Typography>

      <Stack spacing={3}>
        {/* Basic Configuration */}
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={jobConfig.priority || 'medium'}
            label='Priority'
            onChange={e =>
              handleConfigUpdate({ priority: e.target.value as any })
            }
          >
            <MenuItem value='low'>Low</MenuItem>
            <MenuItem value='medium'>Medium</MenuItem>
            <MenuItem value='high'>High</MenuItem>
          </Select>
        </FormControl>

        {/* Operation-specific parameters */}
        {selectedOperation?.id === 'update-status' && (
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select
              value={jobConfig.parameters?.newStatus || ''}
              label='New Status'
              onChange={e =>
                handleConfigUpdate({
                  parameters: {
                    ...jobConfig.parameters,
                    newStatus: e.target.value,
                  },
                })
              }
            >
              <MenuItem value='approved'>Approved</MenuItem>
              <MenuItem value='rejected'>Rejected</MenuItem>
              <MenuItem value='pending'>Pending Review</MenuItem>
              <MenuItem value='archived'>Archived</MenuItem>
            </Select>
          </FormControl>
        )}

        {selectedOperation?.id === 'add-tags' && (
          <TextField
            fullWidth
            label='Tags (comma-separated)'
            placeholder='tag1, tag2, tag3'
            value={jobConfig.parameters?.tags || ''}
            onChange={e =>
              handleConfigUpdate({
                parameters: { ...jobConfig.parameters, tags: e.target.value },
              })
            }
          />
        )}

        {selectedOperation?.id === 'assign-reviewer' && (
          <FormControl fullWidth>
            <InputLabel>Reviewer</InputLabel>
            <Select
              value={jobConfig.parameters?.reviewerId || ''}
              label='Reviewer'
              onChange={e =>
                handleConfigUpdate({
                  parameters: {
                    ...jobConfig.parameters,
                    reviewerId: e.target.value,
                  },
                })
              }
            >
              <MenuItem value='user1'>John Smith</MenuItem>
              <MenuItem value='user2'>Jane Doe</MenuItem>
              <MenuItem value='user3'>Bob Johnson</MenuItem>
            </Select>
          </FormControl>
        )}

        {selectedOperation?.id.startsWith('export-') && (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label='Export Filename'
              placeholder={`batch_export_${Date.now()}`}
              value={jobConfig.parameters?.filename || ''}
              onChange={e =>
                handleConfigUpdate({
                  parameters: {
                    ...jobConfig.parameters,
                    filename: e.target.value,
                  },
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={jobConfig.parameters?.includeMetadata || false}
                  onChange={e =>
                    handleConfigUpdate({
                      parameters: {
                        ...jobConfig.parameters,
                        includeMetadata: e.target.checked,
                      },
                    })
                  }
                />
              }
              label='Include metadata'
            />
          </Stack>
        )}

        {/* Advanced Options */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Advanced Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={jobConfig.notifyOnComplete || false}
                    onChange={e =>
                      handleConfigUpdate({ notifyOnComplete: e.target.checked })
                    }
                  />
                }
                label='Send notification when complete'
              />

              <TextField
                fullWidth
                type='datetime-local'
                label='Schedule for later (optional)'
                InputLabelProps={{ shrink: true }}
                value={
                  jobConfig.scheduledTime
                    ? new Date(jobConfig.scheduledTime)
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
                onChange={e =>
                  handleConfigUpdate({
                    scheduledTime: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Summary */}
        <Paper variant='outlined' sx={{ p: 2 }}>
          <Typography variant='subtitle1' gutterBottom>
            Job Summary
          </Typography>
          <Stack spacing={1}>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>Operation:</Typography>
              <Typography variant='body2'>{selectedOperation?.name}</Typography>
            </Stack>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>Records:</Typography>
              <Typography variant='body2'>{targetRecords.length}</Typography>
            </Stack>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>Estimated Time:</Typography>
              <Typography variant='body2'>
                {Math.floor(estimatedTotalTime / 60)}m {estimatedTotalTime % 60}
                s
              </Typography>
            </Stack>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>Priority:</Typography>
              <Chip label={jobConfig.priority || 'medium'} size='small' />
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );

  const renderJobExecution = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Batch Job Execution
      </Typography>

      {jobStatus && (
        <Stack spacing={3}>
          {/* Progress Overview */}
          <Paper variant='outlined' sx={{ p: 2 }}>
            <Stack
              direction='row'
              alignItems='center'
              spacing={2}
              sx={{ mb: 2 }}
            >
              <BatchIcon color='primary' />
              <Box sx={{ flex: 1 }}>
                <Typography variant='subtitle1'>
                  {jobStatus.config.operation.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {jobStatus.processedCount} of {jobStatus.totalCount} records
                  processed
                </Typography>
              </Box>
              <Chip
                label={jobStatus.status}
                color={
                  jobStatus.status === 'completed'
                    ? 'success'
                    : jobStatus.status === 'failed'
                      ? 'error'
                      : jobStatus.status === 'running'
                        ? 'info'
                        : 'default'
                }
              />
            </Stack>

            <LinearProgress
              variant='determinate'
              value={jobStatus.progress}
              sx={{ mb: 1 }}
            />
            <Typography variant='caption' color='text.secondary'>
              {Math.round(jobStatus.progress)}% complete
            </Typography>
          </Paper>

          {/* Job Controls */}
          {jobStatus.status === 'running' && (
            <Stack direction='row' spacing={1} justifyContent='center'>
              <Button
                startIcon={<PauseIcon />}
                onClick={() => {
                  /* Implement pause */
                }}
              >
                Pause
              </Button>
              <Button
                startIcon={<StopIcon />}
                color='error'
                onClick={() => {
                  /* Implement stop */
                }}
              >
                Stop
              </Button>
            </Stack>
          )}

          {/* Results Summary */}
          {jobStatus.results && jobStatus.results.length > 0 && (
            <Accordion defaultExpanded={jobStatus.status === 'completed'}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  Results ({jobStatus.results.length} processed)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {jobStatus.results.slice(0, 10).map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {result.success ? (
                          <CheckIcon color='success' />
                        ) : (
                          <ErrorIcon color='error' />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`Record ${result.recordId}`}
                        secondary={
                          result.success ? result.result : result.error
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography variant='caption'>
                          {result.duration.toFixed(1)}s
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {jobStatus.results.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${jobStatus.results.length - 10} more`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Errors */}
          {jobStatus.errors && jobStatus.errors.length > 0 && (
            <Alert severity='warning'>
              <AlertTitle>
                {jobStatus.errors.length} Error(s) Occurred
              </AlertTitle>
              <List dense>
                {jobStatus.errors.slice(0, 5).map((error, index) => (
                  <ListItem key={index} dense>
                    <ListItemText
                      primary={error.error}
                      secondary={
                        error.recordId ? `Record: ${error.recordId}` : undefined
                      }
                    />
                  </ListItem>
                ))}
                {jobStatus.errors.length > 5 && (
                  <Typography variant='body2' sx={{ mt: 1 }}>
                    ... and {jobStatus.errors.length - 5} more errors
                  </Typography>
                )}
              </List>
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );

  const renderJobCompletion = () => (
    <Box textAlign='center'>
      <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant='h5' gutterBottom>
        Batch Job Completed
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Successfully processed {jobStatus?.processedCount} of{' '}
        {jobStatus?.totalCount} records
      </Typography>

      <Stack direction='row' spacing={2} justifyContent='center'>
        <Button
          variant='contained'
          startIcon={<ViewIcon />}
          onClick={() => {
            /* View detailed results */
          }}
        >
          View Results
        </Button>
        <Button
          variant='outlined'
          startIcon={<ExportIcon />}
          onClick={() => {
            /* Export results */
          }}
        >
          Export Report
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='body'>
      <DialogTitle>
        <Stack direction='row' alignItems='center' spacing={2}>
          <BatchIcon />
          <Typography variant='h6'>Batch Processing System</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation='vertical'>
          <Step>
            <StepLabel>Select Operation</StepLabel>
            <StepContent>{renderOperationSelection()}</StepContent>
          </Step>

          <Step>
            <StepLabel>Configure Job</StepLabel>
            <StepContent>{renderJobConfiguration()}</StepContent>
          </Step>

          <Step>
            <StepLabel>Execute Job</StepLabel>
            <StepContent>{renderJobExecution()}</StepContent>
          </Step>

          <Step>
            <StepLabel>Complete</StepLabel>
            <StepContent>{renderJobCompletion()}</StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {activeStep === 3 ? 'Close' : 'Cancel'}
        </Button>

        {activeStep === 0 && (
          <Button
            onClick={() => setActiveStep(1)}
            disabled={!selectedOperation}
            variant='contained'
          >
            Next
          </Button>
        )}

        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              onClick={handleStartJob}
              variant='contained'
              startIcon={<StartIcon />}
              disabled={isRunning}
            >
              {isRunning ? <CircularProgress size={20} /> : 'Start Job'}
            </Button>
          </>
        )}

        {activeStep === 2 && jobStatus?.status === 'running' && (
          <Button
            onClick={() => {
              /* Implement cancel */
            }}
            color='error'
          >
            Cancel Job
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchProcessingSystem;
