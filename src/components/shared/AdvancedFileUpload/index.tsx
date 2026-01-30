/**
 * Advanced Document Upload Component
 *
 * Enhanced file upload with OCR processing, batch handling, and agency-specific workflows.
 * Supports multiple file formats with real-time processing progress.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import {
  Business as AgencyIcon,
  CheckCircle as SuccessIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  GetApp as DownloadIcon,
  Schedule as ProcessingIcon,
  Search as OCRIcon,
  Security as PIIIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
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
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAgency } from '../../../contexts/AgencyContext';
import {
  advancedDocumentProcessingService,
  BatchProgress,
  DocumentFileType,
  DocumentProcessingResult,
  ProcessingStatus,
} from '../../../services/advancedDocumentProcessingService';

interface AdvancedFileUploadProps {
  onProcessingComplete?: (results: DocumentProcessingResult[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  enableOCR?: boolean;
  enablePIIDetection?: boolean;
  enableAgencyValidation?: boolean;
  showBatchProgress?: boolean;
}

interface ProcessingConfig {
  enableOCR: boolean;
  enablePIIDetection: boolean;
  enableAgencyValidation: boolean;
  maxConcurrent: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getStatusIcon = (status: ProcessingStatus) => {
  switch (status) {
    case ProcessingStatus.COMPLETED:
      return <SuccessIcon color='success' />;
    case ProcessingStatus.FAILED:
      return <ErrorIcon color='error' />;
    case ProcessingStatus.PROCESSING:
    case ProcessingStatus.OCR_EXTRACTING:
    case ProcessingStatus.PII_DETECTING:
    case ProcessingStatus.AGENCY_VALIDATING:
      return <ProcessingIcon color='primary' />;
    default:
      return <ProcessingIcon color='disabled' />;
  }
};

const getStatusColor = (status: ProcessingStatus) => {
  switch (status) {
    case ProcessingStatus.COMPLETED:
      return 'success';
    case ProcessingStatus.FAILED:
      return 'error';
    case ProcessingStatus.PROCESSING:
    case ProcessingStatus.OCR_EXTRACTING:
    case ProcessingStatus.PII_DETECTING:
    case ProcessingStatus.AGENCY_VALIDATING:
      return 'primary';
    default:
      return 'default';
  }
};

const getStatusText = (status: ProcessingStatus) => {
  switch (status) {
    case ProcessingStatus.QUEUED:
      return 'Queued';
    case ProcessingStatus.PROCESSING:
      return 'Processing';
    case ProcessingStatus.OCR_EXTRACTING:
      return 'OCR Processing';
    case ProcessingStatus.PII_DETECTING:
      return 'PII Detection';
    case ProcessingStatus.AGENCY_VALIDATING:
      return 'Agency Validation';
    case ProcessingStatus.COMPLETED:
      return 'Complete';
    case ProcessingStatus.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
};

export const AdvancedFileUpload: React.FC<AdvancedFileUploadProps> = ({
  onProcessingComplete,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  enableOCR = true,
  enablePIIDetection = true,
  enableAgencyValidation = true,
  showBatchProgress = true,
}) => {
  const { currentAgency } = useAgency();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<
    Map<string, DocumentProcessingResult>
  >(new Map());
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [error, setError] = useState<string>('');

  const [config, setConfig] = useState<ProcessingConfig>({
    enableOCR,
    enablePIIDetection,
    enableAgencyValidation,
    maxConcurrent: 3,
  });

  // Accepted file types for document processing
  const acceptedFileTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/rtf': ['.rtf'],
    },
    maxFiles,
    maxSize: maxFileSize,
    disabled: isProcessing,
  });

  function onFileDrop(acceptedFiles: File[], rejectedFiles: FileRejection[]) {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles
        .map(
          rejection =>
            `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
        )
        .join('; ');
      setError(errors);
      return;
    }

    setError('');
    const newFiles = [...selectedFiles, ...acceptedFiles];
    setSelectedFiles(newFiles);
  }

  const removeFile = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter(
      (_, index) => index !== indexToRemove
    );
    setSelectedFiles(newFiles);
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to process');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log(
        `🚀 [Advanced Upload] Starting batch processing of ${selectedFiles.length} files`
      );

      // Start batch processing
      const batchId =
        await advancedDocumentProcessingService.batchProcessDocuments(
          selectedFiles,
          {
            agencyId: currentAgency?.id,
            enablePIIDetection: config.enablePIIDetection,
            enableAgencyValidation: config.enableAgencyValidation,
            maxConcurrent: config.maxConcurrent,
            ocrConfig: {
              language: 'eng',
              confidence: 0.6,
            },
          }
        );

      // Poll for batch progress
      const progressInterval = setInterval(() => {
        const progress =
          advancedDocumentProcessingService.getBatchProgress(batchId);
        if (progress) {
          setBatchProgress(progress);

          if (progress.percentage >= 100) {
            clearInterval(progressInterval);
            setIsProcessing(false);

            // Get final results
            const results =
              advancedDocumentProcessingService.getAllProcessingResults();
            const resultsMap = new Map<string, DocumentProcessingResult>();
            results.forEach(result => resultsMap.set(result.id, result));
            setProcessingResults(resultsMap);

            if (onProcessingComplete) {
              onProcessingComplete(results);
            }

            console.log(
              `✅ [Advanced Upload] Batch processing completed: ${progress.completed} successful, ${progress.failed} failed`
            );
          }
        }
      }, 1000);
    } catch (error) {
      console.error('❌ [Advanced Upload] Batch processing failed:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setSelectedFiles([]);
    setProcessingResults(new Map());
    setBatchProgress(null);
    advancedDocumentProcessingService.clearCompletedProcesses();
  };

  const viewResult = (result: DocumentProcessingResult) => {
    console.log('📋 [Advanced Upload] Viewing result:', result);
    // TODO: Open detailed result dialog
  };

  const downloadResult = (result: DocumentProcessingResult) => {
    if (!result.extractedText) return;

    const blob = new Blob([result.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName}_extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {/* Header */}
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Typography variant='h5' component='h2'>
                Advanced Document Processing
              </Typography>
              <Stack direction='row' spacing={1}>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => setShowConfigDialog(true)}
                  disabled={isProcessing}
                >
                  Configure
                </Button>
                {processingResults.size > 0 && (
                  <Button
                    variant='outlined'
                    size='small'
                    color='secondary'
                    onClick={clearResults}
                    disabled={isProcessing}
                  >
                    Clear Results
                  </Button>
                )}
              </Stack>
            </Box>

            {/* Agency Info */}
            {currentAgency && (
              <Alert severity='info' icon={<AgencyIcon />}>
                Processing documents for <strong>{currentAgency.name}</strong>
                {config.enableAgencyValidation &&
                  ' with agency-specific validation rules'}
              </Alert>
            )}

            {/* Processing Configuration Summary */}
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip
                icon={<OCRIcon />}
                label={`OCR: ${config.enableOCR ? 'Enabled' : 'Disabled'}`}
                color={config.enableOCR ? 'primary' : 'default'}
                size='small'
              />
              <Chip
                icon={<PIIIcon />}
                label={`PII Detection: ${config.enablePIIDetection ? 'Enabled' : 'Disabled'}`}
                color={config.enablePIIDetection ? 'primary' : 'default'}
                size='small'
              />
              <Chip
                icon={<AgencyIcon />}
                label={`Agency Rules: ${config.enableAgencyValidation ? 'Enabled' : 'Disabled'}`}
                color={config.enableAgencyValidation ? 'primary' : 'default'}
                size='small'
              />
            </Stack>

            {/* File Drop Zone */}
            <Paper
              {...getRootProps()}
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: 4,
                textAlign: 'center',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant='h6' gutterBottom>
                {isDragActive
                  ? 'Drop files here...'
                  : 'Drop files or click to select'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Supports PDF, images (PNG, JPEG, GIF), Word documents, and text
                files
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Maximum file size: {formatFileSize(maxFileSize)} • Maximum
                files: {maxFiles}
              </Typography>
            </Paper>

            {/* Error Display */}
            {error && (
              <Alert severity='error' onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <Box>
                <Typography variant='h6' gutterBottom>
                  Selected Files ({selectedFiles.length})
                </Typography>
                <List>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={file.name}
                        secondary={`${formatFileSize(file.size)} • ${file.type || 'Unknown type'}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge='end'
                          onClick={() => removeFile(index)}
                          disabled={isProcessing}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                <Box mt={2}>
                  <Button
                    variant='contained'
                    size='large'
                    onClick={processFiles}
                    disabled={isProcessing}
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    {isProcessing
                      ? 'Processing...'
                      : `Process ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Batch Progress */}
            {showBatchProgress && batchProgress && (
              <Box>
                <Typography variant='h6' gutterBottom>
                  Processing Progress
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={batchProgress.percentage}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Typography variant='body2' color='text.secondary'>
                    {batchProgress.completed + batchProgress.failed} of{' '}
                    {batchProgress.total} files processed
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {batchProgress.percentage}%
                  </Typography>
                </Stack>
                {batchProgress.currentFile && (
                  <Typography variant='body2' color='text.secondary' mt={1}>
                    Currently processing: {batchProgress.currentFile}
                  </Typography>
                )}
                <Stack direction='row' spacing={2} mt={1}>
                  <Chip
                    label={`${batchProgress.completed} Completed`}
                    color='success'
                    size='small'
                  />
                  <Chip
                    label={`${batchProgress.processing} Processing`}
                    color='primary'
                    size='small'
                  />
                  {batchProgress.failed > 0 && (
                    <Chip
                      label={`${batchProgress.failed} Failed`}
                      color='error'
                      size='small'
                    />
                  )}
                </Stack>
              </Box>
            )}

            {/* Processing Results */}
            {processingResults.size > 0 && (
              <Box>
                <Typography variant='h6' gutterBottom>
                  Processing Results ({processingResults.size})
                </Typography>
                <List>
                  {Array.from(processingResults.values()).map(result => (
                    <ListItem key={result.id} divider>
                      <ListItemIcon>
                        {getStatusIcon(result.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.fileName}
                        secondary={
                          <Stack spacing={0.5}>
                            <Stack
                              direction='row'
                              spacing={1}
                              alignItems='center'
                            >
                              <Chip
                                label={getStatusText(result.status)}
                                color={getStatusColor(result.status) as any}
                                size='small'
                              />
                              {result.processingTime && (
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {result.processingTime}ms
                                </Typography>
                              )}
                            </Stack>
                            {result.ocrData && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                OCR Confidence:{' '}
                                {Math.round(result.ocrData.confidence * 100)}%
                              </Typography>
                            )}
                            {result.piiFindings &&
                              result.piiFindings.length > 0 && (
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  PII Findings: {result.piiFindings.length}{' '}
                                  items detected
                                </Typography>
                              )}
                            {result.error && (
                              <Typography variant='body2' color='error.main'>
                                Error: {result.error}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction='row' spacing={1}>
                          <Tooltip title='View Details'>
                            <IconButton
                              size='small'
                              onClick={() => viewResult(result)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {result.extractedText && (
                            <Tooltip title='Download Extracted Text'>
                              <IconButton
                                size='small'
                                onClick={() => downloadResult(result)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Processing Configuration</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enableOCR}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      enableOCR: e.target.checked,
                    }))
                  }
                />
              }
              label='Enable OCR Processing'
              disabled={isProcessing}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.enablePIIDetection}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      enablePIIDetection: e.target.checked,
                    }))
                  }
                />
              }
              label='Enable PII Detection'
              disabled={isProcessing}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.enableAgencyValidation}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      enableAgencyValidation: e.target.checked,
                    }))
                  }
                />
              }
              label='Enable Agency-Specific Validation'
              disabled={isProcessing || !currentAgency}
            />

            <FormControl fullWidth>
              <InputLabel>Max Concurrent Processing</InputLabel>
              <Select
                value={config.maxConcurrent}
                label='Max Concurrent Processing'
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    maxConcurrent: Number(e.target.value),
                  }))
                }
                disabled={isProcessing}
              >
                <MenuItem value={1}>1 (Sequential)</MenuItem>
                <MenuItem value={2}>2 (Recommended)</MenuItem>
                <MenuItem value={3}>3 (Fast)</MenuItem>
                <MenuItem value={4}>4 (Faster)</MenuItem>
                <MenuItem value={5}>5 (Fastest)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedFileUpload;
