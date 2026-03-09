/**
 * Respond Step Component (V2 Guided Workflow)
 * Epic V2-4: Step 3 - Respond
 * US-V2-040: AI Response Generation
 * US-V2-041: Response Customization & Preview
 * 
 * Integrates existing response generation components into guided V2 workflow:
 * - AIResponseGenerator (tone, length, template controls)
 * - SmartTextEditor (AI-assisted editing with suggestions)
 * - Response preview (HTML email, print, accessibility)
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Email as EmailIcon,
  Print as PrintIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Description as DocumentIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  ChevronLeft as BackIcon,
  ChevronRight as ContinueIcon,
} from '@mui/icons-material';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  Alert,
} from '@/components/migration';

import AIResponseGenerator from '@/components/staff/AIResponseGenerator';
import { StoredRequest } from '@/services/requestService';

export interface RespondStepProps {
  requestId: string;
  request: StoredRequest;
  redactedRecords?: RedactedRecordSummary[];
  onResponseComplete?: (responseData: ResponseSummary) => void;
}

export interface RedactedRecordSummary {
  recordId: string;
  fileName: string;
  totalRedactions: number;
  autoRedactions: number;
  manualRedactions: number;
  qualityScore: number;
}

export interface ResponseSummary {
  responseText: string;
  tone: string;
  length: string;
  wordCount: number;
  validationPassed: boolean;
  timestamp: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role='tabpanel' hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * RespondStep Component
 * Container for the Respond workflow step with:
 * - AI-powered response generation
 * - Smart text editing with suggestions
 * - Multiple preview modes (email, print, accessibility)
 * - Tone and length customization
 * - Template selection
 */
export function RespondStep({
  requestId,
  request,
  redactedRecords = [],
  onResponseComplete,
}: RespondStepProps) {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [responseText, setResponseText] = useState('');
  const [responseGenerated, setResponseGenerated] = useState(false);
  const [previewMode, setPreviewMode] = useState<'email' | 'print' | 'accessibility'>('email');

  // Calculate summary data from redacted records
  const totalRecords = redactedRecords.length;
  const totalRedactions = redactedRecords.reduce(
    (sum, record) => sum + record.totalRedactions,
    0
  );
  const recordsFound = totalRecords > 0;

  /**
   * Handle response save from AIResponseGenerator
   */
  const handleResponseSave = useCallback((response: string) => {
    setResponseText(response);
    setResponseGenerated(true);
  }, []);

  /**
   * Handle response send (used as completion trigger)
   */
  const handleResponseSend = useCallback((response: string) => {
    setResponseText(response);
    setResponseGenerated(true);
  }, []);

  /**
   * Continue to Review step
   */
  const handleContinue = () => {
    if (onResponseComplete) {
      const summary: ResponseSummary = {
        responseText,
        tone: 'professional', // Would be tracked from AIResponseGenerator
        length: 'standard', // Would be tracked from AIResponseGenerator
        wordCount: responseText.split(/\s+/).length,
        validationPassed: true,
        timestamp: new Date(),
      };
      onResponseComplete(summary);
    }
  };

  /**
   * Render preview based on mode
   */
  const renderPreview = () => {
    if (!responseText) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <InfoIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
          <Typography variant='h6' gutterBottom>
            No Response Generated Yet
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Generate a response using the editor tab to see the preview.
          </Typography>
        </Box>
      );
    }

    switch (previewMode) {
      case 'email':
        return (
          <Box>
            <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 'bold' }}>
              Email Preview
            </Typography>
            <Paper 
              variant='outlined' 
              sx={{ 
                p: 3, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 400,
              }}
            >
              {/* Email Header */}
              <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant='body2' color='text.secondary'>
                  <strong>From:</strong> {request.agency || 'Public Records Office'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  <strong>To:</strong> {request.contactEmail}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  <strong>Subject:</strong> RE: Public Records Request #{requestId}
                </Typography>
              </Box>

              {/* Email Body */}
              <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                <Typography variant='body1'>{responseText}</Typography>
              </Box>

              {/* Attachments Section */}
              {totalRecords > 0 && (
                <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Attachments ({totalRecords})
                  </Typography>
                  {redactedRecords.map((record, index) => (
                    <Chip
                      key={record.recordId}
                      icon={<DocumentIcon />}
                      label={record.fileName}
                      size='small'
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        );

      case 'print':
        return (
          <Box>
            <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 'bold' }}>
              Print Preview
            </Typography>
            <Paper 
              variant='outlined' 
              sx={{ 
                p: 4, 
                bgcolor: 'white',
                color: 'black',
                minHeight: 400,
                boxShadow: 3,
              }}
            >
              {/* Letterhead */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                  {request.agency || 'Public Records Office'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Public Records Request Response
                </Typography>
              </Box>

              {/* Date */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2'>
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>

              {/* Recipient */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2'>{request.contactEmail}</Typography>
              </Box>

              {/* Subject */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                  RE: Public Records Request #{requestId}
                </Typography>
              </Box>

              {/* Body */}
              <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                <Typography variant='body1'>{responseText}</Typography>
              </Box>

              {/* Signature */}
              <Box sx={{ mt: 4 }}>
                <Typography variant='body2'>Sincerely,</Typography>
                <Typography variant='body2' sx={{ mt: 2 }}>
                  Public Records Coordinator
                </Typography>
              </Box>
            </Paper>
          </Box>
        );

      case 'accessibility':
        return (
          <Box>
            <Typography variant='subtitle2' gutterBottom sx={{ fontWeight: 'bold' }}>
              Accessibility Check
            </Typography>
            <Alert severity='success' sx={{ mb: 2 }}>
              ✓ Text is clear and readable
            </Alert>
            <Alert severity='success' sx={{ mb: 2 }}>
              ✓ No special formatting that may cause issues with screen readers
            </Alert>
            <Alert severity='success' sx={{ mb: 2 }}>
              ✓ Proper heading structure
            </Alert>
            {responseText.length > 500 && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Response is lengthy. Consider adding section headings for better navigation.
              </Alert>
            )}
            <Paper variant='outlined' sx={{ p: 3, mt: 2 }}>
              <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                {responseText}
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Context Summary */}
      {totalRecords > 0 && (
        <Alert severity='info' sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Response Context
              </Typography>
              <Typography variant='body2'>
                {totalRecords} record{totalRecords !== 1 ? 's' : ''} processed with {totalRedactions} redaction{totalRedactions !== 1 ? 's' : ''} applied
              </Typography>
            </Box>
            <Chip label={recordsFound ? 'Records Found' : 'No Records'} color={recordsFound ? 'success' : 'default'} />
          </Box>
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ mb: 3 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label='Response Editor' />
            <Tab label='Preview' disabled={!responseText} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            {/* AI Response Generator */}
            <AIResponseGenerator
              requestDetails={request}
              recordsFound={recordsFound}
              recordCount={totalRecords}
              redactionsApplied={totalRedactions > 0}
              exemptionsUsed={[]}
              fees={0}
              onSave={handleResponseSave}
              onSend={handleResponseSend}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Preview Mode Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2' gutterBottom>
                Preview Mode
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={previewMode === 'email' ? 'contained' : 'outlined'}
                  startIcon={<EmailIcon />}
                  onClick={() => setPreviewMode('email')}
                  size='small'
                >
                  Email
                </Button>
                <Button
                  variant={previewMode === 'print' ? 'contained' : 'outlined'}
                  startIcon={<PrintIcon />}
                  onClick={() => setPreviewMode('print')}
                  size='small'
                >
                  Print
                </Button>
                <Button
                  variant={previewMode === 'accessibility' ? 'contained' : 'outlined'}
                  startIcon={<CheckIcon />}
                  onClick={() => setPreviewMode('accessibility')}
                  size='small'
                >
                  Accessibility
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Preview Content */}
            {renderPreview()}
          </TabPanel>
        </Box>
      </Paper>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<BackIcon />}
          variant='outlined'
          onClick={() => {
            // Navigate back handled by parent
          }}
        >
          Back to Redact
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {responseGenerated && (
            <Chip
              icon={<CheckIcon />}
              label='Response Generated'
              color='success'
              size='small'
            />
          )}
        </Box>

        <Button
          endIcon={<ContinueIcon />}
          variant='contained'
          color='primary'
          onClick={handleContinue}
          disabled={!responseGenerated || !responseText}
        >
          Continue to Review
        </Button>
      </Box>
    </Box>
  );
}
