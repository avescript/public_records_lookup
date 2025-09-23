'use client';

import React, { useState } from 'react';
import {
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import { RequestStatus, StoredRequest } from '../../../services/requestService';

interface RequestDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  request: StoredRequest | null;
  onStatusUpdate?: (requestId: string, newStatus: RequestStatus) => void;
  onNotesAdd?: (requestId: string, note: string) => void;
}

const DRAWER_WIDTH = 600;

const statusOptions: { value: RequestStatus; label: string; color: string }[] =
  [
    { value: 'submitted', label: 'Submitted', color: 'info' },
    { value: 'processing', label: 'Processing', color: 'primary' },
    { value: 'under_review', label: 'Under Review', color: 'warning' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
  ];

const departmentDisplayNames: Record<string, string> = {
  police: 'Police Department',
  fire: 'Fire Department',
  clerk: 'City Clerk',
  finance: 'Finance Department',
  public_works: 'Public Works',
  legal: 'Legal Department',
  other: 'Other',
};

export function RequestDetailsDrawer({
  open,
  onClose,
  request,
  onStatusUpdate,
  onNotesAdd,
}: RequestDetailsDrawerProps) {
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>('submitted');
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const getDepartmentDisplayName = (department: string) => {
    return departmentDisplayNames[department] || department;
  };

  const getStatusColor = (status: RequestStatus) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || 'default';
  };

  const handleStatusEdit = () => {
    if (request) {
      setNewStatus(request.status);
      setEditingStatus(true);
    }
  };

  const handleStatusSave = () => {
    if (request && onStatusUpdate) {
      onStatusUpdate(request.id!, newStatus);
      setEditingStatus(false);
    }
  };

  const handleStatusCancel = () => {
    setEditingStatus(false);
    setNewStatus(request?.status || 'submitted');
  };

  const handleNoteAdd = () => {
    setAddingNote(true);
    setNewNote('');
  };

  const handleNoteSave = () => {
    if (request && newNote.trim() && onNotesAdd) {
      onNotesAdd(request.id!, newNote.trim());
      setAddingNote(false);
      setNewNote('');
    }
  };

  const handleNoteCancel = () => {
    setAddingNote(false);
    setNewNote('');
  };

  if (!request) {
    return null;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Header */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="h6" component="div">
          Request Details
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>

      {/* Content */}
      <Box sx={{ p: 3, overflow: 'auto' }}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tracking ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {request.trackingId}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1">{request.title}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {request.description}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1">
                  {getDepartmentDisplayName(request.department)}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Status Management */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="h6">Status</Typography>
              {!editingStatus && (
                <IconButton size="small" onClick={handleStatusEdit}>
                  <EditIcon />
                </IconButton>
              )}
            </Box>

            {editingStatus ? (
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="Status"
                    onChange={e => setNewStatus(e.target.value as RequestStatus)}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleStatusSave}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleStatusCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Chip
                label={request.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(request.status) as any}
                size="medium"
              />
            )}
          </Paper>

          {/* Contact Information */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="action" />
              <Typography variant="body1">{request.contactEmail}</Typography>
            </Box>
          </Paper>

          {/* Date Information */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Timeline
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(request.submittedAt)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(request.updatedAt)}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Date Range Requested
                </Typography>
                <Typography variant="body1">
                  {request.dateRange.startDate} to {request.dateRange.endDate}
                  {request.dateRange.preset && (
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      ({request.dateRange.preset})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Attachments */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attachments
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachFileIcon color="action" />
              <Typography variant="body1">
                {request.attachmentCount} file{request.attachmentCount !== 1 ? 's' : ''} attached
              </Typography>
            </Box>
            {request.attachmentCount === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No attachments provided
              </Typography>
            )}
          </Paper>

          {/* Internal Notes */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="h6">Internal Notes</Typography>
              {!addingNote && (
                <Button
                  size="small"
                  startIcon={<AssignmentIcon />}
                  onClick={handleNoteAdd}
                >
                  Add Note
                </Button>
              )}
            </Box>

            {addingNote && (
              <Stack spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add an internal note about this request..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleNoteSave}
                    disabled={!newNote.trim()}
                  >
                    Add Note
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleNoteCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              </Stack>
            )}

            <Typography variant="body2" color="text.secondary">
              No internal notes yet
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Drawer>
  );
}