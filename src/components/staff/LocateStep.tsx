'use client';

import React, { useMemo, useState } from 'react';
import {
  AutoAwesome as AIIcon,
  Bolt as LightningIcon,
  Chat as ChatIcon,
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
import { LocateChatAssistant } from '@/components/staff/LocateChatAssistant';
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
  category: string;
  dateCreated: string;
  content: string;
  description: string;
  baseRelevanceScore: number;
  tags: string[];
  organizationFolder?: string;
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
    category: 'Incident Analysis',
    dateCreated: '2024-01-15',
    content:
      'Contains incident summaries, officer narratives, and follow-up actions for downtown traffic collisions and enforcement outcomes.',
    description:
      'Comprehensive analysis of traffic patterns and safety incidents in the downtown district during Q4 2023.',
    baseRelevanceScore: 95,
    tags: ['traffic', 'safety', 'downtown'],
    organizationFolder: 'Priority Review',
  },
  {
    id: 'PR-2024-002',
    title: 'Email: Downtown Traffic Concerns',
    type: 'email',
    department: 'Transportation',
    category: 'Correspondence',
    dateCreated: '2024-01-12',
    content:
      'Includes requests for camera footage references, follow-up correspondence, and departmental response deadlines.',
    description:
      'Email correspondence between city council and transportation department regarding traffic concerns.',
    baseRelevanceScore: 88,
    tags: ['email', 'traffic', 'council'],
    organizationFolder: 'Requester Communications',
  },
  {
    id: 'PR-2024-003',
    title: 'Public Safety Incident Log - Sector 4',
    type: 'document',
    department: 'Police',
    category: 'Evidence',
    dateCreated: '2024-01-09',
    content:
      'Incident-level entries with timestamps, responding units, witness statements, and references to body camera retention IDs.',
    description:
      'Structured incident log with officer notes and reference IDs for evidence files.',
    baseRelevanceScore: 79,
    tags: ['incident', 'police', 'body camera'],
    organizationFolder: 'Legal Hold',
  },
  {
    id: 'PR-2024-004',
    title: 'Records Retention Policy - Audio and Video Evidence',
    type: 'correspondence',
    department: 'City Clerk',
    category: 'Policy',
    dateCreated: '2023-12-21',
    content:
      'Policy guidance for release windows, exemption handling, and legal review requirements for digital recordings.',
    description:
      'Records policy memo for handling retention and disclosure of media evidence.',
    baseRelevanceScore: 71,
    tags: ['policy', 'retention', 'evidence'],
    organizationFolder: 'Policy References',
  },
];

const defaultFolders = [
  'Priority Review',
  'Legal Hold',
  'Requester Communications',
  'Policy References',
  'Manual Intake',
];

const defaultCategories = [
  'Incident Analysis',
  'Correspondence',
  'Evidence',
  'Policy',
  'Uploaded Material',
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
  const [folderFilter, setFolderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [targetFolder, setTargetFolder] = useState(defaultFolders[0]);
  const [targetCategory, setTargetCategory] = useState(defaultCategories[0]);
  const [tagInput, setTagInput] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  const [activePreviewRecordId, setActivePreviewRecordId] = useState<
    string | null
  >(mockRecords[0]?.id ?? null);

  const allRankedRecords = useMemo<RankedRecord[]>(() => {
    return records
      .map(record => {
        const ranking = calculateRanking(record, searchTerm);
        return { ...record, ...ranking };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [records, searchTerm]);

  const folderOptions = useMemo(() => {
    const dynamicFolders = records
      .map(record => record.organizationFolder)
      .filter((folder): folder is string => Boolean(folder));

    return Array.from(new Set([...defaultFolders, ...dynamicFolders]));
  }, [records]);

  const categoryOptions = useMemo(() => {
    const dynamicCategories = records.map(record => record.category);
    return Array.from(new Set([...defaultCategories, ...dynamicCategories]));
  }, [records]);

  const rankedRecords = useMemo(() => {
    return allRankedRecords.filter(record => {
      if (
        folderFilter !== 'all' &&
        record.organizationFolder !== folderFilter
      ) {
        return false;
      }

      if (categoryFilter !== 'all' && record.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [allRankedRecords, folderFilter, categoryFilter]);

  const selectedRecords = allRankedRecords.filter(r => r.selected);
  const comparisonRecords = selectedRecords.slice(0, 2);
  const canCompareSelected = comparisonRecords.length === 2;
  const highConfidenceCount = allRankedRecords.filter(
    r => r.confidenceLevel === 'high'
  ).length;
  const isStepComplete = selectedRecords.length > 0;
  const activePreviewRecord =
    allRankedRecords.find(r => r.id === activePreviewRecordId) ||
    allRankedRecords[0] ||
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
      allRankedRecords
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

  const handleAssignFolderToSelected = () => {
    if (selectedRecords.length === 0) return;

    setRecords(prev =>
      prev.map(record =>
        record.selected
          ? { ...record, organizationFolder: targetFolder }
          : record
      )
    );
  };

  const handleAssignCategoryToSelected = () => {
    if (selectedRecords.length === 0) return;

    setRecords(prev =>
      prev.map(record =>
        record.selected ? { ...record, category: targetCategory } : record
      )
    );
  };

  const handleAddTagToSelected = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || selectedRecords.length === 0) return;

    setRecords(prev =>
      prev.map(record => {
        if (!record.selected) return record;
        if (record.tags.includes(tag)) return record;
        return { ...record, tags: [...record.tags, tag] };
      })
    );

    setTagInput('');
  };

  const handleManualUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const timestamp = Date.now();
    const uploadedRecords: PublicRecord[] = files.map((file, index) => {
      const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      const inferredType: PublicRecord['type'] = file.type.includes('message')
        ? 'email'
        : 'document';

      return {
        id: `PR-UP-${timestamp}-${index + 1}`,
        title: fileNameWithoutExtension,
        type: inferredType,
        department: 'Manual Uploads',
        category: 'Uploaded Material',
        dateCreated: new Date().toISOString().slice(0, 10),
        content: `Uploaded file: ${file.name}`,
        description: `Manually attached file (${Math.max(1, Math.round(file.size / 1024))} KB).`,
        baseRelevanceScore: 62,
        tags: ['uploaded', 'manual-attachment'],
        organizationFolder: 'Manual Intake',
        selected: true,
      };
    });

    setRecords(prev => [...uploadedRecords, ...prev]);
    setUploadNotice(
      `${files.length} file${files.length === 1 ? '' : 's'} attached and added to the record set.`
    );
    event.target.value = '';
  };

  const confidenceColorMap = {
    high: 'success',
    medium: 'warning',
    low: 'error',
  } as const;

  const assistantContext = useMemo(() => {
    const topDepartments = Array.from(
      new Set(allRankedRecords.map(record => record.department))
    ).slice(0, 3);

    const topCategories = Array.from(
      new Set(allRankedRecords.map(record => record.category))
    ).slice(0, 3);

    return {
      requestId,
      totalRecords: allRankedRecords.length,
      highConfidenceCount,
      topDepartments,
      topCategories,
      currentQuery: searchTerm,
    };
  }, [allRankedRecords, highConfidenceCount, requestId, searchTerm]);

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
              <Typography variant='h6'>{allRankedRecords.length}</Typography>
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

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
          mb: 3,
        }}
      >
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterIcon fontSize='small' />
              <Typography variant='h6'>Record Organization</Typography>
            </Box>

            <Typography variant='caption' color='text.secondary'>
              Filter the current set
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                mb: 2,
              }}
            >
              <select
                value={folderFilter}
                onChange={e => setFolderFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value='all'>All folders</option>
                {folderOptions.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value='all'>All categories</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Box>

            <Typography variant='caption' color='text.secondary'>
              Organize selected records ({selectedRecords.length})
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
                mb: 1,
              }}
            >
              <select
                value={targetFolder}
                onChange={e => setTargetFolder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                {folderOptions.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
              <Button
                variant='outline'
                size='md'
                disabled={selectedRecords.length === 0}
                onClick={handleAssignFolderToSelected}
              >
                Assign Folder
              </Button>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
                mb: 1,
              }}
            >
              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Button
                variant='outline'
                size='md'
                disabled={selectedRecords.length === 0}
                onClick={handleAssignCategoryToSelected}
              >
                Assign Category
              </Button>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
              }}
            >
              <input
                type='text'
                placeholder='Add tag to selected records (e.g. urgent)'
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              <Button
                variant='outline'
                size='md'
                disabled={
                  selectedRecords.length === 0 || tagInput.trim() === ''
                }
                onClick={handleAddTagToSelected}
              >
                Add Tag
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              Manual Record Upload
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Attach files to include additional records in this locate step.
            </Typography>

            <input
              type='file'
              multiple
              accept='.pdf,.doc,.docx,.txt,.eml,image/*'
              onChange={handleManualUpload}
              style={{ width: '100%' }}
            />

            {uploadNotice && (
              <Alert severity='success' sx={{ mt: 2 }}>
                <Typography variant='body2'>{uploadNotice}</Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>

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
          <Button
            variant='outline'
            size='md'
            onClick={() => setIsChatAssistantOpen(true)}
          >
            <ChatIcon />
            AI Assistant
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
                    <Chip
                      size='small'
                      label={`Category: ${record.category}`}
                      variant='outlined'
                    />
                    {record.organizationFolder && (
                      <Chip
                        size='small'
                        label={`Folder: ${record.organizationFolder}`}
                        variant='outlined'
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
                  {activePreviewRecord.department} • {activePreviewRecord.type}{' '}
                  • {activePreviewRecord.category}
                </Typography>

                {activePreviewRecord.organizationFolder && (
                  <Chip
                    size='small'
                    label={`Folder: ${activePreviewRecord.organizationFolder}`}
                    variant='outlined'
                    sx={{ mb: 2 }}
                  />
                )}

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

      <LocateChatAssistant
        open={isChatAssistantOpen}
        onClose={() => setIsChatAssistantOpen(false)}
        context={assistantContext}
        onApplyQuery={query => setSearchTerm(query)}
      />
    </WorkflowPage>
  );
}
