/**
 * Redaction Approval Workflow Component
 * Epic 9 Task 4: Agency-Specific Redaction Rules
 *
 * UI component for approving/rejecting redactions that require approval based on agency rules
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Cancel as RejectIcon,
  CheckCircle as ApproveIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Schedule as PendingIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAgency } from '../../../contexts/AgencyContext';
import { useAuth } from '../../../contexts/AuthContext';
import { agencyRedactionRulesService } from '../../../services/agencyRedactionRulesService';
import { SensitivityLevel } from '../../../services/agencyTypes';
import { PIIType } from '../../../services/piiDetectionService';
import { redactionService } from '../../../services/redactionService';
import { ManualRedaction } from '../../../types/redaction';

interface PendingRedaction extends ManualRedaction {
  requestId: string;
  requestorName?: string;
  requestorEmail?: string;
  submittedAt: string;
  agencyRuleId?: string;
  agencyRuleName?: string;
  sensitivityLevel?: SensitivityLevel;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const RedactionApprovalWorkflow: React.FC = () => {
  const { currentAgency } = useAgency();
  const { user } = useAuth();
  const [pendingRedactions, setPendingRedactions] = useState<
    PendingRedaction[]
  >([]);
  const [approvedRedactions, setApprovedRedactions] = useState<
    PendingRedaction[]
  >([]);
  const [rejectedRedactions, setRejectedRedactions] = useState<
    PendingRedaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRedaction, setSelectedRedaction] =
    useState<PendingRedaction | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null
  );
  const [reviewComment, setReviewComment] = useState('');

  // Load pending redactions for approval
  const loadRedactionsForApproval = useCallback(async () => {
    if (!currentAgency?.id || !user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Get all redactions requiring approval for this agency
      const allRedactions = await redactionService.getPendingApprovals(
        currentAgency.id
      );

      // Group by approval status
      const pending = allRedactions.filter(r => r.approvalStatus === 'PENDING');
      const approved = allRedactions.filter(
        r => r.approvalStatus === 'APPROVED'
      );
      const rejected = allRedactions.filter(
        r => r.approvalStatus === 'REJECTED'
      );

      setPendingRedactions(pending as PendingRedaction[]);
      setApprovedRedactions(approved as PendingRedaction[]);
      setRejectedRedactions(rejected as PendingRedaction[]);
    } catch (error) {
      console.error('Failed to load redactions for approval:', error);
      setError('Failed to load approval queue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentAgency?.id, user?.uid]);

  useEffect(() => {
    loadRedactionsForApproval();
  }, [loadRedactionsForApproval]);

  // Handle redaction approval/rejection
  const handleReviewRedaction = async () => {
    if (!selectedRedaction || !reviewAction || !user?.uid) return;

    try {
      let success = false;

      if (reviewAction === 'approve') {
        success = await redactionService.approveRedaction(
          selectedRedaction.id,
          user.uid,
          reviewComment
        );
      } else {
        success = await redactionService.rejectRedaction(
          selectedRedaction.id,
          user.uid,
          reviewComment
        );
      }

      if (success) {
        setApprovalDialog(false);
        setSelectedRedaction(null);
        setReviewAction(null);
        setReviewComment('');
        await loadRedactionsForApproval();
      } else {
        setError(`Failed to ${reviewAction} redaction. Please try again.`);
      }
    } catch (error) {
      console.error(`Failed to ${reviewAction} redaction:`, error);
      setError(`Failed to ${reviewAction} redaction. Please try again.`);
    }
  };

  // Open approval dialog
  const openApprovalDialog = (
    redaction: PendingRedaction,
    action: 'approve' | 'reject'
  ) => {
    setSelectedRedaction(redaction);
    setReviewAction(action);
    setReviewComment('');
    setApprovalDialog(true);
  };

  // Get sensitivity level color
  const getSensitivityColor = (level?: SensitivityLevel): string => {
    if (!level) return '#757575';
    switch (level) {
      case SensitivityLevel.LOW:
        return '#4caf50';
      case SensitivityLevel.MEDIUM:
        return '#ff9800';
      case SensitivityLevel.HIGH:
        return '#f44336';
      case SensitivityLevel.CRITICAL:
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  // Get approval status icon
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <ApproveIcon color='success' />;
      case 'REJECTED':
        return <RejectIcon color='error' />;
      case 'PENDING':
      default:
        return <PendingIcon color='warning' />;
    }
  };

  // Render redaction card
  const renderRedactionCard = (
    redaction: PendingRedaction,
    showActions: boolean = true
  ) => (
    <Card key={redaction.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='start'
          mb={2}
        >
          <Box>
            <Typography variant='h6' gutterBottom>
              Redaction Request #{redaction.id.slice(-8)}
            </Typography>
            <Typography variant='body2' color='textSecondary' gutterBottom>
              Request ID: {redaction.requestId || 'Unknown'}
            </Typography>
            {redaction.requestorName && (
              <Typography variant='body2' color='textSecondary' gutterBottom>
                Requestor: {redaction.requestorName}
              </Typography>
            )}
          </Box>
          <Box display='flex' flexDirection='column' alignItems='end'>
            {getStatusIcon(redaction.approvalStatus)}
            <Typography variant='caption' color='textSecondary' mt={0.5}>
              {redaction.submittedAt
                ? new Date(redaction.submittedAt).toLocaleDateString()
                : 'Unknown date'}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant='subtitle2' gutterBottom>
              Redaction Details
            </Typography>
            <Typography variant='body2'>
              Area: {redaction.width}×{redaction.height} pixels
            </Typography>
            <Typography variant='body2'>
              Position: ({redaction.x}, {redaction.y})
            </Typography>
            {redaction.reason && (
              <Typography variant='body2' mt={1}>
                <strong>Reason:</strong> {redaction.reason}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='subtitle2' gutterBottom>
              Agency Rule Applied
            </Typography>
            {redaction.agencyRuleName ? (
              <Box>
                <Typography variant='body2' gutterBottom>
                  {redaction.agencyRuleName}
                </Typography>
                {redaction.sensitivityLevel && (
                  <Chip
                    label={redaction.sensitivityLevel.toUpperCase()}
                    size='small'
                    sx={{
                      backgroundColor: getSensitivityColor(
                        redaction.sensitivityLevel
                      ),
                      color: 'white',
                    }}
                  />
                )}
              </Box>
            ) : (
              <Typography variant='body2' color='textSecondary'>
                Manual redaction (no rule applied)
              </Typography>
            )}
          </Grid>
        </Grid>

        {redaction.agencyRuleId && (
          <Box mt={2}>
            <Typography variant='subtitle2' gutterBottom>
              PII Types Detected
            </Typography>
            <Box display='flex' flexWrap='wrap' gap={1}>
              {/* This would come from the rule's PII types */}
              <Chip
                label='SSN'
                size='small'
                variant='outlined'
                icon={<SecurityIcon />}
              />
              <Chip
                label='Phone Number'
                size='small'
                variant='outlined'
                icon={<SecurityIcon />}
              />
            </Box>
          </Box>
        )}

        {(redaction.approvalComment || redaction.reviewedAt) && (
          <Box mt={2}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant='subtitle2' gutterBottom>
              Review Details
            </Typography>
            {redaction.reviewedBy && (
              <Typography variant='body2' gutterBottom>
                Reviewed by: {redaction.reviewedBy}
              </Typography>
            )}
            {redaction.reviewedAt && (
              <Typography variant='body2' gutterBottom>
                Date: {new Date(redaction.reviewedAt).toLocaleString()}
              </Typography>
            )}
            {redaction.approvalComment && (
              <Typography variant='body2' gutterBottom>
                <strong>Comment:</strong> {redaction.approvalComment}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {showActions && redaction.approvalStatus === 'PENDING' && (
        <CardActions>
          <Button
            startIcon={<ViewIcon />}
            onClick={() => setSelectedRedaction(redaction)}
          >
            View Details
          </Button>
          <Button
            startIcon={<ApproveIcon />}
            color='success'
            onClick={() => openApprovalDialog(redaction, 'approve')}
          >
            Approve
          </Button>
          <Button
            startIcon={<RejectIcon />}
            color='error'
            onClick={() => openApprovalDialog(redaction, 'reject')}
          >
            Reject
          </Button>
        </CardActions>
      )}
    </Card>
  );

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <Typography>Loading approval queue...</Typography>
      </Box>
    );
  }

  if (!currentAgency) {
    return (
      <Alert severity='warning'>
        Please select an agency to view the approval queue.
      </Alert>
    );
  }

  if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
    return (
      <Alert severity='error'>
        You do not have permission to approve redactions.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display='flex' alignItems='center' justifyContent='between' mb={3}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Redaction Approval Queue
          </Typography>
          <Typography variant='subtitle1' color='textSecondary'>
            {currentAgency.name} - Review and approve agency-specific redactions
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
          >
            <Tab
              label={
                <Badge badgeContent={pendingRedactions.length} color='warning'>
                  Pending Approval
                </Badge>
              }
              icon={<PendingIcon />}
              iconPosition='start'
            />
            <Tab
              label={
                <Badge badgeContent={approvedRedactions.length} color='success'>
                  Approved
                </Badge>
              }
              icon={<ApproveIcon />}
              iconPosition='start'
            />
            <Tab
              label={
                <Badge badgeContent={rejectedRedactions.length} color='error'>
                  Rejected
                </Badge>
              }
              icon={<RejectIcon />}
              iconPosition='start'
            />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {pendingRedactions.length > 0 ? (
            <Box>
              <Alert severity='info' sx={{ mb: 3 }}>
                <Typography variant='body2'>
                  {pendingRedactions.length} redaction
                  {pendingRedactions.length !== 1 ? 's' : ''}
                  require{pendingRedactions.length === 1 ? 's' : ''} your
                  approval. These redactions were flagged by agency-specific
                  rules requiring manual review.
                </Typography>
              </Alert>
              {pendingRedactions.map(redaction =>
                renderRedactionCard(redaction, true)
              )}
            </Box>
          ) : (
            <Alert severity='success'>
              No redactions pending approval. All agency redactions are up to
              date.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {approvedRedactions.length > 0 ? (
            approvedRedactions.map(redaction =>
              renderRedactionCard(redaction, false)
            )
          ) : (
            <Alert severity='info'>No approved redactions yet.</Alert>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {rejectedRedactions.length > 0 ? (
            rejectedRedactions.map(redaction =>
              renderRedactionCard(redaction, false)
            )
          ) : (
            <Alert severity='info'>No rejected redactions yet.</Alert>
          )}
        </TabPanel>
      </Paper>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={() => setApprovalDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {reviewAction === 'approve'
            ? 'Approve Redaction'
            : 'Reject Redaction'}
        </DialogTitle>
        <DialogContent>
          {selectedRedaction && (
            <Box sx={{ pt: 2 }}>
              <Alert
                severity={reviewAction === 'approve' ? 'success' : 'error'}
                sx={{ mb: 3 }}
              >
                You are about to {reviewAction} this redaction request.
                {reviewAction === 'approve'
                  ? ' This will apply the redaction to the document.'
                  : ' This will reject the redaction and notify the requestor.'}
              </Alert>

              <Box mb={3}>
                <Typography variant='h6' gutterBottom>
                  Redaction Details
                </Typography>
                <Typography variant='body2'>
                  Request ID: {selectedRedaction.requestId}
                </Typography>
                <Typography variant='body2'>
                  Area: {selectedRedaction.width}×{selectedRedaction.height}{' '}
                  pixels
                </Typography>
                <Typography variant='body2'>
                  Position: ({selectedRedaction.x}, {selectedRedaction.y})
                </Typography>
                {selectedRedaction.reason && (
                  <Typography variant='body2' mt={1}>
                    <strong>Reason:</strong> {selectedRedaction.reason}
                  </Typography>
                )}
                {selectedRedaction.agencyRuleName && (
                  <Box mt={1}>
                    <Typography variant='body2'>
                      <strong>Agency Rule:</strong>{' '}
                      {selectedRedaction.agencyRuleName}
                    </Typography>
                    {selectedRedaction.sensitivityLevel && (
                      <Chip
                        label={selectedRedaction.sensitivityLevel.toUpperCase()}
                        size='small'
                        sx={{
                          backgroundColor: getSensitivityColor(
                            selectedRedaction.sensitivityLevel
                          ),
                          color: 'white',
                          mt: 1,
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                label={`${reviewAction === 'approve' ? 'Approval' : 'Rejection'} Comment`}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                multiline
                rows={4}
                placeholder={`Please provide a reason for ${reviewAction === 'approve' ? 'approving' : 'rejecting'} this redaction...`}
                required={reviewAction === 'reject'}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            color={reviewAction === 'approve' ? 'success' : 'error'}
            onClick={handleReviewRedaction}
            disabled={reviewAction === 'reject' && !reviewComment.trim()}
          >
            {reviewAction === 'approve' ? 'Approve' : 'Reject'} Redaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RedactionApprovalWorkflow;
