/**
 * Redact Step Component (V2 Guided Workflow)
 * Epic V2-3: Step 2 - Redact
 * US-V2-030: Enhanced AI Redaction System
 * US-V2-031: Interactive Redaction Editor
 * 
 * Integrates existing redaction components into guided V2 workflow:
 * - RedactionConfigurationPanel (sensitivity modes, exemptions, templates)
 * - InteractiveRedactionCanvas (manual editing with AI suggestions)
 * - Multi-record workflow with progress tracking
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Alert,
} from '@/components/migration';

import { InteractiveRedactionCanvas } from '@/components/staff/InteractiveRedactionEditor/InteractiveRedactionCanvas';
import {
  RedactionConfigurationPanel,
  RedactionConfigurationSettings,
} from '@/components/staff/RedactionConfiguration/RedactionConfigurationPanel';
import { RedactionSensitivityMode } from '@/services/enhancedPIIEngine';
import { PIIType } from '@/services/piiDetectionService';

export interface RedactStepProps {
  requestId: string;
  selectedRecords?: string[];
  onRedactionComplete?: (redactedRecords: RedactedRecordSummary[]) => void;
}

export interface RedactedRecordSummary {
  recordId: string;
  fileName: string;
  totalRedactions: number;
  autoRedactions: number;
  manualRedactions: number;
  qualityScore: number;
}

interface RecordToRedact {
  id: string;
  fileName: string;
  pageCount: number;
  imageUrls: string[]; // One per page
}

/**
 * RedactStep Component
 * Container for the Redact workflow step with:
 * - Configuration panel for redaction settings
 * - Interactive canvas for manual redaction refinement
 * - Multi-record/multi-page navigation
 * - Progress tracking and completion
 */
export function RedactStep({
  requestId,
  selectedRecords = [],
  onRedactionComplete,
}: RedactStepProps) {
  // Configuration state
  const [redactionSettings, setRedactionSettings] = useState<RedactionConfigurationSettings>({
    sensitivityMode: RedactionSensitivityMode.STANDARD,
    enabledPIITypes: Object.values(PIIType),
    legalExemptions: [],
    customPatterns: [],
    batchProcessingEnabled: true,
    autoSuggestionsEnabled: true,
    consistencyCheckEnabled: true,
  });

  // UI state
  const [showConfig, setShowConfig] = useState(true);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Records and navigation
  const [records, setRecords] = useState<RecordToRedact[]>([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [completedRecords, setCompletedRecords] = useState<Set<string>>(new Set());

  // Redaction tracking
  const [redactionSummaries, setRedactionSummaries] = useState<Record<string, RedactedRecordSummary>>({});

  const currentRecord = records[currentRecordIndex];
  const totalRecords = records.length;
  const progressPercentage = totalRecords > 0 
    ? Math.round((completedRecords.size / totalRecords) * 100) 
    : 0;

  /**
   * Initialize records from selected IDs
   */
  useEffect(() => {
    const initializeRecords = async () => {
      setInitializing(true);
      setLoading(true);

      try {
        // In real app, fetch record details from API
        // For now, create mock records based on selected IDs
        const mockRecords: RecordToRedact[] = selectedRecords.map((recordId, index) => ({
          id: recordId,
          fileName: `Document_${index + 1}.pdf`,
          pageCount: Math.floor(Math.random() * 5) + 1, // 1-5 pages
          imageUrls: Array.from(
            { length: Math.floor(Math.random() * 5) + 1 },
            (_, pageIdx) => `/mock-data/documents/${recordId}/page_${pageIdx + 1}.png`
          ),
        }));

        setRecords(mockRecords);

        // Initialize summaries
        const initialSummaries: Record<string, RedactedRecordSummary> = {};
        mockRecords.forEach(record => {
          initialSummaries[record.id] = {
            recordId: record.id,
            fileName: record.fileName,
            totalRedactions: 0,
            autoRedactions: 0,
            manualRedactions: 0,
            qualityScore: 0,
          };
        });
        setRedactionSummaries(initialSummaries);

      } catch (error) {
        console.error('Error initializing records:', error);
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    if (selectedRecords.length > 0) {
      initializeRecords();
    } else {
      setInitializing(false);
      setLoading(false);
    }
  }, [selectedRecords]);

  /**
   * Handle configuration changes
   */
  const handleSettingsChange = useCallback((newSettings: RedactionConfigurationSettings) => {
    setRedactionSettings(newSettings);
  }, []);

  /**
   * Handle redactions change for current document
   */
  const handleRedactionsChange = useCallback((redactions: any[]) => {
    if (!currentRecord) return;

    // Update summary for current record
    setRedactionSummaries(prev => ({
      ...prev,
      [currentRecord.id]: {
        ...prev[currentRecord.id],
        totalRedactions: redactions.length,
        // In real app, distinguish between auto and manual
        autoRedactions: Math.floor(redactions.length * 0.7),
        manualRedactions: Math.ceil(redactions.length * 0.3),
      },
    }));
  }, [currentRecord]);

  /**
   * Handle quality report updates
   */
  const handleQualityChange = useCallback((qualityReport: any) => {
    if (!currentRecord) return;

    setRedactionSummaries(prev => ({
      ...prev,
      [currentRecord.id]: {
        ...prev[currentRecord.id],
        qualityScore: qualityReport?.overallConfidence || 0,
      },
    }));
  }, [currentRecord]);

  /**
   * Mark current record as complete and move to next
   */
  const handleMarkRecordComplete = () => {
    if (!currentRecord) return;

    setCompletedRecords(prev => new Set([...prev, currentRecord.id]));

    // Move to next record if available
    if (currentRecordIndex < records.length - 1) {
      setCurrentRecordIndex(currentRecordIndex + 1);
      setCurrentPageIndex(0);
    }
  };

  /**
   * Navigate to previous record
   */
  const handlePreviousRecord = () => {
    if (currentRecordIndex > 0) {
      setCurrentRecordIndex(currentRecordIndex - 1);
      setCurrentPageIndex(0);
    }
  };

  /**
   * Navigate to next record
   */
  const handleNextRecord = () => {
    if (currentRecordIndex < records.length - 1) {
      setCurrentRecordIndex(currentRecordIndex + 1);
      setCurrentPageIndex(0);
    }
  };

  /**
   * Navigate to previous page
   */
  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  /**
   * Navigate to next page
   */
  const handleNextPage = () => {
    if (currentRecord && currentPageIndex < currentRecord.pageCount - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  /**
   * Complete redaction step and move to Respond
   */
  const handleContinue = () => {
    const summaries = Object.values(redactionSummaries);
    if (onRedactionComplete) {
      onRedactionComplete(summaries);
    }
  };

  // Show empty state if no records selected
  if (!initializing && selectedRecords.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant='h6' gutterBottom>
          No Records Selected
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Please go back to the Locate step and select records to redact.
        </Typography>
      </Box>
    );
  }

  // Show loading state
  if (initializing || loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant='body1' color='text.secondary'>
          Loading records for redaction...
        </Typography>
      </Box>
    );
  }

  const isRecordComplete = currentRecord && completedRecords.has(currentRecord.id);
  const allRecordsComplete = completedRecords.size === totalRecords;

  return (
    <Box>
      {/* Progress Header */}
      <Alert severity='info' sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              Redaction Progress: {completedRecords.size} of {totalRecords} records completed
            </Typography>
            <LinearProgress 
              variant='determinate' 
              value={progressPercentage} 
              sx={{ width: 300, mt: 1 }} 
            />
          </Box>
          <Chip 
            label={`${progressPercentage}%`} 
            color={allRecordsComplete ? 'success' : 'primary'} 
          />
        </Box>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Left Sidebar: Configuration Panel */}
        <Box sx={{ width: showConfig ? 360 : 48, transition: 'width 0.3s' }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant='h6' sx={{ display: showConfig ? 'block' : 'none' }}>
                Settings
              </Typography>
              <IconButton onClick={() => setShowConfig(!showConfig)} size='small'>
                <SettingsIcon />
              </IconButton>
            </Box>

            <Collapse in={showConfig}>
              <RedactionConfigurationPanel
                currentSettings={redactionSettings}
                onSettingsChange={handleSettingsChange}
              />
            </Collapse>
          </Paper>
        </Box>

        {/* Center: Document Canvas */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3 }}>
            {/* Document Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant='h6' gutterBottom>
                  <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {currentRecord?.fileName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Record {currentRecordIndex + 1} of {totalRecords} • Page {currentPageIndex + 1} of {currentRecord?.pageCount || 0}
                </Typography>
              </Box>

              {isRecordComplete && (
                <Chip 
                  label='Completed' 
                  color='success' 
                  icon={<CheckIcon />}
                  size='small'
                />
              )}
            </Box>

            {/* Interactive Canvas */}
            {currentRecord && (
              <Box sx={{ mb: 3 }}>
                <InteractiveRedactionCanvas
                  documentId={requestId}
                  recordId={currentRecord.id}
                  fileName={currentRecord.fileName}
                  imageUrl={currentRecord.imageUrls[currentPageIndex] || '/mock-data/sample-document.png'}
                  pageNumber={currentPageIndex + 1}
                  width={800}
                  height={1000}
                  onRedactionsChange={handleRedactionsChange}
                  onQualityChange={handleQualityChange}
                  sensitivityMode={redactionSettings.sensitivityMode}
                  showAISuggestions={redactionSettings.autoSuggestionsEnabled}
                />
              </Box>
            )}

            {/* Page Navigation */}
            {currentRecord && currentRecord.pageCount > 1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Button
                  startIcon={<PrevIcon />}
                  onClick={handlePreviousPage}
                  disabled={currentPageIndex === 0}
                  size='small'
                >
                  Previous Page
                </Button>
                <Typography variant='body2' color='text.secondary'>
                  Page {currentPageIndex + 1} / {currentRecord.pageCount}
                </Typography>
                <Button
                  endIcon={<NextIcon />}
                  onClick={handleNextPage}
                  disabled={currentPageIndex >= currentRecord.pageCount - 1}
                  size='small'
                >
                  Next Page
                </Button>
              </Box>
            )}

            {/* Record Navigation */}
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button
                startIcon={<PrevIcon />}
                onClick={handlePreviousRecord}
                disabled={currentRecordIndex === 0}
                variant='outlined'
              >
                Previous Record
              </Button>

              {!isRecordComplete && (
                <Button
                  onClick={handleMarkRecordComplete}
                  variant='contained'
                  color='success'
                  startIcon={<CheckIcon />}
                >
                  Mark Record Complete
                </Button>
              )}

              {currentRecordIndex < records.length - 1 ? (
                <Button
                  endIcon={<NextIcon />}
                  onClick={handleNextRecord}
                  variant='outlined'
                >
                  Next Record
                </Button>
              ) : (
                <Button
                  endIcon={<NextIcon />}
                  onClick={handleContinue}
                  variant='contained'
                  color='primary'
                  disabled={!allRecordsComplete}
                >
                  Continue to Respond
                </Button>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right Sidebar: Record Summary */}
        <Box sx={{ width: 280 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant='h6' gutterBottom>
              Records
            </Typography>
            
            <List>
              {records.map((record, index) => {
                const summary = redactionSummaries[record.id];
                const isComplete = completedRecords.has(record.id);
                const isCurrent = index === currentRecordIndex;

                return (
                  <ListItem
                    key={record.id}
                    selected={isCurrent}
                    onClick={() => {
                      setCurrentRecordIndex(index);
                      setCurrentPageIndex(0);
                    }}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      border: isCurrent ? 2 : 1,
                      borderColor: isCurrent ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {record.fileName}
                          {isComplete && <CheckIcon fontSize='small' color='success' />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant='caption' display='block'>
                            {summary?.totalRedactions || 0} redactions
                          </Typography>
                          {summary?.qualityScore > 0 && (
                            <Typography variant='caption' display='block' color='text.secondary'>
                              Quality: {Math.round(summary.qualityScore)}%
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant='subtitle2' gutterBottom>
              Overall Summary
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Total Records: {totalRecords}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Completed: {completedRecords.size}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Remaining: {totalRecords - completedRecords.size}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
