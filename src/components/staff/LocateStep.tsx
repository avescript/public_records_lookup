'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Typography,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Folder as FolderIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';

import { Button } from '@/components/core/Button';
import { WorkflowPage } from '@/components/staff/WorkflowPage';
import { WorkflowStep } from '@/components/staff/WorkflowNavigation';

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
  description: string;
  relevanceScore: number;
  tags: string[];
  selected?: boolean;
}

// Mock data for demonstration
const mockRecords: PublicRecord[] = [
  {
    id: 'PR-2024-001',
    title: 'Traffic Safety Report - Downtown District',
    type: 'report',
    department: 'Transportation',
    dateCreated: '2024-01-15',
    description: 'Comprehensive analysis of traffic patterns and safety incidents in the downtown district during Q4 2023.',
    relevanceScore: 95,
    tags: ['traffic', 'safety', 'downtown'],
  },
  {
    id: 'PR-2024-002',
    title: 'Email: Downtown Traffic Concerns',
    type: 'email',
    department: 'Transportation',
    dateCreated: '2024-01-12',
    description: 'Email correspondence between city council and transportation department regarding traffic concerns.',
    relevanceScore: 88,
    tags: ['email', 'traffic', 'council'],
  },
];

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
  const [records, setRecords] = useState<PublicRecord[]>(mockRecords.map(r => ({ ...r, selected: false })));
  const [searchTerm, setSearchTerm] = useState('');

  const selectedRecords = records.filter(r => r.selected);
  const isStepComplete = selectedRecords.length > 0;

  const handleRecordToggle = (recordId: string) => {
    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, selected: !record.selected }
        : record
    ));
  };

  const handleSelectAll = () => {
    const allSelected = records.every(r => r.selected);
    setRecords(prev => prev.map(record => ({ ...record, selected: !allSelected })));
  };

  const handleProceedToRedact = () => {
    console.log('Proceeding to redact with selected records:', selectedRecords);
  };

  return (
    <WorkflowPage
      requestId={requestId}
      currentStep="locate"
      completedSteps={completedSteps}
      title="Locate Relevant Records"
      subtitle="Search and select public records that are relevant to this request. Use the search and filters to find specific documents, emails, or reports."
    >
      {/* Simple Search and Action Bar */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <SearchIcon sx={{ position: 'absolute', left: 1.5, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary' }} />
            <input
              type="text"
              placeholder="Search records by title, content, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
          </Box>
          <Button variant="outline" size="md">
            <FilterIcon />
            Filters
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outline" size="md" onClick={handleSelectAll}>
            {records.every(r => r.selected) ? 'Deselect All' : 'Select All'}
          </Button>
          <Button variant="primary" size="md" disabled={!isStepComplete} onClick={handleProceedToRedact}>
            Proceed to Redact ({selectedRecords.length})
          </Button>
        </Box>
      </Box>

      {/* Selection Summary */}
      {selectedRecords.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>{selectedRecords.length} record{selectedRecords.length !== 1 ? 's' : ''} selected</strong> - 
              These records will be reviewed for redaction in the next step.
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Search Results */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
        {records.map((record) => (
          <Box key={record.id} sx={{ transition: 'all 0.2s ease-in-out' }}>
            <Card sx={{ 
              height: '100%',
              border: record.selected ? 2 : 1,
              borderColor: record.selected ? 'primary.main' : 'divider',
              backgroundColor: record.selected ? 'primary.main08' : 'background.paper',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      backgroundColor: 'grey.100',
                      color: 'text.secondary',
                    }}>
                      {getRecordIcon(record.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {record.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.department} • {new Date(record.dateCreated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${record.relevanceScore}% match`}
                      color={getRelevanceColor(record.relevanceScore)}
                      size="small"
                    />
                    <Checkbox
                      checked={record.selected || false}
                      onChange={() => handleRecordToggle(record.id)}
                      color="primary"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {record.description}
                </Typography>
                
                <Stack direction="row" spacing={1}>
                  {record.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </WorkflowPage>
  );
}