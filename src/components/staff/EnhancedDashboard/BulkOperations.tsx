'use client';

import React, { useState } from 'react';
import {
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';

import { RequestStatus, StoredRequest } from '@/services/requestService';

export interface SortOption {
  field:
    | 'submittedAt'
    | 'updatedAt'
    | 'title'
    | 'department'
    | 'status'
    | 'priority'
    | 'dueDate';
  direction: 'asc' | 'desc';
  label: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (requestIds: string[]) => void;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface BulkOperationsProps {
  requests: StoredRequest[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onBulkStatusUpdate?: (requestIds: string[], status: RequestStatus) => void;
  onBulkAssignment?: (requestIds: string[], assignee: string) => void;
  onBulkExport?: (requestIds: string[], format: 'csv' | 'pdf') => void;
  onBulkDelete?: (requestIds: string[]) => void;
}

const sortOptions: SortOption[] = [
  { field: 'submittedAt', direction: 'desc', label: 'Date Submitted (Newest)' },
  { field: 'submittedAt', direction: 'asc', label: 'Date Submitted (Oldest)' },
  { field: 'updatedAt', direction: 'desc', label: 'Last Updated (Newest)' },
  { field: 'updatedAt', direction: 'asc', label: 'Last Updated (Oldest)' },
  { field: 'title', direction: 'asc', label: 'Title (A-Z)' },
  { field: 'title', direction: 'desc', label: 'Title (Z-A)' },
  { field: 'department', direction: 'asc', label: 'Department (A-Z)' },
  { field: 'status', direction: 'asc', label: 'Status' },
  { field: 'priority', direction: 'desc', label: 'Priority (High to Low)' },
  { field: 'dueDate', direction: 'asc', label: 'Due Date (Earliest)' },
];

const statusOptions: RequestStatus[] = [
  'submitted',
  'processing',
  'under_review',
  'completed',
  'rejected',
];

const staffOptions = [
  'John Smith',
  'Sarah Johnson',
  'Mike Davis',
  'Emily Brown',
];

export function BulkOperations({
  requests,
  selectedIds,
  onSelectionChange,
  sortOption,
  onSortChange,
  onBulkStatusUpdate,
  onBulkAssignment,
  onBulkExport,
  onBulkDelete,
}: BulkOperationsProps) {
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ open: false, title: '', message: '', action: () => {} });

  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  const [selectedStatus, setSelectedStatus] =
    useState<RequestStatus>('processing');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedExportFormat, setSelectedExportFormat] = useState<
    'csv' | 'pdf'
  >('csv');

  const isAllSelected =
    requests.length > 0 && selectedIds.length === requests.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < requests.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(requests.map(r => r.id!).filter(Boolean));
    }
  };

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const handleBulkStatusUpdate = () => {
    if (onBulkStatusUpdate) {
      onBulkStatusUpdate(selectedIds, selectedStatus);
      onSelectionChange([]);
    }
    setStatusUpdateDialog(false);
  };

  const handleBulkAssignment = () => {
    if (onBulkAssignment && selectedAssignee) {
      onBulkAssignment(selectedIds, selectedAssignee);
      onSelectionChange([]);
    }
    setAssignmentDialog(false);
  };

  const handleBulkExport = () => {
    if (onBulkExport) {
      onBulkExport(selectedIds, selectedExportFormat);
    }
    setExportDialog(false);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      setConfirmDialog({
        open: true,
        title: 'Delete Requests',
        message: `Are you sure you want to delete ${selectedIds.length} request(s)? This action cannot be undone.`,
        action: () => {
          onBulkDelete(selectedIds);
          onSelectionChange([]);
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    }
  };

  return (
    <>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: selectedIds.length > 0 ? 'action.selected' : 'transparent',
          borderRadius: 1,
          mb: 1,
        }}
      >
        {/* Selection Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
          <Checkbox
            color='primary'
            indeterminate={isIndeterminate}
            checked={isAllSelected}
            onChange={handleSelectAll}
            icon={<CheckBoxOutlineBlankIcon />}
            checkedIcon={<CheckBoxIcon />}
            inputProps={{ 'aria-label': 'select all requests' }}
          />
          {selectedIds.length > 0 ? (
            <Typography variant='subtitle1' sx={{ ml: 1 }}>
              {selectedIds.length} selected
            </Typography>
          ) : (
            <Typography variant='subtitle1' sx={{ ml: 1 }}>
              Select requests
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Sorting Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortOptions.findIndex(
                opt =>
                  opt.field === sortOption.field &&
                  opt.direction === sortOption.direction
              )}
              onChange={e =>
                onSortChange(sortOptions[e.target.value as number])
              }
              label='Sort by'
            >
              {sortOptions.map((option, index) => (
                <MenuItem key={index} value={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {option.direction === 'asc' ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                    <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='outlined'
                size='small'
                onClick={() => setStatusUpdateDialog(true)}
                startIcon={<AssignmentIcon />}
              >
                Update Status
              </Button>
              <Button
                variant='outlined'
                size='small'
                onClick={() => setAssignmentDialog(true)}
                startIcon={<PersonIcon />}
              >
                Assign
              </Button>
              <IconButton size='small' onClick={handleBulkMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Toolbar>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={handleBulkMenuClose}
      >
        <MenuItem
          onClick={() => {
            setExportDialog(true);
            handleBulkMenuClose();
          }}
        >
          <ListItemIcon>
            <ExportIcon />
          </ListItemIcon>
          <ListItemText>Export Selected</ListItemText>
        </MenuItem>
        {onBulkDelete && (
          <MenuItem
            onClick={() => {
              handleBulkDelete();
              handleBulkMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete Selected</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialog}
        onClose={() => setStatusUpdateDialog(false)}
      >
        <DialogTitle>
          Update Status for {selectedIds.length} Request(s)
        </DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as RequestStatus)}
              label='New Status'
            >
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  <Chip
                    label={status.replace('_', ' ').toUpperCase()}
                    size='small'
                    sx={{ minWidth: 120 }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkStatusUpdate} variant='contained'>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignmentDialog}
        onClose={() => setAssignmentDialog(false)}
      >
        <DialogTitle>Assign {selectedIds.length} Request(s)</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Assign to</InputLabel>
            <Select
              value={selectedAssignee}
              onChange={e => setSelectedAssignee(e.target.value)}
              label='Assign to'
            >
              {staffOptions.map(staff => (
                <MenuItem key={staff} value={staff}>
                  {staff}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAssignment}
            variant='contained'
            disabled={!selectedAssignee}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export {selectedIds.length} Request(s)</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={selectedExportFormat}
              onChange={e =>
                setSelectedExportFormat(e.target.value as 'csv' | 'pdf')
              }
              label='Export Format'
            >
              <MenuItem value='csv'>CSV Spreadsheet</MenuItem>
              <MenuItem value='pdf'>PDF Report</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkExport} variant='contained'>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.action}
            variant='contained'
            color='error'
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
