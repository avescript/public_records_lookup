import React, { useState } from 'react';
import {
  Assignment,
  Download,
  ExpandLess,
  ExpandMore,
  MoreVert,
  Schedule,
  Search,
  Security,
  Share,
  Star,
  StarBorder,
  Visibility,
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { EnhancedMatchCandidate } from '../../../services/enhancedAIRecordService';

interface SearchResultCardProps {
  result: EnhancedMatchCandidate;
  onPreview?: (recordId: string) => void;
  onSelect?: (recordId: string, selected: boolean) => void;
  onStar?: (recordId: string) => void;
  selected?: boolean;
  starred?: boolean;
  showDetails?: boolean;
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'warning';
  return 'error';
};

const getAgencyIcon = (agency: string) => {
  switch (agency.toLowerCase()) {
    case 'police':
      return <Security />;
    case 'fire':
      return <Assignment />;
    default:
      return <Assignment />;
  }
};

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onPreview,
  onSelect,
  onStar,
  selected = false,
  starred = false,
  showDetails = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    if (onPreview) {
      onPreview(result.id);
    }
  };

  const handleSelectChange = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSelect) {
      onSelect(result.id, !selected);
    }
  };

  const handleStarClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onStar) {
      onStar(result.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      elevation={selected ? 3 : 1}
      sx={{
        mb: 2,
        border: selected ? 2 : 0,
        borderColor: 'primary.main',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea onClick={handleCardClick}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                mr: 2,
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
              }}
            >
              {getAgencyIcon(result.agency)}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant='h6' component='h3' noWrap>
                {result.title}
              </Typography>

              <Stack direction='row' spacing={1} sx={{ mt: 0.5, mb: 1 }}>
                <Chip
                  label={result.agency}
                  size='small'
                  color='primary'
                  variant='outlined'
                />
                <Chip
                  label={result.recordType}
                  size='small'
                  color='secondary'
                  variant='outlined'
                />
                <Chip
                  label={formatDate(result.dateCreated)}
                  size='small'
                  icon={<Schedule />}
                />
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Tooltip title='Confidence Score'>
                <Badge
                  badgeContent={`${result.confidenceScore}%`}
                  color={getConfidenceColor(result.confidenceScore) as any}
                  sx={{ mr: 1 }}
                />
              </Tooltip>

              <IconButton
                size='small'
                onClick={handleStarClick}
                color={starred ? 'warning' : 'default'}
              >
                {starred ? <Star /> : <StarBorder />}
              </IconButton>

              <IconButton size='small' onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          {/* Description */}
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {result.description}
          </Typography>

          {/* Snippets */}
          {result.snippets && result.snippets.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='caption' color='text.secondary'>
                Highlighted content:
              </Typography>
              {result.snippets.slice(0, 2).map((snippet, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    mt: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  <Typography variant='body2' component='span'>
                    {snippet.contextBefore}
                    <Box
                      component='span'
                      sx={{
                        bgcolor: 'yellow.200',
                        px: 0.5,
                        borderRadius: 0.5,
                      }}
                    >
                      {snippet.highlights.map(h => h.term).join(' ')}
                    </Box>
                    {snippet.contextAfter}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Scores */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  Relevance
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={result.relevanceScore * 100}
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {Math.round(result.relevanceScore * 100)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  Semantic
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={result.semanticScore * 100}
                  color='secondary'
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {Math.round(result.semanticScore * 100)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  Keywords
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={result.keywordScore * 100}
                  color='info'
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {Math.round(result.keywordScore * 100)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Key Phrases */}
          <Box sx={{ mb: 2 }}>
            <Stack
              direction='row'
              spacing={0.5}
              sx={{ flexWrap: 'wrap', gap: 0.5 }}
            >
              {result.keyPhrases.slice(0, 4).map((phrase, index) => (
                <Chip
                  key={index}
                  label={phrase}
                  size='small'
                  variant='outlined'
                  icon={<Search />}
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
              {result.keyPhrases.length > 4 && (
                <Chip
                  label={`+${result.keyPhrases.length - 4} more`}
                  size='small'
                  variant='outlined'
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Stack>
          </Box>

          {/* Expandable Details */}
          {showDetails && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Button
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {expanded ? 'Less Details' : 'More Details'}
                </Button>
              </Box>

              <Collapse in={expanded}>
                <Divider sx={{ mb: 2 }} />

                {/* Metadata */}
                <Typography variant='subtitle2' gutterBottom>
                  Record Metadata
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant='caption' color='text.secondary'>
                      File Size
                    </Typography>
                    <Typography variant='body2'>
                      {result.metadata?.fileSize || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant='caption' color='text.secondary'>
                      Pages
                    </Typography>
                    <Typography variant='body2'>
                      {result.metadata?.pageCount || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant='caption' color='text.secondary'>
                      Classification
                    </Typography>
                    <Typography variant='body2'>
                      {result.metadata?.classification || 'Standard'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant='caption' color='text.secondary'>
                      Last Modified
                    </Typography>
                    <Typography variant='body2'>
                      {result.metadata?.lastModified
                        ? formatDate(result.metadata.lastModified)
                        : 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* AI Summary */}
                {result.recordSummary && (
                  <>
                    <Typography variant='subtitle2' gutterBottom>
                      AI Summary
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      {result.recordSummary}
                    </Typography>
                  </>
                )}

                {/* Related Records */}
                {result.relatedRecords && result.relatedRecords.length > 0 && (
                  <>
                    <Typography variant='subtitle2' gutterBottom>
                      Related Records
                    </Typography>
                    <Stack
                      direction='row'
                      spacing={1}
                      sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                      {result.relatedRecords.map((relatedId, index) => (
                        <Chip
                          key={index}
                          label={`Record ${relatedId.slice(-3)}`}
                          size='small'
                          clickable
                          onClick={e => {
                            e.stopPropagation();
                            if (onPreview) {
                              onPreview(relatedId);
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
              </Collapse>
            </>
          )}
        </CardContent>
      </CardActionArea>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            onPreview?.(result.id);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleSelectChange({} as any);
            handleMenuClose();
          }}
        >
          <Assignment sx={{ mr: 1 }} />
          {selected ? 'Deselect' : 'Select'}
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default SearchResultCard;
