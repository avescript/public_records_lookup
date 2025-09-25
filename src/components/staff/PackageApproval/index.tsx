/**
 * Package Approval Component (US-051)
 * Manages package-level approvals with locking mechanism for delivery
 * Part of Epic 5: Approvals & Legal Review
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Paper,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as ChangesIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Inventory as PackageIcon,
  Security as SecurityIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { 
  legalReviewService, 
  PackageApproval,
  type PackageApproval as PackageApprovalType 
} from '../../../services/legalReviewService';

interface PackageApprovalProps {
  requestId: string;
  recordIds: string[];
  packageId?: string;
  onApprovalComplete?: (approval: PackageApproval) => void;
  onApprovalUpdated?: (approval: PackageApproval) => void;
}

interface ApprovalDialogProps {
  open: boolean;
  packageApproval: PackageApprovalType | null;
  onClose: () => void;
  onSubmit: (
    decision: 'approved' | 'rejected' | 'changes_requested',
    reason?: string,
    comments?: string
  ) => void;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({ 
  open, 
  packageApproval, 
  onClose, 
  onSubmit 
}) => {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    onSubmit(decision, reason || undefined, comments || undefined);
    setReason('');
    setComments('');
    setDecision('approved');
    onClose();
  };

  if (!packageApproval) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PackageIcon />
          Package Approval Decision
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Package: {packageApproval.packageId}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Request: {packageApproval.requestId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Records: {packageApproval.totalRecords} documents
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Decision</InputLabel>
              <Select
                value={decision}
                onChange={(e) => setDecision(e.target.value as any)}
                label="Decision"
              >
                <MenuItem value="approved">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ApproveIcon color="success" />
                    Approve for Release
                  </Box>
                </MenuItem>
                <MenuItem value="changes_requested">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ChangesIcon color="warning" />
                    Request Changes
                  </Box>
                </MenuItem>
                <MenuItem value="rejected">
                  <Box display="flex" alignItems="center" gap={1}>
                    <RejectIcon color="error" />
                    Reject Package
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {decision === 'rejected' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Rejection"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                multiline
                rows={3}
                helperText="Please explain why this package is being rejected"
              />
            </Grid>
          )}

          {decision === 'changes_requested' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Required Changes"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                multiline
                rows={3}
                helperText="Specify what changes are needed before approval"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Comments (Optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              multiline
              rows={2}
              helperText="Any additional notes about your decision"
            />
          </Grid>

          {decision === 'approved' && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  <strong>Important:</strong> Approving this package will lock it for delivery. 
                  This action cannot be undone without administrator intervention.
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          color={decision === 'approved' ? 'success' : decision === 'rejected' ? 'error' : 'warning'}
          disabled={
            (decision === 'rejected' || decision === 'changes_requested') && !reason.trim()
          }
        >
          {decision === 'approved' && 'Approve & Lock'}
          {decision === 'rejected' && 'Reject Package'}
          {decision === 'changes_requested' && 'Request Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface PackageCardProps {
  packageApproval: PackageApprovalType;
  onApprove: () => void;
  onViewDetails: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  packageApproval, 
  onApprove, 
  onViewDetails 
}) => {
  const getStatusColor = (status: PackageApprovalType['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'changes_requested': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: PackageApprovalType['status']) => {
    switch (status) {
      case 'approved': return <ApproveIcon />;
      case 'rejected': return <RejectIcon />;
      case 'changes_requested': return <ChangesIcon />;
      default: return <PackageIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDaysOld = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card sx={{ 
      mb: 2, 
      border: packageApproval.status === 'pending' ? '2px solid #ed6c02' : undefined,
      opacity: packageApproval.isLocked ? 0.8 : 1
    }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {packageApproval.isLocked ? (
              <LockIcon color="error" />
            ) : (
              <UnlockIcon color="success" />
            )}
            <Typography variant="h6">
              Package: {packageApproval.packageId}
            </Typography>
            <Chip 
              label={packageApproval.status.replace('_', ' ').toUpperCase()} 
              color={getStatusColor(packageApproval.status)}
              icon={getStatusIcon(packageApproval.status)}
              size="small"
            />
            {packageApproval.isLocked && (
              <Chip 
                label="LOCKED FOR DELIVERY" 
                color="error"
                size="small"
                icon={<LockIcon />}
              />
            )}
          </Box>
        </Box>

        {/* Package Details */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Request ID:</strong> {packageApproval.requestId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Total Records:</strong> {packageApproval.totalRecords}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Created:</strong> {formatDate(packageApproval.createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Days Old:</strong> {getDaysOld(packageApproval.createdAt)} days
            </Typography>
            {packageApproval.reviewerName && (
              <Typography variant="body2" color="text.secondary">
                <strong>Reviewer:</strong> {packageApproval.reviewerName}
              </Typography>
            )}
            {packageApproval.approvedAt && (
              <Typography variant="body2" color="text.secondary">
                <strong>Approved:</strong> {formatDate(packageApproval.approvedAt)}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Status-specific Info */}
        {packageApproval.reason && (
          <Alert 
            severity={packageApproval.status === 'approved' ? 'success' : 'error'} 
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              <strong>
                {packageApproval.status === 'approved' ? 'Approval Notes:' : 'Issue:'}
              </strong> {packageApproval.reason}
            </Typography>
          </Alert>
        )}

        {packageApproval.comments && (
          <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Comments:</strong> {packageApproval.comments}
            </Typography>
          </Box>
        )}

        {/* Progress Bar for pending packages */}
        {packageApproval.status === 'pending' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Awaiting Legal Review
            </Typography>
            <LinearProgress color="warning" />
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={onViewDetails}
        >
          View Details
        </Button>
        
        {packageApproval.status === 'pending' && !packageApproval.isLocked && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<ApproveIcon />}
            onClick={onApprove}
          >
            Review & Approve
          </Button>
        )}

        {packageApproval.isLocked && packageApproval.deliveryApproved && (
          <Chip 
            label="APPROVED FOR DELIVERY" 
            color="success"
            size="small"
            icon={<SecurityIcon />}
          />
        )}
      </CardActions>
    </Card>
  );
};

export const PackageApprovalComponent: React.FC<PackageApprovalProps> = ({
  requestId,
  recordIds,
  packageId,
  onApprovalComplete,
  onApprovalUpdated,
}) => {
  const [packageApprovals, setPackageApprovals] = useState<PackageApprovalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedPackageApproval, setSelectedPackageApproval] = useState<PackageApprovalType | null>(null);

  // Mock current user - in real app this would come from auth context
  const currentUser = {
    id: 'user_legal_001',
    name: 'Sarah Johnson',
    role: 'legal_reviewer' as const,
  };

  useEffect(() => {
    loadPackageApprovals();
  }, [requestId]);

  const loadPackageApprovals = async () => {
    try {
      setLoading(true);
      const approvals = await legalReviewService.getPackageApprovalsByRequest(requestId);
      setPackageApprovals(approvals);
      setError(null);
    } catch (err) {
      console.error('Failed to load package approvals:', err);
      setError('Failed to load package approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackageApproval = async () => {
    try {
      const newApproval = await legalReviewService.createPackageApproval(
        requestId,
        recordIds,
        packageId
      );
      setPackageApprovals([newApproval, ...packageApprovals]);
      onApprovalComplete?.(newApproval);
    } catch (err) {
      console.error('Failed to create package approval:', err);
      setError('Failed to create package approval');
    }
  };

  const handleOpenApprovalDialog = (packageApproval: PackageApprovalType) => {
    setSelectedPackageApproval(packageApproval);
    setApprovalDialogOpen(true);
  };

  const handleSubmitApproval = async (
    decision: 'approved' | 'rejected' | 'changes_requested',
    reason?: string,
    comments?: string
  ) => {
    if (!selectedPackageApproval) return;

    try {
      const updatedApproval = await legalReviewService.submitPackageApproval(
        selectedPackageApproval.id,
        decision,
        currentUser.id,
        currentUser.name,
        reason,
        comments
      );
      
      await loadPackageApprovals();
      onApprovalUpdated?.(updatedApproval);
    } catch (err) {
      console.error('Failed to submit package approval:', err);
      setError('Failed to submit package approval');
    }
  };

  const handleViewDetails = (packageApproval: PackageApprovalType) => {
    // This would open a detailed view of the package
    console.log('View package details:', packageApproval);
  };

  if (loading) {
    return (
      <Box p={2}>
        <Typography>Loading package approvals...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h6">
          Package Approvals ({packageApprovals.length})
        </Typography>
        {packageApprovals.length === 0 && (
          <Button
            variant="contained"
            startIcon={<PackageIcon />}
            onClick={handleCreatePackageApproval}
          >
            Create Package for Approval
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Package Stats */}
      {packageApprovals.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {packageApprovals.filter(pa => pa.status === 'pending').length}
                </Typography>
                <Typography variant="caption">Pending</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {packageApprovals.filter(pa => pa.status === 'approved').length}
                </Typography>
                <Typography variant="caption">Approved</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {packageApprovals.filter(pa => pa.isLocked).length}
                </Typography>
                <Typography variant="caption">Locked</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {packageApprovals.reduce((sum, pa) => sum + pa.totalRecords, 0)}
                </Typography>
                <Typography variant="caption">Total Records</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Package Approvals List */}
      {packageApprovals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PackageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Package Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create a package approval to begin the legal review process for this request.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PackageIcon />}
            onClick={handleCreatePackageApproval}
          >
            Create Package Approval
          </Button>
        </Paper>
      ) : (
        packageApprovals.map((packageApproval) => (
          <PackageCard
            key={packageApproval.id}
            packageApproval={packageApproval}
            onApprove={() => handleOpenApprovalDialog(packageApproval)}
            onViewDetails={() => handleViewDetails(packageApproval)}
          />
        ))
      )}

      {/* Approval Dialog */}
      <ApprovalDialog
        open={approvalDialogOpen}
        packageApproval={selectedPackageApproval}
        onClose={() => {
          setApprovalDialogOpen(false);
          setSelectedPackageApproval(null);
        }}
        onSubmit={handleSubmitApproval}
      />
    </Box>
  );
};

export default PackageApprovalComponent;