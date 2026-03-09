'use client';

import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@/components/migration';
import { MatchCandidate } from '@/services/aiMatchingService';

interface RecordPreviewProps {
  record: MatchCandidate;
  open: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelection: () => void;
}

const RecordPreview: React.FC<RecordPreviewProps> = ({
  record,
  open,
  onClose,
  isSelected,
  onToggleSelection,
}) => {
  const getConfidenceColor = (
    score: number
  ): 'success' | 'warning' | 'error' => {
    if (score >= 0.85) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (score: number): string => {
    if (score >= 0.85) return 'High Confidence';
    if (score >= 0.7) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flexGrow: 1, pr: 2 }}>
            <Typography variant='h6' component='div' sx={{ mb: 1 }}>
              {record.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={record.source} size='small' variant='outlined' />
              <Chip label={record.agency} size='small' variant='outlined' />
              <Chip label={record.recordType} size='small' variant='outlined' />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${Math.round(record.relevanceScore * 100)}% Match`}
              color={getConfidenceColor(record.relevanceScore)}
              sx={{ fontWeight: 600 }}
            />
            <IconButton onClick={onClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Confidence Badge */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              AI Confidence Assessment
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={getConfidenceLabel(record.relevanceScore)}
                color={getConfidenceColor(record.relevanceScore)}
                icon={<CheckCircleIcon />}
              />
              <Typography variant='body2' color='textSecondary'>
                Relevance Score: {(record.relevanceScore * 100).toFixed(1)}% •
                Distance: {record.distanceScore.toFixed(3)}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Description */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              Description
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              {record.description}
            </Typography>
          </Box>

          <Divider />

          {/* Key Matching Phrases */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              Key Matching Phrases
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {record.keyPhrases.map((phrase, index) => (
                <Chip
                  key={index}
                  label={phrase}
                  size='small'
                  sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Record Metadata */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              Record Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 1.5,
                mt: 1,
              }}
            >
              <Typography variant='body2' fontWeight={600}>
                Record ID:
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {record.id}
              </Typography>

              <Typography variant='body2' fontWeight={600}>
                Record Type:
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {record.recordType}
              </Typography>

              <Typography variant='body2' fontWeight={600}>
                Source:
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {record.source}
              </Typography>

              <Typography variant='body2' fontWeight={600}>
                Agency:
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {record.agency}
              </Typography>

              <Typography variant='body2' fontWeight={600}>
                Date Created:
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {new Date(record.dateCreated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>

              {record.metadata.fileSize && (
                <>
                  <Typography variant='body2' fontWeight={600}>
                    File Size:
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {record.metadata.fileSize}
                  </Typography>
                </>
              )}

              {record.metadata.pageCount && (
                <>
                  <Typography variant='body2' fontWeight={600}>
                    Page Count:
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {record.metadata.pageCount} pages
                  </Typography>
                </>
              )}

              {record.metadata.classification && (
                <>
                  <Typography variant='body2' fontWeight={600}>
                    Classification:
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {record.metadata.classification}
                  </Typography>
                </>
              )}

              {record.metadata.lastModified && (
                <>
                  <Typography variant='body2' fontWeight={600}>
                    Last Modified:
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    {new Date(record.metadata.lastModified).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='secondary' variant='outlined'>
          Close
        </Button>
        <Button
          onClick={() => {
            onToggleSelection();
            onClose();
          }}
          color='primary'
          variant='contained'
          startIcon={isSelected ? undefined : <CheckCircleIcon />}
        >
          {isSelected ? 'Remove from Selection' : 'Add to Selection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordPreview;
