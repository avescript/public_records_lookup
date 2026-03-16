'use client';

import React, { useState } from 'react';
import {
  AttachFile as AttachFileIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  GetApp as ExportIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Preview as PreviewIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';

import { StoredRequest } from '@/services/requestService';

export interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'processing' | 'ready' | 'error';
  previewUrl?: string;
  downloadUrl?: string;
  metadata?: {
    pages?: number;
    dimensions?: { width: number; height: number };
    duration?: number;
    description?: string;
  };
}

export interface AttachmentManagerProps {
  request: StoredRequest;
  attachments?: AttachmentFile[];
  onAttachmentPreview?: (attachment: AttachmentFile) => void;
  onAttachmentDownload?: (attachment: AttachmentFile) => void;
  onAttachmentDelete?: (attachment: AttachmentFile) => void;
  onAttachmentUpload?: (files: FileList) => void;
  allowUploads?: boolean;
  allowDeletes?: boolean;
}

// Mock attachment data
const generateMockAttachments = (request: StoredRequest): AttachmentFile[] => {
  if (request.attachmentCount === 0) return [];

  const attachments: AttachmentFile[] = [];
  const baseTime = request.submittedAt.toDate();

  // Add some mock attachments based on department
  if (request.department === 'Police') {
    attachments.push({
      id: 'att-1',
      name: 'incident_location_photos.pdf',
      type: 'application/pdf',
      size: 2400000,
      uploadedAt: baseTime,
      uploadedBy: request.contactEmail,
      status: 'ready',
      metadata: { pages: 3, description: 'Photos of incident location' },
    });
  } else if (request.department === 'Transportation') {
    attachments.push({
      id: 'att-1',
      name: 'traffic_camera_footage.mp4',
      type: 'video/mp4',
      size: 15600000,
      uploadedAt: baseTime,
      uploadedBy: request.contactEmail,
      status: 'processing',
      metadata: {
        duration: 120,
        description: 'Traffic camera footage from intersection',
      },
    });
  }

  // Add a document attachment for most requests
  if (Math.random() > 0.3) {
    attachments.push({
      id: 'att-2',
      name: 'request_details.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 850000,
      uploadedAt: new Date(baseTime.getTime() + 5 * 60 * 1000),
      uploadedBy: request.contactEmail,
      status: 'ready',
      metadata: {
        pages: 2,
        description: 'Additional request details and context',
      },
    });
  }

  return attachments;
};

function getFileIcon(type: string) {
  if (type.startsWith('image/')) {
    return <ImageIcon />;
  } else if (type === 'application/pdf') {
    return <PdfIcon />;
  } else if (type.startsWith('video/')) {
    return <VideoIcon />;
  } else {
    return <FileIcon />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(
  status: AttachmentFile['status']
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' {
  switch (status) {
    case 'processing':
      return 'warning';
    case 'ready':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

export function AttachmentManager({
  request,
  attachments,
  onAttachmentPreview,
  onAttachmentDownload,
  onAttachmentDelete,
  onAttachmentUpload,
  allowUploads = false,
  allowDeletes = false,
}: AttachmentManagerProps) {
  const [previewDialog, setPreviewDialog] = useState<AttachmentFile | null>(
    null
  );
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentFile | null>(null);

  const fileAttachments = attachments || generateMockAttachments(request);

  const handlePreview = (attachment: AttachmentFile) => {
    if (onAttachmentPreview) {
      onAttachmentPreview(attachment);
    } else {
      setPreviewDialog(attachment);
    }
  };

  const handleDownload = (attachment: AttachmentFile) => {
    if (onAttachmentDownload) {
      onAttachmentDownload(attachment);
    } else {
      // Mock download
      console.log('Downloading:', attachment.name);
    }
    setActionMenuAnchor(null);
  };

  const handleDelete = (attachment: AttachmentFile) => {
    if (onAttachmentDelete) {
      onAttachmentDelete(attachment);
    } else {
      // Mock delete
      console.log('Deleting:', attachment.name);
    }
    setActionMenuAnchor(null);
  };

  const handleActionMenu = (
    event: React.MouseEvent<HTMLElement>,
    attachment: AttachmentFile
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedAttachment(attachment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedAttachment(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onAttachmentUpload) {
      onAttachmentUpload(files);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography
            variant='h6'
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <AttachFileIcon sx={{ mr: 1 }} />
            Attachments ({fileAttachments.length})
          </Typography>

          {allowUploads && (
            <Box>
              <input
                accept='*/*'
                style={{ display: 'none' }}
                id='file-upload'
                type='file'
                multiple
                onChange={handleFileUpload}
              />
              <label htmlFor='file-upload'>
                <Button variant='outlined' component='span' size='small'>
                  Add Files
                </Button>
              </label>
            </Box>
          )}
        </Box>

        {fileAttachments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
            <AttachFileIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant='body2' color='text.secondary'>
              No attachments uploaded
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {fileAttachments.map(attachment => (
              <Grid item xs={12} key={attachment.id}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    border: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
                  >
                    <Box sx={{ mr: 2, color: 'text.secondary' }}>
                      {getFileIcon(attachment.type)}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                        {attachment.name}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          {formatFileSize(attachment.size)}
                        </Typography>

                        <Chip
                          label={attachment.status}
                          size='small'
                          color={getStatusColor(attachment.status)}
                          variant='outlined'
                        />

                        <Typography variant='caption' color='text.secondary'>
                          • Uploaded{' '}
                          {attachment.uploadedAt.toLocaleDateString()}
                        </Typography>

                        {attachment.metadata?.pages && (
                          <Typography variant='caption' color='text.secondary'>
                            • {attachment.metadata.pages} pages
                          </Typography>
                        )}

                        {attachment.metadata?.duration && (
                          <Typography variant='caption' color='text.secondary'>
                            • {Math.floor(attachment.metadata.duration / 60)}:
                            {(attachment.metadata.duration % 60)
                              .toString()
                              .padStart(2, '0')}
                          </Typography>
                        )}
                      </Box>

                      {attachment.metadata?.description && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {attachment.metadata.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {attachment.status === 'ready' && (
                      <IconButton
                        size='small'
                        onClick={() => handlePreview(attachment)}
                        title='Preview'
                      >
                        <PreviewIcon />
                      </IconButton>
                    )}

                    <IconButton
                      size='small'
                      onClick={e => handleActionMenu(e, attachment)}
                      title='More actions'
                    >
                      <ExportIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem
          onClick={() =>
            selectedAttachment && handleDownload(selectedAttachment)
          }
        >
          <DownloadIcon sx={{ mr: 1 }} />
          Download
        </MenuItem>

        {allowDeletes && (
          <MenuItem
            onClick={() =>
              selectedAttachment && handleDelete(selectedAttachment)
            }
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Preview Dialog */}
      <Dialog
        open={Boolean(previewDialog)}
        onClose={() => setPreviewDialog(null)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Preview: {previewDialog?.name}</DialogTitle>
        <DialogContent>
          {previewDialog && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              {getFileIcon(previewDialog.type)}
              <Typography variant='body2' sx={{ mt: 2 }}>
                Preview not available for this file type.
                <br />
                Use the download button to view the file.
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 1 }}
              >
                File: {previewDialog.name} ({formatFileSize(previewDialog.size)}
                )
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(null)}>Close</Button>
          {previewDialog && (
            <Button
              onClick={() => handleDownload(previewDialog)}
              variant='contained'
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
}
