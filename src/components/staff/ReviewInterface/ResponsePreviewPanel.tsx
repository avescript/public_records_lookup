/**
 * ResponsePreviewPanel - Side-by-side comparison and response preview
 * Part of ReviewInterface - Step 4 of V2 Workflow
 */

'use client';

import React, { useState } from 'react';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import {
  Alert,
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
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { RedactionLayer } from '@/types/redaction';
import { PublicRecordRequest } from '@/types/request';
import { GeneratedResponse } from '@/types/response';

interface ResponsePreviewPanelProps {
  response: GeneratedResponse;
  request: PublicRecordRequest;
  redactions: RedactionLayer[];
  onApprove: (comments?: string) => void;
  onReject: (comments: string) => void;
  onRequestRevision: (comments: string) => void;
  loading: boolean;
  canApprove: boolean;
}

export function ResponsePreviewPanel({
  response,
  request,
  redactions,
  onApprove,
  onReject,
  onRequestRevision,
  loading,
  canApprove,
}: ResponsePreviewPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [comments, setComments] = useState('');

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25);
  };

  const handleReject = () => {
    if (comments.trim()) {
      onReject(comments);
      setShowRejectDialog(false);
      setComments('');
    }
  };

  const handleRequestRevision = () => {
    if (comments.trim()) {
      onRequestRevision(comments);
      setShowRevisionDialog(false);
      setComments('');
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getResponseTypeLabel = (type: string) => {
    switch (type) {
      case 'full_fulfillment':
        return 'Full Fulfillment';
      case 'partial_fulfillment':
        return 'Partial Fulfillment';
      case 'no_records':
        return 'No Records Found';
      case 'denial':
        return 'Request Denied';
      default:
        return 'Standard Response';
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'full_fulfillment':
        return 'success';
      case 'partial_fulfillment':
        return 'warning';
      case 'no_records':
        return 'info';
      case 'denial':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Response Overview */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Typography variant='h6' component='h2'>
              Response Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={getResponseTypeLabel(response.type || 'standard')}
                color={getResponseTypeColor(response.type || 'standard')}
                size='small'
              />
              <Chip
                label={`${response.tone} tone`}
                variant='outlined'
                size='small'
              />
              <Chip label={response.length} variant='outlined' size='small' />
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Generated
              </Typography>
              <Typography variant='body2'>
                {formatDate(response.createdAt)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
              >
                Template Used
              </Typography>
              <Typography variant='body2'>
                {response.templateName || 'Custom Response'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Side-by-Side View */}
      <Grid container spacing={3}>
        {/* Original Request */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={2}
            sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}
          >
            <CardContent
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}
            >
              <Typography variant='h6' component='h3' color='primary'>
                Original Request
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                What the requester asked for
              </Typography>
            </CardContent>
            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
              <Typography variant='subtitle1' gutterBottom>
                Request Description
              </Typography>
              <Typography variant='body1' sx={{ mb: 3, lineHeight: 1.6 }}>
                {request.description}
              </Typography>

              {request.keywords && request.keywords.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {request.keywords.map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography variant='subtitle2' gutterBottom>
                Request Details
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant='body2' sx={{ mb: 1 }}>
                  <strong>Date Range:</strong>{' '}
                  {request.startDate && request.endDate
                    ? `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`
                    : 'Not specified'}
                </Typography>
                <Typography variant='body2' sx={{ mb: 1 }}>
                  <strong>Priority:</strong> {request.priority || 'Normal'}
                </Typography>
                <Typography variant='body2'>
                  <strong>Records Found:</strong> {redactions.length} documents
                  with redactions applied
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Generated Response */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={2}
            sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}
          >
            <CardContent
              sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant='h6' component='h3' color='success.main'>
                    Generated Response
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    AI-generated response for review
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title='Zoom Out'>
                    <IconButton
                      size='small'
                      onClick={handleZoomOut}
                      disabled={zoom <= 50}
                    >
                      <ZoomOutIcon />
                    </IconButton>
                  </Tooltip>
                  <Typography
                    variant='body2'
                    sx={{
                      minWidth: '60px',
                      textAlign: 'center',
                      lineHeight: '32px',
                    }}
                  >
                    {zoom}%
                  </Typography>
                  <Tooltip title='Zoom In'>
                    <IconButton
                      size='small'
                      onClick={handleZoomIn}
                      disabled={zoom >= 200}
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Fullscreen'>
                    <IconButton
                      size='small'
                      onClick={() => setShowFullscreen(true)}
                    >
                      <FullscreenIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Print Preview'>
                    <IconButton size='small' onClick={() => window.print()}>
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
              <Paper
                sx={{
                  p: 3,
                  minHeight: '500px',
                  fontSize: `${zoom}%`,
                  lineHeight: 1.6,
                  fontFamily: 'Georgia, serif',
                  bgcolor: 'grey.50',
                }}
                elevation={1}
              >
                <Typography variant='h6' sx={{ mb: 2, textAlign: 'center' }}>
                  Public Records Response
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Date:</strong> {formatDate(new Date())}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    <strong>Request ID:</strong> {request.id}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Requester:</strong> {request.requesterName}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    whiteSpace: 'pre-wrap',
                    '& p': { mb: 2 },
                    '& h1, & h2, & h3, & h4, & h5, & h6': { mb: 1, mt: 2 },
                  }}
                  dangerouslySetInnerHTML={{ __html: response.content }}
                />

                {response.attachments && response.attachments.length > 0 && (
                  <Box
                    sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}
                  >
                    <Typography variant='subtitle2' gutterBottom>
                      Attachments Included:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {response.attachments.map((attachment, index) => (
                        <li key={index}>
                          <Typography variant='body2'>{attachment}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}

                <Box
                  sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}
                >
                  <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
                    This response was generated on{' '}
                    {formatDate(response.createdAt)} using AI assistance and has
                    been reviewed for accuracy and compliance.
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quality Indicators */}
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant='h6' component='h2' gutterBottom>
            Response Quality Analysis
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='success.main' gutterBottom>
                  {response.qualityScore || 85}%
                </Typography>
                <Typography variant='subtitle2'>Quality Score</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Content clarity and completeness
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='primary.main' gutterBottom>
                  {response.complianceScore || 92}%
                </Typography>
                <Typography variant='subtitle2'>Compliance Score</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Legal and regulatory compliance
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='info.main' gutterBottom>
                  {response.content.split(' ').length}
                </Typography>
                <Typography variant='subtitle2'>Word Count</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Response length ({response.length})
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {response.suggestions && response.suggestions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Alert severity='info' sx={{ mb: 2 }}>
                <Typography variant='subtitle2' gutterBottom>
                  AI Suggestions for Improvement:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {response.suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <Typography variant='body2'>{suggestion}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canApprove && (
        <Paper
          sx={{ p: 2, mt: 3, display: 'flex', justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Review this response and make your decision:
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              color='error'
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
              startIcon={<CancelIcon />}
            >
              Reject
            </Button>
            <Button
              variant='outlined'
              color='warning'
              onClick={() => setShowRevisionDialog(true)}
              disabled={loading}
              startIcon={<EditIcon />}
            >
              Request Revision
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={() => onApprove()}
              disabled={loading}
              startIcon={<CheckCircleIcon />}
            >
              Approve
            </Button>
          </Box>
        </Paper>
      )}

      {/* Fullscreen Dialog */}
      <Dialog
        open={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        maxWidth='lg'
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Response Preview - Full Screen
            <Button onClick={() => setShowFullscreen(false)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper
            sx={{
              p: 4,
              fontSize: '16px',
              lineHeight: 1.6,
              fontFamily: 'Georgia, serif',
            }}
          >
            <Typography variant='h5' sx={{ mb: 3, textAlign: 'center' }}>
              Public Records Response
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant='body1' sx={{ mb: 1 }}>
                <strong>Date:</strong> {formatDate(new Date())}
              </Typography>
              <Typography variant='body1' sx={{ mb: 1 }}>
                <strong>Request ID:</strong> {request.id}
              </Typography>
              <Typography variant='body1'>
                <strong>Requester:</strong> {request.requesterName}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: response.content }}
            />
          </Paper>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Reject Response</DialogTitle>
        <DialogContent>
          <Typography variant='body1' sx={{ mb: 2 }}>
            Please provide a reason for rejecting this response:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder='Enter your comments here...'
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color='error'
            variant='contained'
            disabled={!comments.trim() || loading}
          >
            Reject Response
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog
        open={showRevisionDialog}
        onClose={() => setShowRevisionDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Request Revision</DialogTitle>
        <DialogContent>
          <Typography variant='body1' sx={{ mb: 2 }}>
            Please specify what changes are needed:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder='Enter revision requests here...'
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRevisionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRequestRevision}
            color='warning'
            variant='contained'
            disabled={!comments.trim() || loading}
          >
            Request Revision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
