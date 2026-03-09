'use client';

import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Checkbox, Chip, IconButton, Typography } from '@/components/migration';
import { MatchCandidate } from '@/services/aiMatchingService';

interface RecordMatchingPanelProps {
  candidates: MatchCandidate[];
  selectedRecords: string[];
  onRecordToggle: (recordId: string) => void;
  onPreview: (record: MatchCandidate) => void;
}

const RecordMatchingPanel: React.FC<RecordMatchingPanelProps> = ({
  candidates,
  selectedRecords,
  onRecordToggle,
  onPreview,
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {candidates.map(candidate => {
        const isSelected = selectedRecords.includes(candidate.id);

        return (
          <Box
            key={candidate.id}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              borderRadius: 2,
              backgroundColor: isSelected
                ? 'action.selected'
                : 'background.paper',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 2,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => onRecordToggle(candidate.id)}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* Selection Checkbox */}
              <Checkbox
                checked={isSelected}
                onChange={() => onRecordToggle(candidate.id)}
                onClick={e => e.stopPropagation()}
                sx={{ mt: -0.5 }}
              />

              {/* Main Content */}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {/* Header Row */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                    gap: 2,
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {candidate.title}
                      {isSelected && (
                        <CheckCircleIcon
                          color='primary'
                          sx={{ fontSize: 20 }}
                        />
                      )}
                    </Typography>

                    {/* Metadata */}
                    <Box
                      sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}
                    >
                      <Chip
                        label={candidate.source}
                        size='small'
                        variant='outlined'
                      />
                      <Chip
                        label={candidate.agency}
                        size='small'
                        variant='outlined'
                      />
                      <Chip
                        label={candidate.recordType}
                        size='small'
                        variant='outlined'
                      />
                      <Chip
                        label={new Date(candidate.dateCreated).toLocaleDateString()}
                        size='small'
                        variant='outlined'
                      />
                    </Box>
                  </Box>

                  {/* Confidence Score & Preview */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={`${Math.round(candidate.relevanceScore * 100)}%`}
                      color={getConfidenceColor(candidate.relevanceScore)}
                      size='small'
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography
                      variant='caption'
                      color='textSecondary'
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {getConfidenceLabel(candidate.relevanceScore)}
                    </Typography>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        onPreview(candidate);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <VisibilityIcon fontSize='small' />
                    </IconButton>
                  </Box>
                </Box>

                {/* Description */}
                <Typography
                  variant='body2'
                  color='textSecondary'
                  sx={{
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {candidate.description}
                </Typography>

                {/* Key Phrases */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {candidate.keyPhrases.slice(0, 5).map((phrase, index) => (
                    <Chip
                      key={index}
                      label={phrase}
                      size='small'
                      sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  ))}
                </Box>

                {/* File Metadata */}
                {candidate.metadata && (
                  <Box
                    sx={{
                      mt: 1,
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      gap: 2,
                    }}
                  >
                    {candidate.metadata.fileSize && (
                      <Typography variant='caption' color='textSecondary'>
                        Size: {candidate.metadata.fileSize}
                      </Typography>
                    )}
                    {candidate.metadata.pageCount && (
                      <Typography variant='caption' color='textSecondary'>
                        Pages: {candidate.metadata.pageCount}
                      </Typography>
                    )}
                    {candidate.metadata.classification && (
                      <Typography variant='caption' color='textSecondary'>
                        Classification: {candidate.metadata.classification}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RecordMatchingPanel;
