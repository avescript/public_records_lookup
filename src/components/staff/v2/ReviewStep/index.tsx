/**
 * Review Step Component (V2 Guided Workflow)
 * Epic V2-5: Step 4 - Review & Send
 * US-V2-050: Enhanced Approval Workflow
 * US-V2-051: Automated Delivery & Tracking
 * 
 * Final review and approval before sending response to requester
 * - Review summary of all workflow steps
 * - Approval checklist and compliance verification
 * - Delivery scheduling and method selection
 * - Send confirmation and tracking
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  CheckCircle as CheckIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  CloudDownload as DownloadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AssignmentTurnedIn as ApprovalIcon,
  Visibility as PreviewIcon,
  ChevronLeft as BackIcon,
} from '@mui/icons-material';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@/components/migration';

import { StoredRequest } from '@/services/requestService';

export interface ReviewStepProps {
  requestId: string;
  request: StoredRequest;
  selectedRecords?: string[];
  redactedRecords?: RedactedRecordSummary[];
  responseSummary?: ResponseSummary;
  onWorkflowComplete?: () => void;
}

export interface RedactedRecordSummary {
  recordId: string;
  fileName: string;
  totalRedactions: number;
  autoRedactions: number;
  manualRedactions: number;
  qualityScore: number;
}

export interface ResponseSummary {
  responseText: string;
  tone: string;
  length: string;
  wordCount: number;
  validationPassed: boolean;
  timestamp: Date;
}

type DeliveryMethod = 'email' | 'portal' | 'mail';
type DeliveryTiming = 'immediate' | 'scheduled' | 'business_hours';

/**
 * ReviewStep Component
 * Final step in V2 workflow for approval and delivery
 * - Comprehensive summary of all workflow steps
 * - Approval checklist
 * - Delivery configuration
 * - Send confirmation
 */
export function ReviewStep({
  requestId,
  request,
  selectedRecords = [],
  redactedRecords = [],
  responseSummary,
  onWorkflowComplete,
}: ReviewStepProps) {
  // State management
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [deliveryTiming, setDeliveryTiming] = useState<DeliveryTiming>('business_hours');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Calculate summary statistics
  const totalRecords = selectedRecords.length;
  const totalRedactions = redactedRecords.reduce(
    (sum, record) => sum + record.totalRedactions,
    0
  );
  const avgQualityScore = redactedRecords.length > 0
    ? Math.round(
        redactedRecords.reduce((sum, record) => sum + record.qualityScore, 0) /
          redactedRecords.length
      )
    : 0;

  /**
   * Handle approval checkbox
   */
  const handleApprovalChange = useCallback(() => {
    setApprovalChecked(!approvalChecked);
  }, [approvalChecked]);

  /**
   * Open send confirmation dialog
   */
  const handleSendClick = () => {
    setShowConfirmDialog(true);
  };

  /**
   * Confirm and send response
   */
  const handleConfirmSend = async () => {
    setSending(true);
    setShowConfirmDialog(false);

    try {
      // In real app, this would call the delivery service
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSent(true);

      // Wait a moment to show success, then complete workflow
      setTimeout(() => {
        if (onWorkflowComplete) {
          onWorkflowComplete();
        }
      }, 1500);
    } catch (error) {
      console.error('Error sending response:', error);
      setSending(false);
    }
  };

  /**
   * Get delivery method icon
   */
  const getDeliveryIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'email':
        return <EmailIcon />;
      case 'portal':
        return <DownloadIcon />;
      case 'mail':
        return <PrintIcon />;
    }
  };

  // Show success state after sending
  if (sent) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckIcon sx={{ fontSize: 96, color: 'success.main', mb: 3 }} />
        <Typography variant='h4' gutterBottom>
          Response Sent Successfully!
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
          The response has been delivered to the requester via {deliveryMethod}.
        </Typography>
        <Chip
          label={`Request ${requestId}`}
          color='success'
          icon={<CheckIcon />}
        />
      </Box>
    );
  }

  // Show sending state
  if (sending) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant='h6' gutterBottom>
          Sending Response...
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Please wait while we deliver your response.
        </Typography>
      </Box>
    );
  }

  const canSend = approvalChecked && 
    totalRecords > 0 && 
    responseSummary && 
    deliveryMethod &&
    (deliveryTiming !== 'scheduled' || (scheduledDate && scheduledTime));

  return (
    <Box>
      {/* Workflow Summary */}
      <Alert severity='info' sx={{ mb: 3 }}>
        <Typography variant='subtitle2' gutterBottom>
          Final Review - All workflow steps completed
        </Typography>
        <Typography variant='body2'>
          Review the summary below and approve to send the response to the requester.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Left Column: Summary Cards */}
        <Grid item xs={12} md={8}>
          {/* Step 1: Locate Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip label='Step 1' size='small' color='primary' sx={{ mr: 2 }} />
                <Typography variant='h6'>Records Located</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Total Records
                  </Typography>
                  <Typography variant='h4'>{totalRecords}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Search Method
                  </Typography>
                  <Typography variant='body1'>AI-Enhanced</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Step 2: Redaction Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip label='Step 2' size='small' color='primary' sx={{ mr: 2 }} />
                <Typography variant='h6'>Redactions Applied</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant='body2' color='text.secondary'>
                    Total Redactions
                  </Typography>
                  <Typography variant='h4'>{totalRedactions}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='body2' color='text.secondary'>
                    Quality Score
                  </Typography>
                  <Typography variant='h4'>{avgQualityScore}%</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='body2' color='text.secondary'>
                    Documents
                  </Typography>
                  <Typography variant='h4'>{redactedRecords.length}</Typography>
                </Grid>
              </Grid>
              {redactedRecords.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Documents reviewed:
                  </Typography>
                  <List dense>
                    {redactedRecords.slice(0, 3).map((record) => (
                      <ListItem key={record.recordId} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={record.fileName}
                          secondary={`${record.totalRedactions} redactions (Quality: ${Math.round(record.qualityScore)}%)`}
                        />
                      </ListItem>
                    ))}
                    {redactedRecords.length > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText
                          secondary={`...and ${redactedRecords.length - 3} more`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Response Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip label='Step 3' size='small' color='primary' sx={{ mr: 2 }} />
                <Typography variant='h6'>Response Generated</Typography>
              </Box>
              {responseSummary ? (
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant='body2' color='text.secondary'>
                      Word Count
                    </Typography>
                    <Typography variant='h4'>{responseSummary.wordCount}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant='body2' color='text.secondary'>
                      Tone
                    </Typography>
                    <Typography variant='body1' sx={{ textTransform: 'capitalize' }}>
                      {responseSummary.tone}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant='body2' color='text.secondary'>
                      Validation
                    </Typography>
                    <Chip
                      label={responseSummary.validationPassed ? 'Passed' : 'Review Needed'}
                      color={responseSummary.validationPassed ? 'success' : 'warning'}
                      size='small'
                    />
                  </Grid>
                </Grid>
              ) : (
                <Alert severity='warning'>
                  No response generated. Please complete Step 3.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Approval & Delivery */}
        <Grid item xs={12} md={4}>
          {/* Approval Checklist */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ApprovalIcon sx={{ mr: 1 }} />
              Approval
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color={totalRecords > 0 ? 'success' : 'disabled'} />
                </ListItemIcon>
                <ListItemText
                  primary='Records selected'
                  secondary={`${totalRecords} record${totalRecords !== 1 ? 's' : ''}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color={redactedRecords.length > 0 ? 'success' : 'disabled'} />
                </ListItemIcon>
                <ListItemText
                  primary='Redactions applied'
                  secondary={`${totalRedactions} redaction${totalRedactions !== 1 ? 's' : ''}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color={responseSummary ? 'success' : 'disabled'} />
                </ListItemIcon>
                <ListItemText
                  primary='Response generated'
                  secondary={responseSummary ? `${responseSummary.wordCount} words` : 'Pending'}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                p: 2,
                bgcolor: approvalChecked ? 'success.light' : 'grey.100',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: approvalChecked ? 'success.light' : 'grey.200',
                },
              }}
              onClick={handleApprovalChange}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon
                  sx={{
                    mr: 1,
                    color: approvalChecked ? 'success.main' : 'text.disabled',
                  }}
                />
                <Typography
                  variant='body2'
                  sx={{ fontWeight: approvalChecked ? 'bold' : 'normal' }}
                >
                  I approve this response for delivery
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Delivery Configuration */}
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              Delivery
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Delivery Method</InputLabel>
              <Select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                label='Delivery Method'
              >
                <MenuItem value='email'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize='small' />
                    Email
                  </Box>
                </MenuItem>
                <MenuItem value='portal'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DownloadIcon fontSize='small' />
                    Portal Download
                  </Box>
                </MenuItem>
                <MenuItem value='mail'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PrintIcon fontSize='small' />
                    Physical Mail
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Delivery Timing</InputLabel>
              <Select
                value={deliveryTiming}
                onChange={(e) => setDeliveryTiming(e.target.value as DeliveryTiming)}
                label='Delivery Timing'
              >
                <MenuItem value='immediate'>Send Immediately</MenuItem>
                <MenuItem value='business_hours'>Next Business Hours</MenuItem>
                <MenuItem value='scheduled'>Schedule Delivery</MenuItem>
              </Select>
            </FormControl>

            {deliveryTiming === 'scheduled' && (
              <>
                <TextField
                  fullWidth
                  type='date'
                  label='Scheduled Date'
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type='time'
                  label='Scheduled Time'
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label='Delivery Notes (Optional)'
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder='Add any special instructions...'
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Button
          startIcon={<BackIcon />}
          variant='outlined'
          onClick={() => {
            // Navigate back handled by parent
          }}
        >
          Back to Respond
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!canSend && (
            <Alert severity='warning' sx={{ py: 0 }}>
              Complete all steps and approve to send
            </Alert>
          )}
        </Box>

        <Button
          endIcon={<SendIcon />}
          variant='contained'
          color='primary'
          size='large'
          onClick={handleSendClick}
          disabled={!canSend}
        >
          Send Response
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Send Response</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            You are about to send the response to the requester.
          </Alert>

          <Typography variant='body2' gutterBottom>
            <strong>Delivery Method:</strong> {deliveryMethod}
          </Typography>
          <Typography variant='body2' gutterBottom>
            <strong>Timing:</strong>{' '}
            {deliveryTiming === 'scheduled'
              ? `${scheduledDate} at ${scheduledTime}`
              : deliveryTiming === 'business_hours'
                ? 'Next business hours'
                : 'Immediately'}
          </Typography>
          <Typography variant='body2' gutterBottom>
            <strong>Records:</strong> {totalRecords} document{totalRecords !== 1 ? 's' : ''}
          </Typography>
          <Typography variant='body2' gutterBottom>
            <strong>Redactions:</strong> {totalRedactions} redaction{totalRedactions !== 1 ? 's' : ''}
          </Typography>

          {deliveryNotes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body2' gutterBottom>
                <strong>Notes:</strong>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {deliveryNotes}
              </Typography>
            </Box>
          )}

          <Alert severity='warning' sx={{ mt: 2 }}>
            This action cannot be undone. The response will be delivered to the requester.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSend}
            variant='contained'
            color='primary'
            startIcon={<SendIcon />}
          >
            Confirm & Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
