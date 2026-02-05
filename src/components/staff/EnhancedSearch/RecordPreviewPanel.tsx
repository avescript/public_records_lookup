import React, { useCallback, useEffect, useState } from 'react';
import {
  Close,
  Description,
  Download,
  Fullscreen,
  History,
  Info,
  Link as LinkIcon,
  Print,
  Search,
  Security,
  Share,
  Visibility,
  ZoomIn,
  ZoomOut,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';

import { EnhancedMatchCandidate } from '../../../services/enhancedAIRecordService';
import enhancedAIRecordService from '../../../services/enhancedAIRecordService';

interface RecordPreviewPanelProps {
  recordId: string | null;
  onClose: () => void;
  open: boolean;
  searchQuery?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`record-tabpanel-${index}`}
      aria-labelledby={`record-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const RecordPreviewPanel: React.FC<RecordPreviewPanelProps> = ({
  recordId,
  onClose,
  open,
  searchQuery,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [recordData, setRecordData] = useState<{
    id: string;
    title: string;
    content: string;
    highlights: Array<{ start: number; end: number; term: string }>;
    metadata: any;
    summary?: string;
  } | null>(null);

  const loadRecordPreview = useCallback(async () => {
    if (!recordId) return;

    setLoading(true);
    setError(null);

    try {
      const preview = await enhancedAIRecordService.getRecordPreview(
        recordId,
        searchQuery
      );
      setRecordData(preview);
    } catch (err) {
      console.error('Failed to load record preview:', err);
      setError('Failed to load record preview. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [recordId, searchQuery]);

  useEffect(() => {
    if (recordId && open) {
      loadRecordPreview();
    }
  }, [recordId, open, loadRecordPreview]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDownload = () => {
    // In production, trigger actual download
    console.log('Downloading record:', recordId);
  };

  const handleShare = () => {
    // In production, open share dialog
    console.log('Sharing record:', recordId);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderHighlightedContent = (
    content: string,
    highlights: Array<{ start: number; end: number; term: string }>
  ) => {
    if (!highlights || highlights.length === 0) {
      return content;
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(content.substring(lastIndex, highlight.start));
      }

      // Add highlighted text
      parts.push(
        <Box
          key={index}
          component='span'
          sx={{
            backgroundColor: 'yellow.300',
            padding: '2px 4px',
            borderRadius: 1,
            fontWeight: 'bold',
            color: 'text.primary',
          }}
        >
          {content.substring(highlight.start, highlight.end)}
        </Box>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <Box component='div' sx={{ lineHeight: 1.8 }}>
        {parts}
      </Box>
    );
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return [];

    const items = [];
    if (metadata.fileSize)
      items.push({ label: 'File Size', value: metadata.fileSize });
    if (metadata.pageCount)
      items.push({ label: 'Pages', value: metadata.pageCount });
    if (metadata.lastModified)
      items.push({
        label: 'Last Modified',
        value: new Date(metadata.lastModified).toLocaleDateString(),
      });
    if (metadata.classification)
      items.push({ label: 'Classification', value: metadata.classification });
    if (metadata.creator)
      items.push({ label: 'Created By', value: metadata.creator });
    if (metadata.department)
      items.push({ label: 'Department', value: metadata.department });

    return items;
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={fullscreen ? false : 'lg'}
        fullWidth
        fullScreen={fullscreen}
        PaperProps={{
          sx: {
            height: fullscreen ? '100vh' : '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                flex: 1,
              }}
            >
              <Description sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant='h6' noWrap sx={{ flex: 1 }}>
                {loading
                  ? 'Loading...'
                  : recordData?.title || `Record ${recordId}`}
              </Typography>
            </Box>

            <Stack direction='row' spacing={1} sx={{ ml: 2 }}>
              <Tooltip title={`Zoom ${zoom}%`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size='small'
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut />
                  </IconButton>
                  <Typography
                    variant='body2'
                    sx={{ minWidth: '40px', textAlign: 'center' }}
                  >
                    {zoom}%
                  </Typography>
                  <IconButton
                    size='small'
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn />
                  </IconButton>
                </Box>
              </Tooltip>
              <IconButton onClick={() => setFullscreen(!fullscreen)}>
                <Fullscreen />
              </IconButton>
              <IconButton onClick={handleDownload}>
                <Download />
              </IconButton>
              <IconButton onClick={handleShare}>
                <Share />
              </IconButton>
              <IconButton onClick={handlePrint}>
                <Print />
              </IconButton>
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {error && (
            <Alert severity='error' sx={{ m: 3 }}>
              {error}
              <Button onClick={loadRecordPreview} sx={{ ml: 2 }}>
                Retry
              </Button>
            </Alert>
          )}

          {!error && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label='record preview tabs'
              >
                <Tab label='Content' icon={<Visibility />} />
                <Tab label='Details' icon={<Info />} />
                <Tab label='Summary' icon={<Description />} />
                <Tab label='History' icon={<History />} />
              </Tabs>
            </Box>
          )}

          {/* Content Tab */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant='rectangular' height={60} />
                <Skeleton variant='text' height={40} />
                <Skeleton variant='text' height={40} />
                <Skeleton variant='rectangular' height={200} />
              </Stack>
            ) : recordData ? (
              <Box sx={{ fontSize: `${zoom}%` }}>
                {searchQuery && recordData.highlights.length > 0 && (
                  <Alert severity='info' sx={{ mb: 3 }} icon={<Search />}>
                    Found {recordData.highlights.length} matches for &quot;
                    {searchQuery}&quot;
                  </Alert>
                )}

                <Paper
                  variant='outlined'
                  sx={{
                    p: 3,
                    bgcolor: 'background.paper',
                    minHeight: 400,
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                  }}
                >
                  {renderHighlightedContent(
                    recordData.content,
                    recordData.highlights
                  )}
                </Paper>
              </Box>
            ) : null}
          </TabPanel>

          {/* Details Tab */}
          <TabPanel value={activeTab} index={1}>
            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant='rectangular' height={120} />
                <Skeleton variant='rectangular' height={200} />
              </Stack>
            ) : recordData ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant='h6' gutterBottom>
                    Basic Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary='Record ID'
                        secondary={recordData.id}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Info />
                      </ListItemIcon>
                      <ListItemText
                        primary='Title'
                        secondary={recordData.title}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant='h6' gutterBottom>
                    Metadata
                  </Typography>
                  <List dense>
                    {formatMetadata(recordData.metadata).map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Info />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.value}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                {searchQuery && recordData.highlights.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant='h6' gutterBottom>
                      Search Matches
                    </Typography>
                    <Stack
                      direction='row'
                      spacing={1}
                      sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                      {recordData.highlights.map((highlight, index) => (
                        <Chip
                          key={index}
                          label={highlight.term}
                          size='small'
                          variant='outlined'
                          icon={<Search />}
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            ) : null}
          </TabPanel>

          {/* Summary Tab */}
          <TabPanel value={activeTab} index={2}>
            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant='rectangular' height={100} />
                <Skeleton variant='text' height={40} />
                <Skeleton variant='text' height={40} />
              </Stack>
            ) : recordData?.summary ? (
              <Box>
                <Alert severity='info' sx={{ mb: 3 }}>
                  This summary was generated by AI and should be verified
                  against the original document.
                </Alert>
                <Typography variant='body1' sx={{ lineHeight: 1.8 }}>
                  {recordData.summary}
                </Typography>
              </Box>
            ) : (
              <Alert severity='info'>
                No AI summary is available for this record.
              </Alert>
            )}
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={activeTab} index={3}>
            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant='rectangular' height={80} />
                <Skeleton variant='rectangular' height={80} />
                <Skeleton variant='rectangular' height={80} />
              </Stack>
            ) : (
              <List>
                <ListItem>
                  <ListItemIcon>
                    <History />
                  </ListItemIcon>
                  <ListItemText
                    primary='Record Created'
                    secondary='System generated this record'
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Visibility />
                  </ListItemIcon>
                  <ListItemText
                    primary='Previewed'
                    secondary={`Opened by you at ${new Date().toLocaleString()}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Search />
                  </ListItemIcon>
                  <ListItemText
                    primary='Search Match'
                    secondary={`Found via search: "${searchQuery}"`}
                  />
                </ListItem>
              </List>
            )}
          </TabPanel>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecordPreviewPanel;
