/**
 * AI Response Generation Interface
 * Main component for Step 3 - AI-powered response drafting and editing
 * Integrates tone selector, length controls, template chooser, and smart editing
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AutoFixHigh as MagicIcon,
  CheckCircle as CheckIcon,
  Description as TemplateIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  Psychology as AIIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  LinearProgress,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@/components/migration';

import { aiResponseService } from '../../services/aiResponseService';
import { PublicRecordRequest } from '../../types';
import {
  GeneratedResponse,
  ResponseGenerationRequest,
  ResponseLength,
  ResponseSection,
  ResponseSuggestion,
  ResponseTemplate,
  ResponseTone,
  ResponseValidation,
} from '../../types/response';

import ResponseTemplateManager from './ResponseTemplateManager';
import SmartTextEditor from './SmartTextEditor';

interface AIResponseGeneratorProps {
  requestDetails: PublicRecordRequest;
  recordsFound: boolean;
  recordCount?: number;
  redactionsApplied?: boolean;
  exemptionsUsed?: string[];
  fees?: number;
  onSave?: (response: string) => void;
  onSend?: (response: string) => void;
}

const TONE_OPTIONS: {
  value: ResponseTone;
  label: string;
  description: string;
}[] = [
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional and official language',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable tone',
  },
  { value: 'legal', label: 'Legal', description: 'Precise legal terminology' },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Business-appropriate tone',
  },
];

const LENGTH_OPTIONS: {
  value: ResponseLength;
  label: string;
  description: string;
}[] = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Balanced detail level',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive explanations',
  },
];

const SECTION_OPTIONS: { value: ResponseSection; label: string }[] = [
  { value: 'greeting', label: 'Greeting' },
  { value: 'acknowledgment', label: 'Acknowledgment' },
  { value: 'explanation', label: 'Explanation' },
  { value: 'records_summary', label: 'Records Summary' },
  { value: 'redaction_explanation', label: 'Redaction Explanation' },
  { value: 'exemptions', label: 'Legal Exemptions' },
  { value: 'fees', label: 'Fee Information' },
  { value: 'next_steps', label: 'Next Steps' },
  { value: 'closing', label: 'Closing' },
  { value: 'contact_info', label: 'Contact Information' },
];

export default function AIResponseGenerator({
  requestDetails,
  recordsFound,
  recordCount,
  redactionsApplied,
  exemptionsUsed,
  fees,
  onSave,
  onSend,
}: AIResponseGeneratorProps) {
  const theme = useTheme();

  // State
  const [response, setResponse] = useState('');
  const [generatedResponse, setGeneratedResponse] =
    useState<GeneratedResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validation, setValidation] = useState<ResponseValidation | null>(null);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Configuration state
  const [selectedTone, setSelectedTone] =
    useState<ResponseTone>('professional');
  const [selectedLength, setSelectedLength] =
    useState<ResponseLength>('standard');
  const [selectedTemplate, setSelectedTemplate] =
    useState<ResponseTemplate | null>(null);
  const [includedSections, setIncludedSections] = useState<ResponseSection[]>([
    'greeting',
    'acknowledgment',
    'records_summary',
    'closing',
    'contact_info',
  ]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, any>
  >({});

  // Load templates on mount
  useEffect(() => {
    const loadedTemplates = aiResponseService.getTemplates();
    setTemplates(loadedTemplates);
  }, []);

  // Auto-validate response when it changes
  useEffect(() => {
    if (generatedResponse) {
      validateResponse(generatedResponse);
    }
  }, [generatedResponse, response]);

  // Generate AI response
  const handleGenerateResponse = useCallback(async () => {
    try {
      setIsGenerating(true);

      const request: ResponseGenerationRequest = {
        requestId: requestDetails.id,
        templateId: selectedTemplate?.id,
        tone: selectedTone,
        length: selectedLength,
        includeSections: includedSections,
        customInstructions,
        placeholderValues,
        context: {
          requestDetails,
          recordsFound,
          recordCount,
          redactionsApplied,
          exemptionsUsed,
          fees,
        },
      };

      const result = await aiResponseService.generateResponse(request);

      if (result.success && result.response) {
        setGeneratedResponse(result.response);
        setResponse(result.response.content);
      } else {
        console.error('Response generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    requestDetails,
    selectedTone,
    selectedLength,
    selectedTemplate,
    includedSections,
    customInstructions,
    placeholderValues,
    recordsFound,
    recordCount,
    redactionsApplied,
    exemptionsUsed,
    fees,
  ]);

  // Validate response
  const validateResponse = async (responseToValidate: GeneratedResponse) => {
    try {
      const validationResult =
        await aiResponseService.validateResponse(responseToValidate);
      setValidation(validationResult);
    } catch (error) {
      console.error('Error validating response:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: ResponseTemplate) => {
    setSelectedTemplate(template);
    setSelectedTone(template.tone);
    setIncludedSections(template.sections);

    // Initialize placeholder values
    const initialValues: Record<string, any> = {};
    template.placeholders.forEach(placeholder => {
      if (placeholder.defaultValue !== undefined) {
        initialValues[placeholder.key] = placeholder.defaultValue;
      }
    });
    setPlaceholderValues(initialValues);
  };

  // Handle section toggle
  const handleSectionToggle = (section: ResponseSection) => {
    setIncludedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Handle placeholder value change
  const handlePlaceholderChange = (key: string, value: any) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle response save
  const handleSave = () => {
    onSave?.(response);
  };

  // Handle response send
  const handleSend = () => {
    if (validation?.isValid) {
      onSend?.(response);
    }
  };

  // Get validation severity color
  const getValidationColor = (severity: 'error' | 'warning' | 'suggestion') => {
    switch (severity) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'suggestion':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get validation icon
  const getValidationIcon = (severity: 'error' | 'warning' | 'suggestion') => {
    switch (severity) {
      case 'error':
        return <ErrorIcon fontSize='small' />;
      case 'warning':
        return <WarningIcon fontSize='small' />;
      case 'suggestion':
        return <CheckIcon fontSize='small' />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h5' component='h1'>
          AI Response Generation
        </Typography>
        <Box display='flex' gap={1}>
          <Button
            variant='outlined'
            startIcon={<TemplateIcon />}
            onClick={() => setShowTemplateManager(true)}
          >
            Manage Templates
          </Button>
          <Button
            variant='outlined'
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewOpen(true)}
            disabled={!response}
          >
            Preview
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Response Configuration
              </Typography>

              {/* Request Context */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant='subtitle2'>Request Context</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary='Request Title'
                        secondary={requestDetails.title}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary='Records Found'
                        secondary={
                          recordsFound ? `Yes (${recordCount || 0})` : 'No'
                        }
                      />
                    </ListItem>
                    {redactionsApplied && (
                      <ListItem>
                        <ListItemText
                          primary='Redactions Applied'
                          secondary='Yes'
                        />
                      </ListItem>
                    )}
                    {exemptionsUsed && exemptionsUsed.length > 0 && (
                      <ListItem>
                        <ListItemText
                          primary='Legal Exemptions'
                          secondary={exemptionsUsed.join(', ')}
                        />
                      </ListItem>
                    )}
                    {fees && (
                      <ListItem>
                        <ListItemText
                          primary='Fees'
                          secondary={`$${fees.toFixed(2)}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Tone Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id='tone-select-label'>Tone</InputLabel>
                <Select
                  labelId='tone-select-label'
                  id='tone-select'
                  value={selectedTone}
                  onChange={e =>
                    setSelectedTone(e.target.value as ResponseTone)
                  }
                  label='Tone'
                >
                  {TONE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant='body2'>{option.label}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Length Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id='length-select-label'>Length</InputLabel>
                <Select
                  labelId='length-select-label'
                  id='length-select'
                  value={selectedLength}
                  onChange={e =>
                    setSelectedLength(e.target.value as ResponseLength)
                  }
                  label='Length'
                >
                  {LENGTH_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant='body2'>{option.label}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Template Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id='template-select-label'>
                  Template (Optional)
                </InputLabel>
                <Select
                  labelId='template-select-label'
                  id='template-select'
                  value={selectedTemplate?.id || ''}
                  onChange={e => {
                    const template = templates.find(
                      t => t.id === e.target.value
                    );
                    handleTemplateSelect(template!);
                  }}
                  label='Template (Optional)'
                >
                  <MenuItem value=''>
                    <Typography color='text.secondary'>No template</Typography>
                  </MenuItem>
                  {templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box>
                        <Typography variant='body2'>{template.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {template.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sections */}
              <Typography variant='subtitle2' gutterBottom>
                Include Sections
              </Typography>
              <Box sx={{ mb: 2 }}>
                {SECTION_OPTIONS.map(option => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => handleSectionToggle(option.value)}
                    color={
                      includedSections.includes(option.value)
                        ? 'primary'
                        : 'default'
                    }
                    variant={
                      includedSections.includes(option.value)
                        ? 'filled'
                        : 'outlined'
                    }
                    size='small'
                    sx={{ m: 0.5 }}
                    aria-pressed={includedSections.includes(option.value)}
                    role='button'
                  />
                ))}
              </Box>

              {/* Custom Instructions */}
              <TextField
                id='custom-instructions'
                label='Custom Instructions (Optional)'
                value={customInstructions}
                onChange={e => setCustomInstructions(e.target.value)}
                multiline
                rows={3}
                fullWidth
                sx={{ mb: 2 }}
                placeholder='Add any specific instructions for the AI...'
              />

              {/* Placeholder Values */}
              {selectedTemplate && selectedTemplate.placeholders.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='subtitle2'>
                      Template Placeholders (
                      {selectedTemplate.placeholders.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box display='flex' flexDirection='column' gap={2}>
                      {selectedTemplate.placeholders.map(placeholder => (
                        <TextField
                          key={placeholder.key}
                          label={placeholder.label}
                          value={placeholderValues[placeholder.key] || ''}
                          onChange={e =>
                            handlePlaceholderChange(
                              placeholder.key,
                              e.target.value
                            )
                          }
                          required={placeholder.required}
                          type={
                            placeholder.type === 'number' ? 'number' : 'text'
                          }
                          size='small'
                          helperText={placeholder.description}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Generate Button */}
              <Button
                variant='contained'
                startIcon={
                  isGenerating ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : (
                    <MagicIcon />
                  )
                }
                onClick={handleGenerateResponse}
                disabled={isGenerating}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isGenerating ? 'Generating...' : 'Generate Response'}
              </Button>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validation && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Response Validation
                </Typography>

                <Box display='flex' alignItems='center' gap={1} mb={2}>
                  <Typography variant='body2'>
                    Quality Score: {validation.score}%
                  </Typography>
                  <LinearProgress
                    variant='determinate'
                    value={validation.score}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color={
                      validation.score > 80
                        ? 'success'
                        : validation.score > 60
                          ? 'warning'
                          : 'error'
                    }
                  />
                </Box>

                {validation.issues.length > 0 && (
                  <List dense>
                    {validation.issues.slice(0, 5).map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemIcon
                          sx={{ color: getValidationColor(issue.severity) }}
                        >
                          {getValidationIcon(issue.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={issue.message}
                          secondary={issue.suggestion}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color:
                              issue.severity === 'error'
                                ? 'error'
                                : 'text.primary',
                          }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Box display='flex' gap={1} mt={2}>
                  {validation.compliance.foia && (
                    <Chip label='FOIA Compliant' color='success' size='small' />
                  )}
                  {validation.compliance.cpra && (
                    <Chip label='CPRA Compliant' color='success' size='small' />
                  )}
                  {validation.compliance.accessibility && (
                    <Chip label='Accessible' color='success' size='small' />
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Editor Panel */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Response Draft</Typography>
                <Box display='flex' gap={1}>
                  <Button
                    variant='outlined'
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!response}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant='contained'
                    startIcon={<SendIcon />}
                    onClick={handleSend}
                    disabled={!validation?.isValid}
                  >
                    Send Response
                  </Button>
                </Box>
              </Box>

              <SmartTextEditor
                value={response}
                onChange={setResponse}
                tone={selectedTone}
                length={selectedLength}
                requestContext={requestDetails}
                templates={templates}
                autoSuggest={true}
                showAI={true}
                height={500}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Template Manager Dialog */}
      <Dialog
        open={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        maxWidth='xl'
        fullWidth
      >
        <DialogTitle>Template Manager</DialogTitle>
        <DialogContent>
          <ResponseTemplateManager
            onTemplateSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplate?.id}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateManager(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Response Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Response Preview</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
