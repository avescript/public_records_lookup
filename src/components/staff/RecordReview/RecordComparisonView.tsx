import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarToday as DateIcon,
  Close as CloseIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  SwapHoriz as SwapIcon,
  Sync as SyncIcon,
  Tag as TagIcon,
  TrendingUp as MetricsIcon,
  ViewList as ListIcon,
  ViewModule as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Fade,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { enhancedAIRecordService } from '../../../services/enhancedAIRecordService';
import { EnhancedMatchCandidate } from '../../../types/enhanced-search';

interface RecordComparisonData extends EnhancedMatchCandidate {
  fullContent?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  relationships?: string[];
}

interface ComparisonMetrics {
  similarityScore: number;
  commonFields: string[];
  differentFields: string[];
  contentSimilarity: number;
  metadataSimilarity: number;
}

interface RecordComparisonViewProps {
  records: EnhancedMatchCandidate[];
  onClose: () => void;
  onRecordAction?: (action: string, record: EnhancedMatchCandidate) => void;
  maxRecords?: number;
  searchQuery?: string;
}

const TabPanel: React.FC<{
  children: React.ReactNode;
  value: number;
  index: number;
}> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ height: '100%' }}>
    {value === index && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
  </div>
);

export const RecordComparisonView: React.FC<RecordComparisonViewProps> = ({
  records,
  onClose,
  onRecordAction,
  maxRecords = 5,
  searchQuery,
}) => {
  const theme = useTheme();
  const [fullscreen, setFullscreen] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState(0);
  const [recordData, setRecordData] = useState<
    Map<string, RecordComparisonData>
  >(new Map());
  const [comparisonMetrics, setComparisonMetrics] = useState<
    ComparisonMetrics[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Limit records to maximum comparison size
  const compareRecords = useMemo(
    () => records.slice(0, maxRecords),
    [records, maxRecords]
  );

  // Load detailed record data
  useEffect(() => {
    const loadRecordDetails = async () => {
      setLoading(true);
      const detailedRecords = new Map<string, RecordComparisonData>();

      try {
        await Promise.all(
          compareRecords.map(async record => {
            try {
              const preview = await enhancedAIRecordService.getRecordPreview(
                record.id,
                searchQuery
              );
              detailedRecords.set(record.id, {
                ...record,
                fullContent: preview.content,
                metadata: preview.metadata,
                tags: preview.tags,
                relationships: preview.relationships,
              });
            } catch (error) {
              console.error(
                `Failed to load details for record ${record.id}:`,
                error
              );
              detailedRecords.set(record.id, record);
            }
          })
        );

        setRecordData(detailedRecords);
        calculateComparisonMetrics(detailedRecords);
      } catch (error) {
        console.error('Failed to load record details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecordDetails();
  }, [compareRecords, searchQuery, calculateComparisonMetrics]);

  // Calculate comparison metrics
  const calculateComparisonMetrics = (
    records: Map<string, RecordComparisonData>
  ) => {
    const recordArray = Array.from(records.values());
    const metrics: ComparisonMetrics[] = [];

    for (let i = 0; i < recordArray.length; i++) {
      for (let j = i + 1; j < recordArray.length; j++) {
        const record1 = recordArray[i];
        const record2 = recordArray[j];

        const metric = compareRecordPair(record1, record2);
        metrics.push(metric);
      }
    }

    setComparisonMetrics(metrics);
  };

  const compareRecordPair = (
    record1: RecordComparisonData,
    record2: RecordComparisonData
  ): ComparisonMetrics => {
    const fields1 = new Set(Object.keys(record1.metadata || {}));
    const fields2 = new Set(Object.keys(record2.metadata || {}));

    const commonFields = Array.from(fields1).filter(field =>
      fields2.has(field)
    );
    const differentFields = [
      ...Array.from(fields1).filter(field => !fields2.has(field)),
      ...Array.from(fields2).filter(field => !fields1.has(field)),
    ];

    // Simple content similarity calculation
    const content1 = (
      record1.fullContent ||
      record1.snippet ||
      ''
    ).toLowerCase();
    const content2 = (
      record2.fullContent ||
      record2.snippet ||
      ''
    ).toLowerCase();
    const contentSimilarity = calculateTextSimilarity(content1, content2);

    // Metadata similarity
    let metadataSimilarity = 0;
    if (commonFields.length > 0) {
      const matchingValues = commonFields.filter(
        field => record1.metadata?.[field] === record2.metadata?.[field]
      );
      metadataSimilarity = matchingValues.length / commonFields.length;
    }

    const similarityScore = contentSimilarity * 0.7 + metadataSimilarity * 0.3;

    return {
      similarityScore,
      commonFields,
      differentFields,
      contentSimilarity,
      metadataSimilarity,
    };
  };

  const calculateTextSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  };

  const handleScrollSync = (
    event: React.UIEvent<HTMLDivElement>,
    recordId: string
  ) => {
    if (!syncScroll) return;

    const scrollTop = event.currentTarget.scrollTop;
    const scrollLeft = event.currentTarget.scrollLeft;

    // Sync scroll position to other record panels
    recordData.forEach((_, id) => {
      if (id !== recordId) {
        const element = document.getElementById(`record-content-${id}`);
        if (element) {
          element.scrollTop = scrollTop;
          element.scrollLeft = scrollLeft;
        }
      }
    });
  };

  const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleExportComparison = () => {
    // Implementation for exporting comparison
    console.log('Export comparison');
    handleMoreMenuClose();
  };

  const highlightDifferences = (
    text: string,
    otherTexts: string[]
  ): React.ReactNode => {
    // Simple difference highlighting - in production, use a more sophisticated diff algorithm
    const words = text.split(/\s+/);
    const otherWords = new Set(otherTexts.join(' ').split(/\s+/));

    return words.map((word, index) => {
      const isUnique = !otherWords.has(word);
      return (
        <span
          key={index}
          style={{
            backgroundColor: isUnique
              ? theme.palette.warning.light
              : 'transparent',
            color: isUnique ? theme.palette.warning.contrastText : 'inherit',
            padding: isUnique ? '0 2px' : '0',
            borderRadius: isUnique ? '2px' : '0',
          }}
        >
          {word}{' '}
        </span>
      );
    });
  };

  const renderRecordCard = (record: RecordComparisonData, index: number) => (
    <Card
      key={record.id}
      sx={{
        height: fullscreen ? 'calc(100vh - 200px)' : '600px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}>
            {index + 1}
          </Avatar>
        }
        title={
          <Typography variant='h6' noWrap>
            {record.title}
          </Typography>
        }
        subheader={
          <Stack direction='row' spacing={1} alignItems='center'>
            <Chip
              label={`${Math.round(record.confidence * 100)}% match`}
              size='small'
              color={record.confidence >= 0.8 ? 'success' : 'warning'}
            />
            <Typography variant='caption'>{record.documentType}</Typography>
          </Stack>
        }
        action={
          <IconButton
            onClick={() => onRecordAction?.('view', record)}
            size='small'
          >
            <FullscreenIcon />
          </IconButton>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ flex: 1, overflow: 'hidden', pt: 0 }}>
        <Box sx={{ height: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant='scrollable'
            scrollButtons='auto'
            sx={{ mb: 1 }}
          >
            <Tab label='Content' icon={<DocumentIcon />} />
            <Tab label='Metadata' icon={<FolderIcon />} />
            <Tab label='Metrics' icon={<MetricsIcon />} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box
              id={`record-content-${record.id}`}
              sx={{
                height: '100%',
                overflow: 'auto',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                bgcolor: 'background.default',
              }}
              onScroll={e => handleScrollSync(e, record.id)}
            >
              {loading ? (
                <Stack spacing={1}>
                  <Skeleton variant='text' width='100%' height={24} />
                  <Skeleton variant='text' width='80%' height={24} />
                  <Skeleton variant='text' width='90%' height={24} />
                </Stack>
              ) : (
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ lineHeight: 1.6 }}
                >
                  {record.fullContent
                    ? highlightDifferences(
                        record.fullContent,
                        Array.from(recordData.values())
                          .filter(r => r.id !== record.id)
                          .map(r => r.fullContent || r.snippet || '')
                      )
                    : record.snippet || 'No content available'}
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              {loading ? (
                <Stack spacing={1}>
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} variant='rectangular' height={40} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {record.metadata &&
                    Object.entries(record.metadata).map(([key, value]) => (
                      <Box key={key}>
                        <Typography variant='subtitle2' color='primary'>
                          {key}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {String(value)}
                        </Typography>
                      </Box>
                    ))}

                  {record.tags && record.tags.length > 0 && (
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color='primary'
                        sx={{ mb: 1 }}
                      >
                        Tags
                      </Typography>
                      <Stack direction='row' spacing={0.5} flexWrap='wrap'>
                        {record.tags.map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size='small'
                            variant='outlined'
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='subtitle2' color='primary'>
                    File Size
                  </Typography>
                  <Typography variant='body2'>
                    {record.fileSize
                      ? `${(record.fileSize / 1024).toFixed(1)} KB`
                      : 'Unknown'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='primary'>
                    Last Modified
                  </Typography>
                  <Typography variant='body2'>
                    {record.lastModified
                      ? new Date(record.lastModified).toLocaleString()
                      : 'Unknown'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant='subtitle2' color='primary'>
                    Confidence Score
                  </Typography>
                  <Typography variant='body2'>
                    {Math.round(record.confidence * 100)}%
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </TabPanel>
        </Box>
      </CardContent>
    </Card>
  );

  if (compareRecords.length === 0) {
    return (
      <Alert severity='info' sx={{ m: 2 }}>
        No records selected for comparison.
      </Alert>
    );
  }

  return (
    <Fade in={true}>
      <Box
        sx={{
          position: fullscreen ? 'fixed' : 'relative',
          top: fullscreen ? 0 : 'auto',
          left: fullscreen ? 0 : 'auto',
          right: fullscreen ? 0 : 'auto',
          bottom: fullscreen ? 0 : 'auto',
          zIndex: fullscreen ? 1300 : 'auto',
          bgcolor: 'background.paper',
          height: fullscreen ? '100vh' : 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: fullscreen ? 0 : 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
          >
            <Box>
              <Typography variant='h5' gutterBottom>
                Record Comparison
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Comparing {compareRecords.length} records side by side
              </Typography>
            </Box>

            <Stack direction='row' spacing={1} alignItems='center'>
              <Tooltip
                title={
                  syncScroll ? 'Disable scroll sync' : 'Enable scroll sync'
                }
              >
                <IconButton
                  onClick={() => setSyncScroll(!syncScroll)}
                  color={syncScroll ? 'primary' : 'default'}
                >
                  <SyncIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={viewMode === 'grid' ? 'List view' : 'Grid view'}>
                <IconButton
                  onClick={() =>
                    setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                  }
                >
                  {viewMode === 'grid' ? <ListIcon /> : <ViewIcon />}
                </IconButton>
              </Tooltip>

              <IconButton onClick={handleMoreMenuClick}>
                <MoreIcon />
              </IconButton>

              <Tooltip
                title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <IconButton onClick={() => setFullscreen(!fullscreen)}>
                  {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>

              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Comparison Metrics Summary */}
          {comparisonMetrics.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction='row' spacing={2}>
                <Chip
                  label={`Avg Similarity: ${Math.round(
                    (comparisonMetrics.reduce(
                      (acc, metric) => acc + metric.similarityScore,
                      0
                    ) /
                      comparisonMetrics.length) *
                      100
                  )}%`}
                  color='info'
                  variant='outlined'
                />
                <Chip
                  label={`${comparisonMetrics[0]?.commonFields.length || 0} Common Fields`}
                  color='success'
                  variant='outlined'
                />
                <Chip
                  label={`${comparisonMetrics[0]?.differentFields.length || 0} Different Fields`}
                  color='warning'
                  variant='outlined'
                />
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Comparison Grid */}
        <Box
          sx={{
            p: 2,
            height: fullscreen ? 'calc(100vh - 120px)' : '600px',
            overflow: 'auto',
          }}
        >
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {compareRecords.map((record, index) => (
              <Grid
                key={record.id}
                item
                xs={12}
                md={compareRecords.length === 2 ? 6 : 4}
                lg={compareRecords.length <= 2 ? 6 : 4}
                sx={{ height: '100%' }}
              >
                {renderRecordCard(recordData.get(record.id) || record, index)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* More Menu */}
        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={handleMoreMenuClose}
        >
          <MenuItem onClick={handleExportComparison}>
            <ListItemIcon>
              <DownloadIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Export Comparison</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMoreMenuClose}>
            <ListItemIcon>
              <PrintIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Print Comparison</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMoreMenuClose}>
            <ListItemIcon>
              <ShareIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Share Comparison</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Fade>
  );
};

export default RecordComparisonView;
