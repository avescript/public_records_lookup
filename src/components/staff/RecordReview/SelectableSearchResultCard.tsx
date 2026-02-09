import React from 'react';
import {
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  GetApp as DownloadIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Share as ShareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  VideoFile as VideoIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  ButtonBase,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Fade,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { EnhancedMatchCandidate } from '../../../types/enhanced-search';
import { useRecordSelection } from '../../contexts/RecordSelectionContext';

interface SelectableSearchResultCardProps {
  record: EnhancedMatchCandidate;
  searchQuery?: string;
  onPreview?: (record: EnhancedMatchCandidate) => void;
  onDownload?: (record: EnhancedMatchCandidate) => void;
  onShare?: (record: EnhancedMatchCandidate) => void;
  onToggleFavorite?: (record: EnhancedMatchCandidate) => void;
  onAction?: (action: string, record: EnhancedMatchCandidate) => void; // Add missing property
  showSelection?: boolean;
  isFavorite?: boolean;
  elevation?: number;
  compact?: boolean;
  position?: number; // Add missing property
}

const getFileTypeIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes('image')) return <ImageIcon />;
  if (type.includes('video')) return <VideoIcon />;
  if (type.includes('audio')) return <AudioIcon />;
  if (type.includes('pdf') || type.includes('document'))
    return <DocumentIcon />;
  return <FileIcon />;
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'warning';
  return 'error';
};

export const SelectableSearchResultCard: React.FC<
  SelectableSearchResultCardProps
> = ({
  record,
  searchQuery,
  onPreview,
  onDownload,
  onShare,
  onToggleFavorite,
  showSelection = true,
  isFavorite = false,
  elevation = 1,
  compact = false,
}) => {
  const theme = useTheme();
  const { isSelected, toggleRecord, selectionMode } = useRecordSelection();

  const selected = isSelected(record.id);
  const canSelect = selectionMode !== 'none' && showSelection;

  const handleCardClick = (event: React.MouseEvent) => {
    // Prevent selection toggle when clicking on action buttons
    if ((event.target as Element).closest('.card-action')) {
      return;
    }

    if (canSelect) {
      toggleRecord(record);
    } else if (onPreview) {
      onPreview(record);
    }
  };

  const handleSelectionToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (canSelect) {
      toggleRecord(record);
    }
  };

  const handlePreview = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onPreview) {
      onPreview(record);
    }
  };

  const handleDownload = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDownload) {
      onDownload(record);
    }
  };

  const handleShare = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onShare) {
      onShare(record);
    }
  };

  const handleToggleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(record);
    }
  };

  const highlightText = (text: string, query?: string) => {
    if (!query) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <Box
          key={index}
          component='span'
          sx={{
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.warning.contrastText,
            px: 0.5,
            borderRadius: 0.5,
          }}
        >
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  return (
    <Fade in={true} timeout={300}>
      <Card
        elevation={selected ? 4 : elevation}
        sx={{
          position: 'relative',
          cursor: canSelect || onPreview ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
          border: selected
            ? `2px solid ${theme.palette.primary.main}`
            : '1px solid transparent',
          '&:hover': {
            elevation: selected ? 4 : 3,
            transform: 'scale(1.01)',
          },
        }}
      >
        <ButtonBase
          onClick={handleCardClick}
          sx={{
            width: '100%',
            textAlign: 'left',
            display: 'block',
          }}
          disabled={!canSelect && !onPreview}
        >
          <CardContent sx={{ pb: compact ? 1 : 2 }}>
            <Stack direction='row' alignItems='flex-start' spacing={2}>
              {/* Selection Checkbox */}
              {canSelect && (
                <Box className='card-action'>
                  <Checkbox
                    checked={selected}
                    onChange={handleSelectionToggle}
                    size={compact ? 'small' : 'medium'}
                    sx={{
                      mt: -1,
                      ml: -1,
                    }}
                  />
                </Box>
              )}

              {/* File Type Icon */}
              <Avatar
                sx={{
                  backgroundColor: theme.palette.grey[100],
                  color: theme.palette.text.secondary,
                  width: compact ? 32 : 40,
                  height: compact ? 32 : 40,
                }}
              >
                {getFileTypeIcon(record.documentType)}
              </Avatar>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Title */}
                <Typography
                  variant={compact ? 'body1' : 'h6'}
                  noWrap
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {highlightText(record.title, searchQuery)}
                </Typography>

                {/* Metadata */}
                <Stack
                  direction='row'
                  spacing={1}
                  alignItems='center'
                  sx={{ mb: compact ? 0.5 : 1 }}
                >
                  <Chip
                    label={`${Math.round(record.confidence * 100)}% match`}
                    size='small'
                    color={getConfidenceColor(record.confidence) as any}
                    variant='outlined'
                  />

                  <Typography variant='caption' color='text.secondary'>
                    {record.documentType}
                  </Typography>

                  {record.lastModified && (
                    <Typography variant='caption' color='text.secondary'>
                      Modified{' '}
                      {new Date(record.lastModified).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>

                {/* Snippet */}
                {record.snippet && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: compact ? 2 : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                    }}
                  >
                    {highlightText(record.snippet, searchQuery)}
                  </Typography>
                )}

                {/* Additional metadata */}
                {(record.fileSize || record.tags) && (
                  <Box sx={{ mt: 1 }}>
                    {record.fileSize && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ mr: 2 }}
                      >
                        Size: {(record.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                    )}

                    {record.tags && record.tags.length > 0 && (
                      <Stack direction='row' spacing={0.5} sx={{ mt: 0.5 }}>
                        {record.tags.slice(0, 3).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size='small'
                            variant='outlined'
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                        {record.tags.length > 3 && (
                          <Typography variant='caption' color='text.secondary'>
                            +{record.tags.length - 3} more
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Stack direction='row' spacing={0.5} className='card-action'>
                {onToggleFavorite && (
                  <Tooltip
                    title={
                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                  >
                    <IconButton
                      size='small'
                      onClick={handleToggleFavorite}
                      color={isFavorite ? 'warning' : 'default'}
                    >
                      {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Tooltip>
                )}

                {onPreview && (
                  <Tooltip title='Preview record'>
                    <IconButton size='small' onClick={handlePreview}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {onDownload && (
                  <Tooltip title='Download record'>
                    <IconButton size='small' onClick={handleDownload}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {onShare && (
                  <Tooltip title='Share record'>
                    <IconButton size='small' onClick={handleShare}>
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </ButtonBase>

        {/* Selection Indicator */}
        {selected && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            ✓
          </Box>
        )}
      </Card>
    </Fade>
  );
};

export default SelectableSearchResultCard;
