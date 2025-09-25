/**
 * Approval Interface Component
 * Provides human approval workflow UI for redacted documents (US-042)
 * Material-UI dialog system with comprehensive approval controls
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Edit,
  Schedule,
  Person,
  Description,
  Close,
  Warning,
  Info,
} from '@mui/icons-material';
import { approvalService, ApprovalWorkflow, ApprovalDecision } from '../../../services/approvalService';

interface ApprovalInterfaceProps {
  open: boolean;
  onClose: () => void;
  recordId: string;
  fileName: string;
  onDecisionSubmitted?: (decision: ApprovalDecision) => void;
}

const ApprovalInterface: React.FC<ApprovalInterfaceProps> = ({
  open,
  onClose,
  recordId,
  fileName,
  onDecisionSubmitted,
}) => {
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reviewStartTime] = useState(Date.now());

  // Load workflow data when dialog opens
  useEffect(() => {
    if (open && recordId && fileName) {
      loadWorkflow();
    }
  }, [open, recordId, fileName]);

  const loadWorkflow = async () => {
    setLoading(true);
    setError(null);
    try {
      const workflowData = await approvalService.getWorkflow(recordId, fileName);
      setWorkflow(workflowData);
      
      if (!workflowData) {
        setError('Workflow not found. The document may not be submitted for approval.');
      }
    } catch (err) {
      setError('Failed to load approval workflow.');
      console.error('Error loading workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!workflow || !reviewerName.trim()) {
      setError('Please enter reviewer name.');
      return;
    }

    if (decision === 'rejected' && !reason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    if (decision === 'needs_revision' && !comments.trim()) {
      setError('Please provide comments for revision requirements.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reviewDuration = Math.round((Date.now() - reviewStartTime) / (1000 * 60)); // minutes
      const reviewerId = `reviewer_${Date.now()}`; // In real app, would come from auth

      const approvalDecision = await approvalService.submitDecision(
        recordId,
        fileName,
        decision,
        reviewerId,
        reviewerName.trim(),
        reason.trim() || undefined,
        comments.trim() || undefined,
        reviewDuration
      );

      onDecisionSubmitted?.(approvalDecision);
      onClose();
      
      // Reset form
      setDecision('approved');
      setReason('');
      setComments('');
      setReviewerName('');
    } catch (err) {
      setError('Failed to submit decision. Please try again.');
      console.error('Error submitting decision:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: ApprovalWorkflow['status']) => {
    switch (status) {
      case 'pending_review': return 'warning';
      case 'under_review': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'revision_needed': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: ApprovalWorkflow['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Document Approval Review</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : workflow ? (
          <Box>
            {/* Document Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Document Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Description sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography><strong>File:</strong> {workflow.fileName}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography><strong>Record ID:</strong> {workflow.recordId}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography><strong>Submitted:</strong> {formatDate(workflow.submittedAt)}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Edit sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography><strong>Redactions:</strong> {workflow.totalRedactions}</Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box mt={2}>
                  <Chip 
                    label={workflow.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(workflow.status) as any}
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={`${workflow.priority.toUpperCase()} PRIORITY`}
                    color={getPriorityColor(workflow.priority) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Review History */}
            {workflow.reviewHistory.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review History
                  </Typography>
                  {workflow.reviewHistory.map((review: ApprovalDecision, index: number) => (
                    <Box key={review.id} mb={2}>
                      <Box display="flex" alignItems="center" mb={1}>
                        {review.decision === 'approved' && <CheckCircle color="success" sx={{ mr: 1 }} />}
                        {review.decision === 'rejected' && <Cancel color="error" sx={{ mr: 1 }} />}
                        {review.decision === 'needs_revision' && <Warning color="warning" sx={{ mr: 1 }} />}
                        <Typography variant="subtitle2">
                          {review.reviewerName} - {review.decision.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto' }}>
                          {formatDate(review.timestamp)}
                        </Typography>
                      </Box>
                      {review.reason && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                          <strong>Reason:</strong> {review.reason}
                        </Typography>
                      )}
                      {review.comments && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                          <strong>Comments:</strong> {review.comments}
                        </Typography>
                      )}
                      {index < workflow.reviewHistory.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Decision Form */}
            {workflow.status === 'under_review' || workflow.status === 'pending_review' ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Submit Review Decision
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Reviewer Name"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Decision</InputLabel>
                        <Select
                          value={decision}
                          onChange={(e) => setDecision(e.target.value as any)}
                          label="Decision"
                        >
                          <MenuItem value="approved">Approve</MenuItem>
                          <MenuItem value="rejected">Reject</MenuItem>
                          <MenuItem value="needs_revision">Needs Revision</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {decision === 'rejected' && (
                    <TextField
                      fullWidth
                      label="Reason for Rejection"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                      helperText="Please explain why this document is being rejected"
                    />
                  )}

                  {decision === 'needs_revision' && (
                    <TextField
                      fullWidth
                      label="Revision Comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      required
                      multiline
                      rows={3}
                      sx={{ mb: 2 }}
                      helperText="Please specify what changes are needed"
                    />
                  )}

                  {decision === 'approved' && (
                    <TextField
                      fullWidth
                      label="Additional Comments (Optional)"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                      helperText="Any additional notes about the approval"
                    />
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Please carefully review all redactions before making your decision. 
                      This action cannot be undone.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="success">
                This document has already been reviewed and {workflow.status.replace('_', ' ')}.
              </Alert>
            )}
          </Box>
        ) : (
          <Alert severity="warning">
            No workflow found for this document.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        {workflow && (workflow.status === 'under_review' || workflow.status === 'pending_review') && (
          <Button
            onClick={handleSubmitDecision}
            variant="contained"
            disabled={submitting || !reviewerName.trim()}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? 'Submitting...' : 'Submit Decision'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalInterface;