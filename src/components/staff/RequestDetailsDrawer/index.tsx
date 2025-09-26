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
  Search as SearchIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
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

import dynamic from 'next/dynamic';
import { AuditPanel } from '@/components/staff/AuditPanel';

// Helper function to convert Firebase Timestamp or mock timestamp to Date
const convertToDate = (timestamp: any): Date => {
  try {
    if (!timestamp) {
      // Fallback for null/undefined
      return new Date();
    }
    
    if (typeof timestamp.toDate === 'function') {
      // Firebase Timestamp or mock timestamp with toDate method
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // Already a Date object
      return timestamp;
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      return new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // ISO string
      return new Date(timestamp);
    } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      // Mock Firebase timestamp object with seconds
      return new Date(timestamp.seconds * 1000);
    } else if (timestamp && typeof timestamp === 'object' && timestamp._isoString) {
      // Mock timestamp with stored ISO string
      return new Date(timestamp._isoString);
    } else {
      // Last resort fallback
      return new Date(timestamp);
    }
  } catch (error) {
    console.error('Error converting timestamp to date:', error, timestamp);
    return new Date(); // Return current date as fallback
  }
};

import { MatchResult } from '../../../services/aiMatchingService';
import { RequestStatus, StoredRequest, AssociatedRecord } from '../../../services/requestService';
import PIIFindings from '../../shared/PIIFindings';
import { CommentThreadComponent } from '../CommentThread';
import { PackageApprovalComponent } from '../PackageApproval';
import { PackageBuilder } from '../PackageBuilder';
import { CommentThread, PackageApproval } from '../../../services/legalReviewService';

// Dynamically import PDFPreview to prevent SSR issues with browser-specific APIs
const PDFPreview = dynamic(() => import('../../shared/PDFPreview/ClientWrapper'), {
  ssr: false,
  loading: () => <div>Loading PDF preview...</div>
});
import { PIIFinding } from '../../../services/piiDetectionService';

interface RequestDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  request: StoredRequest | null;
  onStatusUpdate?: (requestId: string, newStatus: RequestStatus) => void;
  onNotesAdd?: (requestId: string, note: string) => void;
  onFindMatches?: (requestId: string, description: string) => void;
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
  onFindMatches,
}: RequestDetailsDrawerProps) {
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>(request?.status || 'submitted');
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showPIIPreview, setShowPIIPreview] = useState(false);
  const [selectedPIIFile, setSelectedPIIFile] = useState<string | null>(null);
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firebase Timestamp or mock timestamp with toDate function
        date = timestamp.toDate();
      } else if (timestamp._isoString) {
        // Mock timestamp with ISO string fallback
        date = new Date(timestamp._isoString);
      } else if (typeof timestamp === 'string') {
        // ISO string
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else {
        // Fallback - try to create Date from whatever we have
        date = new Date(timestamp);
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in formatDate:', timestamp);
        return 'Invalid Date';
      }
      
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid Date';
    }
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

  const handleFindMatches = () => {
    if (request && onFindMatches) {
      onFindMatches(request.id!, request.description);
    }
  };

  const handleShowPIIPreview = (fileName?: string) => {
    setSelectedPIIFile(fileName || 'police_report_001.pdf'); // Default file for testing
    setShowPIIPreview(true);
  };

  const handleHidePIIPreview = () => {
    setShowPIIPreview(false);
    setSelectedPIIFile(null);
  };

  const handlePIIFindingSelect = (finding: PIIFinding) => {
    // Auto-select the file and show preview if not already shown
    if (!showPIIPreview || selectedPIIFile !== finding.fileName) {
      setSelectedPIIFile(finding.fileName);
      setShowPIIPreview(true);
    }
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

          {/* Associated Records */}
          {request.associatedRecords && request.associatedRecords.length > 0 && (
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Associated Records ({request.associatedRecords.length})
              </Typography>
              <Stack spacing={2}>
                {request.associatedRecords.map((record, index) => (
                  <Box
                    key={record.candidateId}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      backgroundColor: 'background.default'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {record.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={record.confidence.toUpperCase()}
                        color={record.confidence === 'high' ? 'success' : record.confidence === 'medium' ? 'warning' : 'default'}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {record.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Source:</strong> {record.source}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Agency:</strong> {record.agency}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Score:</strong> {(record.relevanceScore * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {record.keyPhrases.slice(0, 3).map((phrase, phraseIndex) => (
                        <Chip
                          key={phraseIndex}
                          label={phrase}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                      {record.keyPhrases.length > 3 && (
                        <Chip
                          label={`+${record.keyPhrases.length - 3} more`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Accepted by {record.acceptedBy} on {(() => {
                        try {
                          return format(convertToDate(record.acceptedAt), 'MMM d, yyyy \'at\' h:mm a');
                        } catch (error) {
                          console.error('Error formatting date:', error, record.acceptedAt);
                          return 'unknown date';
                        }
                      })()}
                    </Typography>
                  </Box>
                ))}
                
                {/* Package Builder Button */}
                <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowPackageBuilder(true)}
                    disabled={!request.associatedRecords || request.associatedRecords.length === 0}
                    sx={{ width: '100%' }}
                  >
                    Build Package for Delivery
                  </Button>
                </Box>
              </Stack>
            </Paper>
          )}

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

          {/* AI Matching */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Record Search
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use AI to find relevant records that might match this request
            </Typography>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleFindMatches}
              disabled={!onFindMatches}
              sx={{ mr: 1 }}
            >
              Find Matches
            </Button>
            {!onFindMatches && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                AI matching not available in this context
              </Typography>
            )}
          </Paper>

          {/* PII Detection & Redaction */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              PII Detection & Redaction
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Review documents for personally identifiable information that may need redaction
            </Typography>
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<SecurityIcon />}
                  onClick={() => handleShowPIIPreview()}
                  color="warning"
                >
                  Review PII Findings
                </Button>
                {showPIIPreview && (
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityOffIcon />}
                    onClick={handleHidePIIPreview}
                  >
                    Hide Preview
                  </Button>
                )}
              </Box>

              {/* PII Findings Summary */}
              {!showPIIPreview && (
                <PIIFindings
                  recordId={request.id!}
                  onFindingSelect={handlePIIFindingSelect}
                  groupBy="type"
                  showEmptyState={true}
                />
              )}

              {/* PDF Preview with PII Overlays */}
              {showPIIPreview && selectedPIIFile && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Document Preview: {selectedPIIFile}
                  </Typography>
                  <PDFPreview
                    recordId={request.id!}
                    fileName={selectedPIIFile}
                    onPIIFindingsLoad={(findings) => {
                      console.log('PII findings loaded:', findings.length);
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Epic 5: Comment Threads (US-050) */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Legal Review & Comments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Communicate with legal reviewers about changes and approvals
            </Typography>
            <CommentThreadComponent
              recordId={request.id!}
              fileName="main_document"
              onThreadCreated={(thread: CommentThread) => {
                console.log('New comment thread created:', thread);
              }}
              onThreadUpdated={(thread: CommentThread) => {
                console.log('Comment thread updated:', thread);
              }}
            />
          </Paper>

          {/* Epic 5: Package Approval (US-051) */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Package Approval
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage package-level approvals for final delivery
            </Typography>
            <PackageApprovalComponent
              requestId={request.id!}
              recordIds={[request.id!]} // In real app, this would be the actual matched record IDs
              onApprovalComplete={(approval: PackageApproval) => {
                console.log('Package approval completed:', approval);
              }}
              onApprovalUpdated={(approval: PackageApproval) => {
                console.log('Package approval updated:', approval);
              }}
            />
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

          {/* Audit Log */}
          <Paper elevation={1} sx={{ p: 3 }}>
            <AuditPanel
              requestId={request.id}
              title="Request Audit Log"
              maxHeight={400}
            />
          </Paper>
        </Stack>
      </Box>
      
      {/* Package Builder Dialog */}
      {request && (
        <PackageBuilder
          open={showPackageBuilder}
          onClose={() => setShowPackageBuilder(false)}
          requestId={request.id || ''}
          associatedRecords={request.associatedRecords || []}
          requestInfo={{
            title: request.title,
            contactEmail: request.contactEmail,
            department: request.department,
            submittedAt: request.submittedAt,
          }}
          onPackageBuilt={(packageId) => {
            console.log('Package built:', packageId);
            setShowPackageBuilder(false);
          }}
        />
      )}
    </Drawer>
  );
}