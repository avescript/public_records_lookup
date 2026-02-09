'use client';

import React, { useState } from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slide,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { format } from 'date-fns';

import { StoredRequest } from '../../../services/requestService';

interface BulkOperationsPanelProps {
  selectedRequestIds: string[];
  requests: StoredRequest[];
  onSelectionChange: (requestIds: string[]) => void;
  onBulkAction: (action: BulkAction, data?: any) => Promise<void>;
  loading?: boolean;
}

export interface BulkAction {
  type: 'assign' | 'status' | 'export' | 'delete';
  data?: any;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedRequestIds,
  requests,
  onSelectionChange,
  onBulkAction,
  loading = false,
}) => {
  const [assignDialog, setAssignDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [assignTo, setAssignTo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>(
    'csv'
  );
  const [actionLoading, setActionLoading] = useState(false);

  const selectedRequests = requests.filter(r =>
    selectedRequestIds.includes(r.id)
  );
  const totalRequests = requests.length;
  const selectedCount = selectedRequestIds.length;

  // Mock users for assignment (TODO: Replace with actual user service)
  const availableUsers = [
    { id: 'user1', name: 'John Smith', role: 'Staff' },
    { id: 'user2', name: 'Sarah Johnson', role: 'Legal Reviewer' },
    { id: 'user3', name: 'Mike Wilson', role: 'Admin' },
  ];

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', color: 'info' },
    { value: 'processing', label: 'Processing', color: 'primary' },
    { value: 'under_review', label: 'Under Review', color: 'warning' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
  ];

  const handleSelectAll = () => {
    if (selectedCount === totalRequests) {
      onSelectionChange([]);
    } else {
      onSelectionChange(requests.map(r => r.id));
    }
  };

  const handleAssign = async () => {
    if (!assignTo || selectedCount === 0) return;

    setActionLoading(true);
    try {
      await onBulkAction({ type: 'assign', data: { userId: assignTo } });
      setAssignDialog(false);
      setAssignTo('');
    } catch (error) {
      console.error('Failed to assign requests:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || selectedCount === 0) return;

    setActionLoading(true);
    try {
      await onBulkAction({ type: 'status', data: { status: newStatus } });
      setStatusDialog(false);
      setNewStatus('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedCount === 0) return;

    setActionLoading(true);
    try {
      await onBulkAction({ type: 'export', data: { format: exportFormat } });
      setExportDialog(false);
    } catch (error) {
      console.error('Failed to export requests:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedCount === 0) return;

    setActionLoading(true);
    try {
      await onBulkAction({ type: 'delete' });
      setDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete requests:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy');
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Card
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          border: 2,
          borderColor: 'primary.main',
          bgcolor: 'primary.50',
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Box display='flex' alignItems='center' gap={1}>
              <Checkbox
                checked={selectedCount === totalRequests}
                indeterminate={
                  selectedCount > 0 && selectedCount < totalRequests
                }
                onChange={handleSelectAll}
                color='primary'
              />
              <Typography variant='body1' fontWeight='bold'>
                {selectedCount} of {totalRequests} selected
              </Typography>
            </Box>

            <Divider orientation='vertical' flexItem />

            <Stack direction='row' spacing={1} sx={{ flexGrow: 1 }}>
              <Button
                startIcon={<AssignmentIcon />}
                onClick={() => setAssignDialog(true)}
                size='small'
                disabled={loading || actionLoading}
              >
                Assign
              </Button>

              <Button
                startIcon={<EditIcon />}
                onClick={() => setStatusDialog(true)}
                size='small'
                disabled={loading || actionLoading}
              >
                Update Status
              </Button>

              <Button
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialog(true)}
                size='small'
                disabled={loading || actionLoading}
              >
                Export
              </Button>

              <Button
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
                color='error'
                size='small'
                disabled={loading || actionLoading}
              >
                Delete
              </Button>
            </Stack>

            <IconButton
              onClick={() => onSelectionChange([])}
              size='small'
              color='default'
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Selection Summary */}
          {selectedCount > 0 && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderTopColor: 'divider',
              }}
            >
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Selected Requests Summary:
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                {Object.entries(
                  selectedRequests.reduce(
                    (acc, req) => {
                      acc[req.status] = (acc[req.status] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([status, count]) => (
                  <Chip
                    key={status}
                    label={`${count} ${status.replace('_', ' ')}`}
                    size='small'
                    variant='outlined'
                  />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        TransitionComponent={Transition}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Assign Selected Requests</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              Assigning {selectedCount} request{selectedCount !== 1 ? 's' : ''}{' '}
              to a user
            </Typography>
          </Box>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={assignTo}
              onChange={e => setAssignTo(e.target.value)}
              label='Assign To'
            >
              {availableUsers.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  <Box>
                    <Typography variant='body2'>{user.name}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {user.role}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssign}
            variant='contained'
            disabled={!assignTo || actionLoading}
          >
            Assign {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        TransitionComponent={Transition}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Update Request Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              Updating status for {selectedCount} request
              {selectedCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              label='New Status'
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Chip
                    label={option.label}
                    size='small'
                    color={option.color as any}
                    sx={{ mr: 1 }}
                  />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant='contained'
            disabled={!newStatus || actionLoading}
          >
            Update {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        TransitionComponent={Transition}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Export Selected Requests</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              Exporting {selectedCount} request{selectedCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as any)}
              label='Export Format'
            >
              <MenuItem value='csv'>CSV (Excel Compatible)</MenuItem>
              <MenuItem value='json'>JSON (Raw Data)</MenuItem>
              <MenuItem value='pdf'>PDF (Report Format)</MenuItem>
            </Select>
          </FormControl>

          {/* Selected Requests Preview */}
          <Box sx={{ mt: 3, maxHeight: 200, overflow: 'auto' }}>
            <Typography variant='body2' gutterBottom>
              Requests to Export:
            </Typography>
            {selectedRequests.slice(0, 5).map(request => (
              <Box
                key={request.id}
                sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}
              >
                <Typography variant='body2'>
                  {request.trackingId}: {request.title}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {formatDate(request.submittedAt)} • {request.status}
                </Typography>
              </Box>
            ))}
            {selectedRequests.length > 5 && (
              <Typography variant='caption' color='text.secondary'>
                ... and {selectedRequests.length - 5} more
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant='contained'
            startIcon={<DownloadIcon />}
            disabled={actionLoading}
          >
            Export {exportFormat.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        TransitionComponent={Transition}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle color='error.main'>Delete Selected Requests</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action cannot be undone. All selected requests and their
            associated data will be permanently deleted.
          </Alert>
          <Typography variant='body2' gutterBottom>
            You are about to delete {selectedCount} request
            {selectedCount !== 1 ? 's' : ''}:
          </Typography>
          <Box sx={{ maxHeight: 150, overflow: 'auto', mt: 2 }}>
            {selectedRequests.map(request => (
              <Box key={request.id} sx={{ mb: 1 }}>
                <Typography variant='body2'>
                  {request.trackingId}: {request.title}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color='error'
            variant='contained'
            disabled={actionLoading}
          >
            Delete {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
