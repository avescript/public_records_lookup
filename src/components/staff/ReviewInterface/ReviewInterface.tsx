/**
 * ReviewInterface - Step 4 of V2 Workflow
 * Comprehensive review interface for final approval and delivery preparation
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Comment as CommentIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
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
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { PublicRecordRequest } from '@/types/request';
import { GeneratedResponse } from '@/types/response';
import {
  ApprovalRequest,
  ApprovalStatus,
  DeliveryConfiguration,
  ReviewComparison,
  ReviewMetrics,
  ReviewSession,
} from '@/types/review';

import { WorkflowPage } from '../WorkflowPage';

import { ApprovalChecklist } from './ApprovalChecklist';
import { BatchApprovalDialog } from './BatchApprovalDialog';
import { DeliveryConfigPanel } from './DeliveryConfigPanel';
import { RequestDetailsPanel } from './RequestDetailsPanel';
import { ResponsePreviewPanel } from './ResponsePreviewPanel';
import { ReviewHistory } from './ReviewHistory';

interface ReviewInterfaceProps {
  requestId: string;
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
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `review-tab-${index}`,
    'aria-controls': `review-tabpanel-${index}`,
  };
}

export function ReviewInterface({ requestId }: ReviewInterfaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { canApprove, canSend, canExport } = usePermissions();
  const {
    request,
    loading: requestLoading,
    error: requestError,
  } = useRequest(requestId);

  // Component State
  const [activeTab, setActiveTab] = useState(0);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(
    null
  );
  const [comparison, setComparison] = useState<ReviewComparison | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(
    []
  );
  const [deliveryConfig, setDeliveryConfig] =
    useState<DeliveryConfiguration | null>(null);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Loading states
  const [loadingComparison, setLoadingComparison] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [savingDecision, setSavingDecision] = useState(false);

  // Data Loading
  useEffect(() => {
    if (requestId && user) {
      loadReviewData();
    }
  }, [requestId, user, loadReviewData]);

  const loadReviewData = useCallback(async () => {
    try {
      setLoadingComparison(true);
      setLoadingApprovals(true);

      // Load review comparison data
      const comparisonResponse = await fetch(
        `/api/requests/${requestId}/review/comparison`
      );
      const comparisonData = await comparisonResponse.json();
      setComparison(comparisonData);

      // Load approval requests
      const approvalsResponse = await fetch(
        `/api/requests/${requestId}/approvals`
      );
      const approvalsData = await approvalsResponse.json();
      setApprovalRequests(approvalsData);

      // Load or create review session
      const sessionResponse = await fetch(
        `/api/requests/${requestId}/review/session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewerId: user.uid }),
        }
      );
      const sessionData = await sessionResponse.json();
      setReviewSession(sessionData);
    } catch (error) {
      console.error('Failed to load review data:', error);
    } finally {
      setLoadingComparison(false);
      setLoadingApprovals(false);
    }
  }, [requestId, user]);

  // Computed Properties
  const completedSteps = useMemo(() => {
    const steps = [];
    if (comparison?.request) steps.push('locate');
    if (comparison?.redactions?.length > 0) steps.push('redact');
    if (comparison?.response) steps.push('respond');
    return steps;
  }, [comparison]);

  const canProceed = useMemo(() => {
    return (
      comparison &&
      comparison.complianceScore >= 85 &&
      comparison.qualityScore >= 80 &&
      !comparison.riskAssessment.requiresLegalReview
    );
  }, [comparison]);

  const reviewStatus = useMemo(() => {
    if (loadingComparison || loadingApprovals) return 'loading';
    if (!comparison) return 'error';

    const pendingApprovals = approvalRequests.filter(
      a => a.status === 'pending'
    );
    const hasRejections = approvalRequests.some(a => a.status === 'rejected');

    if (hasRejections) return 'rejected';
    if (pendingApprovals.length > 0) return 'pending';
    if (approvalRequests.every(a => a.status === 'approved')) return 'approved';

    return 'ready';
  }, [comparison, approvalRequests, loadingComparison, loadingApprovals]);

  // Event Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleApprovalDecision = async (
    status: ApprovalStatus,
    comments?: string
  ) => {
    if (!reviewSession) return;

    setSavingDecision(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: user.uid,
          status,
          comments,
          sessionId: reviewSession.id,
        }),
      });

      if (response.ok) {
        await loadReviewData(); // Refresh data

        // Navigate based on decision
        if (status === 'approved') {
          setActiveTab(3); // Switch to delivery tab
        }
      }
    } catch (error) {
      console.error('Failed to save approval decision:', error);
    } finally {
      setSavingDecision(false);
    }
  };

  const handleSendResponse = async () => {
    if (!deliveryConfig) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryConfig),
      });

      if (response.ok) {
        // Navigate back to dashboard with success message
        router.push(
          `/staff/dashboard?success=Request ${requestId} sent successfully`
        );
      }
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportResponse = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch(`/api/requests/${requestId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `response-${requestId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export response:', error);
    }
  };

  // Render Loading State
  if (requestLoading || loadingComparison) {
    return (
      <WorkflowPage
        requestId={requestId}
        currentStep='review'
        completedSteps={[]}
        title='Review & Send'
        subtitle='Loading review data...'
      >
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
            Preparing review interface...
          </Typography>
        </Box>
      </WorkflowPage>
    );
  }

  // Render Error State
  if (requestError || !comparison) {
    return (
      <WorkflowPage
        requestId={requestId}
        currentStep='review'
        completedSteps={[]}
        title='Review & Send'
        subtitle='Error loading review data'
      >
        <Alert severity='error' sx={{ m: 3 }}>
          Unable to load review data. Please refresh the page or contact
          support.
        </Alert>
      </WorkflowPage>
    );
  }

  return (
    <WorkflowPage
      requestId={requestId}
      currentStep='review'
      completedSteps={completedSteps}
      title='Review & Send'
      subtitle='Final review and delivery preparation'
    >
      <Box sx={{ width: '100%' }}>
        {/* Status Overview */}
        <Paper sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h6'>Review Status</Typography>
                <Chip
                  label={reviewStatus.replace('_', ' ').toUpperCase()}
                  color={
                    reviewStatus === 'approved'
                      ? 'success'
                      : reviewStatus === 'rejected'
                        ? 'error'
                        : reviewStatus === 'pending'
                          ? 'warning'
                          : 'default'
                  }
                  variant='outlined'
                />
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title='Quality Score'>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${comparison.qualityScore}%`}
                    color={
                      comparison.qualityScore >= 80 ? 'success' : 'warning'
                    }
                    size='small'
                  />
                </Tooltip>
                <Tooltip title='Compliance Score'>
                  <Chip
                    icon={<AssignmentIcon />}
                    label={`${comparison.complianceScore}%`}
                    color={
                      comparison.complianceScore >= 85 ? 'success' : 'error'
                    }
                    size='small'
                  />
                </Tooltip>
                <Tooltip title='Risk Level'>
                  <Chip
                    icon={
                      comparison.riskAssessment.level === 'high' ||
                      comparison.riskAssessment.level === 'critical' ? (
                        <WarningIcon />
                      ) : (
                        <CheckCircleIcon />
                      )
                    }
                    label={comparison.riskAssessment.level.toUpperCase()}
                    color={
                      comparison.riskAssessment.level === 'low'
                        ? 'success'
                        : comparison.riskAssessment.level === 'medium'
                          ? 'warning'
                          : 'error'
                    }
                    size='small'
                  />
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label='review interface tabs'
            variant='scrollable'
            scrollButtons='auto'
          >
            <Tab
              label='Request Details'
              icon={<VisibilityIcon />}
              {...a11yProps(0)}
            />
            <Tab
              label='Response Preview'
              icon={<EditIcon />}
              {...a11yProps(1)}
            />
            <Tab
              label='Approval Checklist'
              icon={<AssignmentIcon />}
              {...a11yProps(2)}
            />
            <Tab
              label='Delivery Setup'
              icon={<SendIcon />}
              disabled={reviewStatus !== 'approved' && !canProceed}
              {...a11yProps(3)}
            />
            <Tab label='History' icon={<HistoryIcon />} {...a11yProps(4)} />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <RequestDetailsPanel
            request={comparison.request}
            comparison={comparison}
            onEdit={() => setActiveTab(1)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ResponsePreviewPanel
            response={comparison.response}
            request={comparison.request}
            redactions={comparison.redactions}
            onApprove={() => handleApprovalDecision('approved')}
            onReject={() => handleApprovalDecision('rejected')}
            onRequestRevision={() => handleApprovalDecision('needs_revision')}
            loading={savingDecision}
            canApprove={canApprove}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ApprovalChecklist
            comparison={comparison}
            approvalRequests={approvalRequests}
            onDecision={handleApprovalDecision}
            loading={savingDecision}
            canApprove={canApprove}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <DeliveryConfigPanel
            requestId={requestId}
            comparison={comparison}
            config={deliveryConfig}
            onChange={setDeliveryConfig}
            onSend={handleSendResponse}
            onExport={handleExportResponse}
            loading={isProcessing}
            canSend={canSend}
            canExport={canExport}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <ReviewHistory
            requestId={requestId}
            approvalRequests={approvalRequests}
            reviewSession={reviewSession}
          />
        </TabPanel>

        {/* Action Buttons */}
        <Paper
          sx={{ p: 2, mt: 3, display: 'flex', justifyContent: 'space-between' }}
        >
          <Box>
            <Button
              variant='outlined'
              onClick={() => router.push('/staff/dashboard')}
              sx={{ mr: 2 }}
            >
              Return to Dashboard
            </Button>
            <Button
              variant='outlined'
              onClick={() => setShowBatchDialog(true)}
              disabled={!canApprove}
              startIcon={<AssignmentIcon />}
            >
              Batch Operations
            </Button>
          </Box>
          <Box>
            {reviewStatus === 'ready' && canApprove && (
              <>
                <Button
                  variant='outlined'
                  color='error'
                  onClick={() => handleApprovalDecision('rejected')}
                  disabled={savingDecision}
                  sx={{ mr: 2 }}
                >
                  Reject
                </Button>
                <Button
                  variant='contained'
                  color='success'
                  onClick={() => handleApprovalDecision('approved')}
                  disabled={savingDecision}
                  startIcon={<CheckCircleIcon />}
                >
                  Approve
                </Button>
              </>
            )}
            {reviewStatus === 'approved' && canSend && (
              <Button
                variant='contained'
                onClick={handleSendResponse}
                disabled={!deliveryConfig || isProcessing}
                startIcon={<SendIcon />}
              >
                Send Response
              </Button>
            )}
          </Box>
        </Paper>

        {/* Batch Operations Dialog */}
        <BatchApprovalDialog
          open={showBatchDialog}
          onClose={() => setShowBatchDialog(false)}
          requestIds={[requestId]}
        />
      </Box>
    </WorkflowPage>
  );
}
