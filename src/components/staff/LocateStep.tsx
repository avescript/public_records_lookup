'use client';

import React, { useMemo, useState } from 'react';
import {
  AutoAwesome as AIIcon,
  Bolt as LightningIcon,
  Checklist as ChecklistIcon,
  CompareArrows as CompareIcon,
  Description as DocumentIcon,
  FilterList as FilterIcon,
  Folder as FolderIcon,
  Preview as PreviewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/core/Button';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@/components/migration';
import { WorkflowStep } from '@/components/staff/WorkflowNavigation';
import { WorkflowPage } from '@/components/staff/WorkflowPage';

export interface LocateStepProps {
  requestId: string;
  completedSteps: WorkflowStep[];
}

interface PublicRecord {
  id: string;
  title: string;
  type: 'document' | 'email' | 'report' | 'correspondence';
  department: string;
  dateCreated: string;
  content: string;
  description: string;
  baseRelevanceScore: number;
  tags: string[];
  selected?: boolean;
  batchProcessed?: boolean;
}

interface RankedRecord extends PublicRecord {
  relevanceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchedTerms: string[];
  previewSnippet: string;
}

const mockRecords: PublicRecord[] = [
  {
    id: 'PR-2024-001',
    title: 'Traffic Safety Report - Downtown District',
    type: 'report',
    department: 'Transportation',
    dateCreated: '2024-01-15',
    content:
      'Contains incident summaries, officer narratives, and follow-up actions for downtown traffic collisions and enforcement outcomes.',
    description:
      'Comprehensive analysis of traffic patterns and safety incidents in the downtown district during Q4 2023.',
    baseRelevanceScore: 95,
    tags: ['traffic', 'safety', 'downtown'],
  },
  {
    id: 'PR-2024-002',
    title: 'Email: Downtown Traffic Concerns',
    type: 'email',
    department: 'Transportation',
    dateCreated: '2024-01-12',
    content:
      'Includes requests for camera footage references, follow-up correspondence, and departmental response deadlines.',
    description:
      'Email correspondence between city council and transportation department regarding traffic concerns.',
    baseRelevanceScore: 88,
    tags: ['email', 'traffic', 'council'],
  },
  {
    id: 'PR-2024-003',
    title: 'Public Safety Incident Log - Sector 4',
    type: 'document',
    department: 'Police',
    dateCreated: '2024-01-09',
    content:
      'Incident-level entries with timestamps, responding units, witness statements, and references to body camera retention IDs.',
    description:
      'Structured incident log with officer notes and reference IDs for evidence files.',
    baseRelevanceScore: 79,
    tags: ['incident', 'police', 'body camera'],
  },
  {
    id: 'PR-2024-004',
    title: 'Records Retention Policy - Audio and Video Evidence',
    type: 'correspondence',
    department: 'City Clerk',
    dateCreated: '2023-12-21',
    content:
      'Policy guidance for release windows, exemption handling, and legal review requirements for digital recordings.',
    description:
      'Records policy memo for handling retention and disclosure of media evidence.',
    baseRelevanceScore: 71,
    tags: ['policy', 'retention', 'evidence'],
  },
];

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\W+/)
    .filter(term => term.length > 2);
}

function calculateRanking(
  record: PublicRecord,
  searchTerm: string
): Omit<RankedRecord, keyof PublicRecord> {
  const terms = tokenizeQuery(searchTerm);

  if (terms.length === 0) {
    const fallbackConfidence =
      record.baseRelevanceScore >= 85
        ? 'high'
        : record.baseRelevanceScore >= 65
          ? 'medium'
          : 'low';

    return {
      relevanceScore: record.baseRelevanceScore,
      confidenceLevel: fallbackConfidence,
      matchedTerms: [],
      previewSnippet: record.description,
    };
  }

  const title = record.title.toLowerCase();
  const description = record.description.toLowerCase();
  const content = record.content.toLowerCase();
  const tagText = record.tags.join(' ').toLowerCase();

  let weightedHits = 0;
  const matchedTerms: string[] = [];

  terms.forEach(term => {
    let termMatched = false;

    if (title.includes(term)) {
      weightedHits += 4;
      termMatched = true;
    }
    if (tagText.includes(term)) {
      weightedHits += 3;
      termMatched = true;
    }
    if (description.includes(term)) {
      weightedHits += 2;
      termMatched = true;
    }
    if (content.includes(term)) {
      weightedHits += 2;
      termMatched = true;
    }

    if (termMatched) matchedTerms.push(term);
  });

  const phraseBonus =
    searchTerm.trim().length > 3 &&
    `${title} ${description} ${content}`.includes(searchTerm.toLowerCase())
      ? 8
      : 0;

  const semanticBoost = Math.min(20, matchedTerms.length * 5);
  const normalized = Math.min(
    99,
    Math.round(
      record.baseRelevanceScore * 0.45 +
        weightedHits * 4.5 +
        phraseBonus +
        semanticBoost
    )
  );

  const confidenceLevel =
    normalized >= 85 ? 'high' : normalized >= 65 ? 'medium' : 'low';

  const textForSnippet = `${record.description} ${record.content}`;
  const firstTerm = matchedTerms[0] || terms[0];
  const idx = textForSnippet.toLowerCase().indexOf(firstTerm.toLowerCase());

  const snippet =
    idx >= 0
      ? textForSnippet.slice(Math.max(0, idx - 35), idx + 120)
      : record.description;

  return {
    relevanceScore: normalized,
    confidenceLevel,
    matchedTerms,
    previewSnippet: snippet.trim(),
  };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedText(text: string, terms: string[]) {
  if (terms.length === 0) return text;

  const regex = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'ig');
  return text.split(regex).map((part, idx) => {
    const isMatch = terms.some(t => t.toLowerCase() === part.toLowerCase());

    if (!isMatch) {
      return <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>;
    }

    return (
      <Box
        key={`${part}-${idx}`}
        component='mark'
        sx={{
          backgroundColor: 'warning.light',
          px: 0.25,
          borderRadius: 0.5,
        }}
      >
        {part}
      </Box>
    );
  });
}

function getRecordIcon(type: PublicRecord['type']) {
  switch (type) {
    case 'document':
    case 'report':
      return <DocumentIcon />;
    case 'email':
    case 'correspondence':
      return <FolderIcon />;
    default:
      return <DocumentIcon />;
  }
}

function getRelevanceColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

export function LocateStep({ requestId, completedSteps }: LocateStepProps) {
  const router = useRouter();
  const [records, setRecords] = useState<PublicRecord[]>(
    mockRecords.map(r => ({ ...r, selected: false }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [activePreviewRecordId, setActivePreviewRecordId] = useState<
    string | null
  >(mockRecords[0]?.id ?? null);

  const rankedRecords = useMemo<RankedRecord[]>(() => {
    return records
      .map(record => {
        const ranking = calculateRanking(record, searchTerm);
        return { ...record, ...ranking };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [records, searchTerm]);

  const selectedRecords = rankedRecords.filter(r => r.selected);
  const comparisonRecords = selectedRecords.slice(0, 2);
  const canCompareSelected = comparisonRecords.length === 2;
  const highConfidenceCount = rankedRecords.filter(
    r => r.confidenceLevel === 'high'
  ).length;
  const isStepComplete = selectedRecords.length > 0;
  const activePreviewRecord =
    rankedRecords.find(r => r.id === activePreviewRecordId) ||
    rankedRecords[0] ||
    null;

  const handleRecordToggle = (recordId: string) => {
    setRecords(prev =>
      prev.map(record =>
        record.id === recordId
          ? { ...record, selected: !record.selected }
          : record
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = records.every(r => r.selected);
    setRecords(prev =>
      prev.map(record => ({ ...record, selected: !allSelected }))
    );
  };

  const handleProceedToRedact = () => {
    const recordIds = selectedRecords.map(r => r.id).join(',');
    router.push(
      `/admin/request/${requestId}/workflow/redact?records=${encodeURIComponent(recordIds)}`
    );
  };

  const handleSelectTopResults = (count: number) => {
    const topIds = new Set(rankedRecords.slice(0, count).map(r => r.id));
    setRecords(prev =>
      prev.map(record => ({ ...record, selected: topIds.has(record.id) }))
    );
  };

  const handleSelectHighConfidence = () => {
    const highConfidenceIds = new Set(
      rankedRecords
        .filter(record => record.confidenceLevel === 'high')
        .map(record => record.id)
    );

    setRecords(prev =>
      prev.map(record => ({
        ...record,
        selected: highConfidenceIds.has(record.id),
      }))
    );
  };

  const handleClearSelection = () => {
    setRecords(prev => prev.map(record => ({ ...record, selected: false })));
  };

  const handleBatchProcessSelected = async () => {
    if (selectedRecords.length === 0) return;

    setIsBatchProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 900));

    const selectedIds = new Set(selectedRecords.map(record => record.id));
    setRecords(prev =>
      prev.map(record =>
        selectedIds.has(record.id)
          ? { ...record, batchProcessed: true }
          : record
      )
    );

    setIsBatchProcessing(false);
  };

  const confidenceColorMap = {
    high: 'success',
    medium: 'warning',
    low: 'error',
  } as const;

  return (
    <WorkflowPage
      requestId={requestId}
      currentStep='locate'
      completedSteps={completedSteps}
      title='Locate Relevant Records'
      subtitle='Search and select public records that are relevant to this request. Use the search and filters to find specific documents, emails, or reports.'
    >
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Records Scanned
              </Typography>
              <Typography variant='h6'>{rankedRecords.length}</Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                High Confidence Matches
              </Typography>
              <Typography variant='h6'>{highConfidenceCount}</Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Selected for Batch Actions
              </Typography>
              <Typography variant='h6'>{selectedRecords.length}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              flex: 1,
              maxWidth: { xs: '100%', sm: '400px' },
            }}
          >
            <SearchIcon
              sx={{
                position: 'absolute',
                left: 1.5,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'text.secondary',
              }}
            />
            <input
              type='text'
              placeholder='Semantic search by title, content, tags, or phrases...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
          </Box>
          <Button
            variant='outline'
            size='md'
            onClick={handleSelectHighConfidence}
          >
            <AIIcon />
            Select High Confidence
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Button variant='outline' size='md' onClick={handleSelectAll}>
            {records.every(r => r.selected) ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant='outline'
            size='md'
            onClick={() => handleSelectTopResults(3)}
          >
            <LightningIcon />
            Select Top 3
          </Button>
          <Button variant='outline' size='md' onClick={handleClearSelection}>
            <ChecklistIcon />
            Clear Selection
          </Button>
          <Button
            variant='outline'
            size='md'
            disabled={selectedRecords.length === 0 || isBatchProcessing}
            onClick={() => {
              void handleBatchProcessSelected();
            }}
          >
            Batch Process ({selectedRecords.length})
          </Button>
          <Button
            variant='primary'
            size='md'
            disabled={!isStepComplete}
            onClick={handleProceedToRedact}
          >
            Proceed to Redact ({selectedRecords.length})
          </Button>
        </Box>
      </Box>

      {/* Selection Summary */}
      {selectedRecords.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity='info'>
            <Typography variant='body2'>
              <strong>
                {selectedRecords.length} record
                {selectedRecords.length !== 1 ? 's' : ''} selected
              </strong>{' '}
              - These records will be reviewed for redaction in the next step.
            </Typography>
          </Alert>
        </Box>
      )}

      {isBatchProcessing && (
        <Box sx={{ mb: 3 }}>
          <Alert severity='warning' sx={{ mb: 1 }}>
            Processing selected records in batch...
          </Alert>
          <LinearProgress />
        </Box>
      )}

      {selectedRecords.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity={canCompareSelected ? 'success' : 'info'}>
            <Typography variant='body2'>
              {canCompareSelected
                ? 'Comparison ready. Showing the top 2 selected records side-by-side below.'
                : 'Select at least 2 records to enable side-by-side comparison.'}
            </Typography>
          </Alert>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {rankedRecords.map(record => (
            <Box key={record.id} sx={{ transition: 'all 0.2s ease-in-out' }}>
              <Card
                onClick={() => setActivePreviewRecordId(record.id)}
                sx={{
                  height: '100%',
                  border: record.selected ? 2 : 1,
                  borderColor: record.selected ? 'primary.main' : 'divider',
                  backgroundColor: record.selected
                    ? 'primary.main08'
                    : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: 'grey.100',
                          color: 'text.secondary',
                        }}
                      >
                        {getRecordIcon(record.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant='h6'
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {record.title}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {record.department} •{' '}
                          {new Date(record.dateCreated).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${record.relevanceScore}% match`}
                        color={getRelevanceColor(record.relevanceScore)}
                        size='small'
                      />
                      <Checkbox
                        checked={record.selected || false}
                        onClick={e => e.stopPropagation()}
                        onChange={() => handleRecordToggle(record.id)}
                        color='primary'
                      />
                    </Box>
                  </Box>

                  <Stack direction='row' spacing={1} sx={{ mb: 1.5 }}>
                    <Chip
                      size='small'
                      label={`${record.confidenceLevel} confidence`}
                      color={confidenceColorMap[record.confidenceLevel]}
                      variant='outlined'
                    />
                    {record.batchProcessed && (
                      <Chip
                        size='small'
                        label='batch processed'
                        color='success'
                      />
                    )}
                  </Stack>

                  <Typography
                    variant='body2'
                    sx={{ mb: 2, color: 'text.secondary' }}
                  >
                    {renderHighlightedText(
                      `${record.previewSnippet}${record.previewSnippet.endsWith('.') ? '' : '...'}`,
                      record.matchedTerms
                    )}
                  </Typography>

                  <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                    {record.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Card
          sx={{
            height: 'fit-content',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PreviewIcon fontSize='small' />
              <Typography variant='h6'>Record Preview</Typography>
            </Box>

            {activePreviewRecord ? (
              <>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  {activePreviewRecord.title}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  {activePreviewRecord.department} • {activePreviewRecord.type}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Typography variant='caption' color='text.secondary'>
                  Matched Terms
                </Typography>
                <Stack
                  direction='row'
                  spacing={1}
                  useFlexGap
                  flexWrap='wrap'
                  sx={{ mb: 2 }}
                >
                  {(activePreviewRecord.matchedTerms.length > 0
                    ? activePreviewRecord.matchedTerms
                    : ['no explicit query matches']
                  )
                    .slice(0, 6)
                    .map(term => (
                      <Chip
                        key={term}
                        size='small'
                        label={term}
                        variant='outlined'
                      />
                    ))}
                </Stack>

                <Typography variant='caption' color='text.secondary'>
                  Content Snippet
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {renderHighlightedText(
                    activePreviewRecord.content,
                    activePreviewRecord.matchedTerms
                  )}
                </Typography>
              </>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Select a record to preview metadata and highlights.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {canCompareSelected && (
        <Card
          sx={{
            mt: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CompareIcon fontSize='small' />
              <Typography variant='h6'>Record Comparison View</Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              {comparisonRecords.map(record => (
                <Card
                  key={`comparison-${record.id}`}
                  variant='outlined'
                  sx={{ borderColor: 'divider' }}
                >
                  <CardContent>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {record.title}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1.5 }}
                    >
                      {record.id} • {record.department} • {record.type}
                    </Typography>

                    <Stack direction='row' spacing={1} sx={{ mb: 1.5 }}>
                      <Chip
                        size='small'
                        label={`${record.relevanceScore}% match`}
                        color={getRelevanceColor(record.relevanceScore)}
                      />
                      <Chip
                        size='small'
                        label={`${record.confidenceLevel} confidence`}
                        color={confidenceColorMap[record.confidenceLevel]}
                        variant='outlined'
                      />
                    </Stack>

                    <Typography variant='caption' color='text.secondary'>
                      Matched Terms
                    </Typography>
                    <Stack
                      direction='row'
                      spacing={1}
                      useFlexGap
                      flexWrap='wrap'
                      sx={{ mb: 1.5 }}
                    >
                      {(record.matchedTerms.length > 0
                        ? record.matchedTerms
                        : ['no explicit query matches']
                      )
                        .slice(0, 6)
                        .map(term => (
                          <Chip
                            key={`${record.id}-${term}`}
                            size='small'
                            label={term}
                            variant='outlined'
                          />
                        ))}
                    </Stack>

                    <Typography variant='caption' color='text.secondary'>
                      Preview Snippet
                    </Typography>
                    <Typography variant='body2' sx={{ mt: 0.5 }}>
                      {renderHighlightedText(
                        `${record.previewSnippet}${record.previewSnippet.endsWith('.') ? '' : '...'}`,
                        record.matchedTerms
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </WorkflowPage>
  );
}
