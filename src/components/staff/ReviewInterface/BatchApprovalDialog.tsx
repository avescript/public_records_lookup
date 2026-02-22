/**
 * BatchApprovalDialog - Batch operations for multiple requests
 * Part of ReviewInterface - Step 4 of V2 Workflow
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  Typography,
} from '@mui/material';

import {
  Button,
  Checkbox,
  FormControl,
  Select,
  TextField,
} from '@/components/migration';
import { PublicRecordRequest } from '@/types/request';
import {
  ApprovalLevel,
  BatchOperationResult,
  BatchReviewOperation,
  DeliveryMethod,
  DocumentFormat,
} from '@/types/review';

interface BatchApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  requestIds: string[];
}

interface BatchableRequest {
  id: string;
  requesterName: string;
  description: string;
  status: string;
  priority: string;
  estimatedRisk: 'low' | 'medium' | 'high';
  canApprove: boolean;
  canReject: boolean;
}

const batchOperations = [
  {
    value: 'approve',
    label: 'Bulk Approve',
    description: 'Approve multiple requests at once',
    icon: <CheckCircleIcon color='success' />,
    requiresComment: false,
  },
  {
    value: 'reject',
    label: 'Bulk Reject',
    description: 'Reject multiple requests with reason',
    icon: <CancelIcon color='error' />,
    requiresComment: true,
  },
  {
    value: 'assign',
    label: 'Assign Approver',
    description: 'Assign requests to specific approver',
    icon: <PersonIcon color='primary' />,
    requiresComment: false,
  },
  {
    value: 'export',
    label: 'Batch Export',
    description: 'Export multiple requests as documents',
    icon: <DownloadIcon color='info' />,
    requiresComment: false,
  },
  {
    value: 'deliver',
    label: 'Batch Deliver',
    description: 'Send multiple responses at once',
    icon: <SendIcon color='success' />,
    requiresComment: false,
  },
];

export function BatchApprovalDialog({
  open,
  onClose,
  requestIds,
}: BatchApprovalDialogProps) {
  const [requests, setRequests] = useState<BatchableRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationParams, setOperationParams] = useState<Record<string, any>>(
    {}
  );
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchOperationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && requestIds.length > 0) {
      loadBatchableRequests();
    }
  }, [open, requestIds, loadBatchableRequests]);

  const loadBatchableRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests/batch-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds }),
      });

      const data = await response.json();
      setRequests(data);
      setSelectedRequests(requestIds); // Select all by default
    } catch (error) {
      console.error('Failed to load batch requests:', error);
    } finally {
      setLoading(false);
    }
  }, [requestIds]);

  const handleRequestToggle = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    const eligibleRequests = requests
      .filter(request => canPerformOperation(request, selectedOperation))
      .map(request => request.id);

    setSelectedRequests(
      selectedRequests.length === eligibleRequests.length
        ? []
        : eligibleRequests
    );
  };

  const canPerformOperation = (
    request: BatchableRequest,
    operation: string
  ): boolean => {
    switch (operation) {
      case 'approve':
        return request.canApprove && request.estimatedRisk !== 'high';
      case 'reject':
        return request.canReject;
      case 'assign':
        return true;
      case 'export':
        return request.status !== 'draft';
      case 'deliver':
        return request.status === 'approved';
      default:
        return true;
    }
  };

  const getEligibleRequests = () => {
    return requests.filter(request =>
      canPerformOperation(request, selectedOperation)
    );
  };

  const validateOperation = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!selectedOperation) {
      errors.push('Please select an operation');
    }

    if (selectedRequests.length === 0) {
      errors.push('Please select at least one request');
    }

    const operation = batchOperations.find(
      op => op.value === selectedOperation
    );
    if (operation?.requiresComment && !comments.trim()) {
      errors.push('Comments are required for this operation');
    }

    // Specific validations
    if (selectedOperation === 'assign' && !operationParams.approverLevel) {
      errors.push('Please select an approver level');
    }

    if (selectedOperation === 'export' && !operationParams.format) {
      errors.push('Please select export format');
    }

    if (selectedOperation === 'deliver' && !operationParams.deliveryMethod) {
      errors.push('Please select delivery method');
    }

    return { isValid: errors.length === 0, errors };
  };

  const executeBatchOperation = async () => {
    const { isValid, errors } = validateOperation();
    if (!isValid) {
      alert(errors.join('\n'));
      return;
    }

    setIsProcessing(true);
    try {
      const batchOperation: Omit<
        BatchReviewOperation,
        'id' | 'initiatedAt' | 'completedAt' | 'results'
      > = {
        operationType: selectedOperation as any,
        requestIds: selectedRequests,
        parameters: {
          ...operationParams,
          comments: comments.trim(),
        },
        initiatedBy: 'current-user', // Would come from auth context
        status: 'queued',
      };

      const response = await fetch('/api/batch-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchOperation),
      });

      const result = await response.json();
      setResults(result.results || []);

      // Show success message or handle partial failures
      if (result.results?.every((r: BatchOperationResult) => r.success)) {
        alert(`Successfully processed ${selectedRequests.length} requests`);
        onClose();
      } else {
        // Some operations failed - results will show details
      }
    } catch (error) {
      console.error('Failed to execute batch operation:', error);
      alert('Failed to execute batch operation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setSelectedOperation('');
    setOperationParams({});
    setComments('');
    setResults([]);
    setSelectedRequests(requestIds);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const selectedOperation_obj = batchOperations.find(
    op => op.value === selectedOperation
  );
  const eligibleRequests = getEligibleRequests();
  const { isValid, errors } = validateOperation();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      disableEscapeKeyDown={isProcessing}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6'>
            Batch Operations ({requestIds.length} requests)
          </Typography>
          <IconButton onClick={handleClose} disabled={isProcessing}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        ) : (
          <Box>
            {/* Operation Selection */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  1. Select Operation
                </Typography>
                <Grid container spacing={2}>
                  {batchOperations.map(operation => (
                    <Grid item xs={12} sm={6} md={4} key={operation.value}>
                      <Card
                        variant={
                          selectedOperation === operation.value
                            ? 'elevation'
                            : 'outlined'
                        }
                        sx={{
                          cursor: 'pointer',
                          border: selectedOperation === operation.value ? 2 : 1,
                          borderColor:
                            selectedOperation === operation.value
                              ? 'primary.main'
                              : 'divider',
                        }}
                        onClick={() => setSelectedOperation(operation.value)}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          {operation.icon}
                          <Typography variant='subtitle2' sx={{ mt: 1 }}>
                            {operation.label}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {operation.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Operation Parameters */}
            {selectedOperation && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    2. Configure Operation
                  </Typography>

                  {/* Assign Approver Parameters */}
                  {selectedOperation === 'assign' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Approver Level</InputLabel>
                      <Select
                        value={operationParams.approverLevel || ''}
                        onChange={e =>
                          setOperationParams({
                            ...operationParams,
                            approverLevel: e.target.value,
                          })
                        }
                        label='Approver Level'
                      >
                        <MenuItem value='supervisor'>Supervisor</MenuItem>
                        <MenuItem value='legal'>Legal Review</MenuItem>
                        <MenuItem value='department_head'>
                          Department Head
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* Export Parameters */}
                  {selectedOperation === 'export' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Export Format</InputLabel>
                      <Select
                        value={operationParams.format || ''}
                        onChange={e =>
                          setOperationParams({
                            ...operationParams,
                            format: e.target.value,
                          })
                        }
                        label='Export Format'
                      >
                        <MenuItem value='pdf'>PDF</MenuItem>
                        <MenuItem value='docx'>Word Document</MenuItem>
                        <MenuItem value='html'>HTML</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* Delivery Parameters */}
                  {selectedOperation === 'deliver' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Delivery Method</InputLabel>
                      <Select
                        value={operationParams.deliveryMethod || ''}
                        onChange={e =>
                          setOperationParams({
                            ...operationParams,
                            deliveryMethod: e.target.value,
                          })
                        }
                        label='Delivery Method'
                      >
                        <MenuItem value='email'>Email</MenuItem>
                        <MenuItem value='portal'>Online Portal</MenuItem>
                        <MenuItem value='mail'>US Mail</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* Comments */}
                  {selectedOperation_obj && (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={
                        selectedOperation_obj.requiresComment
                          ? 'Comments (Required)'
                          : 'Comments (Optional)'
                      }
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      required={selectedOperation_obj.requiresComment}
                      placeholder={
                        selectedOperation === 'reject'
                          ? 'Explain why these requests are being rejected...'
                          : selectedOperation === 'assign'
                            ? 'Add notes for the assigned approver...'
                            : 'Add any additional comments...'
                      }
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Request Selection */}
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6'>
                    3. Select Requests ({selectedRequests.length}/
                    {eligibleRequests.length} eligible)
                  </Typography>
                  <Button
                    onClick={handleSelectAll}
                    disabled={
                      !selectedOperation || eligibleRequests.length === 0
                    }
                  >
                    {selectedRequests.length === eligibleRequests.length
                      ? 'Deselect All'
                      : 'Select All Eligible'}
                  </Button>
                </Box>

                {!selectedOperation ? (
                  <Alert severity='info'>
                    Select an operation above to see eligible requests.
                  </Alert>
                ) : eligibleRequests.length === 0 ? (
                  <Alert severity='warning'>
                    No requests are eligible for the selected operation.
                  </Alert>
                ) : (
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {requests.map(request => {
                      const isEligible = canPerformOperation(
                        request,
                        selectedOperation
                      );
                      const isSelected = selectedRequests.includes(request.id);

                      return (
                        <ListItem
                          key={request.id}
                          disabled={!isEligible}
                          sx={{
                            opacity: isEligible ? 1 : 0.5,
                            bgcolor: isSelected ? 'action.selected' : 'inherit',
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleRequestToggle(request.id)}
                              disabled={!isEligible}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                {request.requesterName}
                                <Chip
                                  label={request.status}
                                  size='small'
                                  color='primary'
                                  variant='outlined'
                                />
                                <Chip
                                  label={request.estimatedRisk}
                                  size='small'
                                  color={
                                    request.estimatedRisk === 'high'
                                      ? 'error'
                                      : request.estimatedRisk === 'medium'
                                        ? 'warning'
                                        : 'success'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant='body2' noWrap>
                                {request.description}
                              </Typography>
                            }
                          />
                          {!isEligible && (
                            <ListItemSecondaryAction>
                              <Chip
                                label='Not Eligible'
                                size='small'
                                color='default'
                                variant='outlined'
                              />
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <Alert severity='error' sx={{ mt: 2 }}>
                <Typography variant='subtitle2' gutterBottom>
                  Please fix the following issues:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant='body2'>{error}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Processing Results */}
            {results.length > 0 && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant='h6'>
                    Operation Results ({results.filter(r => r.success).length}/
                    {results.length} successful)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {results.map((result, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          {result.success ? (
                            <CheckCircleIcon color='success' />
                          ) : (
                            <CancelIcon color='error' />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Request ${result.requestId}`}
                          secondary={
                            result.success ? (
                              <Typography variant='body2' color='success.main'>
                                Completed in {result.processingTime}ms
                              </Typography>
                            ) : (
                              <Typography variant='body2' color='error'>
                                Error: {result.error}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant='body2' sx={{ textAlign: 'center', mt: 1 }}>
                  Processing {selectedRequests.length} requests...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isProcessing}>
          {results.length > 0 ? 'Close' : 'Cancel'}
        </Button>
        {results.length === 0 && (
          <Button
            onClick={executeBatchOperation}
            variant='contained'
            disabled={!isValid || isProcessing || loading}
            startIcon={selectedOperation_obj?.icon}
          >
            Execute Operation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
