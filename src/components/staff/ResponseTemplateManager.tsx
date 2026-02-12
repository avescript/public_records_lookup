/**
 * Response Template Management Component
 * Provides UI for creating, editing, and managing response templates
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Rating,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { aiResponseService } from '../../services/aiResponseService';
import {
  ResponseSection,
  ResponseTemplate,
  ResponseTemplatePlaceholder,
  ResponseTone,
} from '../../types/response';

interface ResponseTemplateManagerProps {
  onTemplateSelect?: (template: ResponseTemplate) => void;
  selectedTemplateId?: string;
  requestType?: string;
}

const TONE_OPTIONS: { value: ResponseTone; label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'legal', label: 'Legal' },
  { value: 'professional', label: 'Professional' },
];

const SECTION_OPTIONS: { value: ResponseSection; label: string }[] = [
  { value: 'greeting', label: 'Greeting' },
  { value: 'acknowledgment', label: 'Acknowledgment' },
  { value: 'explanation', label: 'Explanation' },
  { value: 'records_summary', label: 'Records Summary' },
  { value: 'redaction_explanation', label: 'Redaction Explanation' },
  { value: 'exemptions', label: 'Exemptions' },
  { value: 'fees', label: 'Fees' },
  { value: 'next_steps', label: 'Next Steps' },
  { value: 'closing', label: 'Closing' },
  { value: 'contact_info', label: 'Contact Information' },
];

const PLACEHOLDER_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'list', label: 'List' },
  { value: 'computed', label: 'Computed' },
];

export default function ResponseTemplateManager({
  onTemplateSelect,
  selectedTemplateId,
  requestType,
}: ResponseTemplateManagerProps) {
  const theme = useTheme();

  // State
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ResponseTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<ResponseTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ResponseTemplate>>({
    name: '',
    description: '',
    requestType: ['general'],
    baseTemplate: '',
    sections: ['greeting', 'acknowledgment', 'closing', 'contact_info'],
    placeholders: [],
    tone: 'professional',
    compliance: { foia: true, cpra: true },
  });

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const loadedTemplates = aiResponseService.getTemplates(requestType);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, [requestType]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      requestType: ['general'],
      baseTemplate: '',
      sections: ['greeting', 'acknowledgment', 'closing', 'contact_info'],
      placeholders: [],
      tone: 'professional',
      compliance: { foia: true, cpra: true },
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: ResponseTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      aiResponseService.deleteTemplate(templateId);
      await loadTemplates();
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const template: ResponseTemplate = {
        id: editingTemplate?.id || `template-${Date.now()}`,
        name: formData.name!,
        description: formData.description!,
        requestType: formData.requestType!,
        baseTemplate: formData.baseTemplate!,
        sections: formData.sections!,
        placeholders: formData.placeholders!,
        tone: formData.tone!,
        compliance: formData.compliance!,
        usage: editingTemplate?.usage || {
          frequency: 0,
          lastUsed: new Date(),
          rating: 4.0,
        },
      };

      aiResponseService.saveTemplate(template);
      await loadTemplates();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleCopyTemplate = (template: ResponseTemplate) => {
    navigator.clipboard.writeText(template.baseTemplate);
  };

  const handlePreviewTemplate = (template: ResponseTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const addPlaceholder = () => {
    const newPlaceholder: ResponseTemplatePlaceholder = {
      key: '',
      label: '',
      type: 'text',
      required: false,
    };

    setFormData({
      ...formData,
      placeholders: [...(formData.placeholders || []), newPlaceholder],
    });
  };

  const updatePlaceholder = (
    index: number,
    updates: Partial<ResponseTemplatePlaceholder>
  ) => {
    const updatedPlaceholders = [...(formData.placeholders || [])];
    updatedPlaceholders[index] = { ...updatedPlaceholders[index], ...updates };

    setFormData({
      ...formData,
      placeholders: updatedPlaceholders,
    });
  };

  const removePlaceholder = (index: number) => {
    const updatedPlaceholders = [...(formData.placeholders || [])];
    updatedPlaceholders.splice(index, 1);

    setFormData({
      ...formData,
      placeholders: updatedPlaceholders,
    });
  };

  if (loading) {
    return <Box p={3}>Loading templates...</Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h6'>Response Templates</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          Create Template
        </Button>
      </Box>

      {/* Template List */}
      <Grid container spacing={2}>
        {templates.map(template => (
          <Grid item xs={12} md={6} key={template.id}>
            <Card
              variant={
                selectedTemplateId === template.id ? 'elevation' : 'outlined'
              }
              sx={{
                cursor: onTemplateSelect ? 'pointer' : 'default',
                border:
                  selectedTemplateId === template.id
                    ? `2px solid ${theme.palette.primary.main}`
                    : undefined,
              }}
              onClick={() => onTemplateSelect?.(template)}
            >
              <CardContent>
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='flex-start'
                  mb={2}
                >
                  <Typography variant='h6' component='div'>
                    {template.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        handlePreviewTemplate(template);
                      }}
                    >
                      <PreviewIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyTemplate(template);
                      }}
                    >
                      <CopyIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant='body2' color='text.secondary' mb={2}>
                  {template.description}
                </Typography>

                <Box display='flex' gap={1} mb={2}>
                  {template.requestType.map(type => (
                    <Chip key={type} label={type} size='small' />
                  ))}
                </Box>

                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Typography variant='body2'>
                    Tone: <strong>{template.tone}</strong>
                  </Typography>
                  <Rating value={template.usage.rating} readOnly size='small' />
                </Box>

                <Typography variant='body2' color='text.secondary'>
                  Used {template.usage.frequency} times
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Editor Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          <Box display='flex' flexDirection='column' gap={3} pt={1}>
            {/* Basic Information */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Template Name'
                  value={formData.name || ''}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={formData.tone || 'professional'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        tone: e.target.value as ResponseTone,
                      })
                    }
                    label='Tone'
                  >
                    {TONE_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label='Description'
              value={formData.description || ''}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              required
            />

            {/* Request Types */}
            <FormControl fullWidth>
              <InputLabel>Request Types</InputLabel>
              <Select
                multiple
                value={formData.requestType || []}
                onChange={e =>
                  setFormData({
                    ...formData,
                    requestType: e.target.value as string[],
                  })
                }
                label='Request Types'
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map(value => (
                      <Chip key={value} label={value} size='small' />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value='general'>General</MenuItem>
                <MenuItem value='document_request'>Document Request</MenuItem>
                <MenuItem value='incident_report'>Incident Report</MenuItem>
                <MenuItem value='sensitive_request'>Sensitive Request</MenuItem>
              </Select>
            </FormControl>

            {/* Sections */}
            <FormControl fullWidth>
              <InputLabel>Sections</InputLabel>
              <Select
                multiple
                value={formData.sections || []}
                onChange={e =>
                  setFormData({
                    ...formData,
                    sections: e.target.value as ResponseSection[],
                  })
                }
                label='Sections'
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map(value => (
                      <Chip
                        key={value}
                        label={
                          SECTION_OPTIONS.find(opt => opt.value === value)
                            ?.label || value
                        }
                        size='small'
                      />
                    ))}
                  </Box>
                )}
              >
                {SECTION_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Template Content */}
            <TextField
              label='Template Content'
              value={formData.baseTemplate || ''}
              onChange={e =>
                setFormData({ ...formData, baseTemplate: e.target.value })
              }
              fullWidth
              multiline
              rows={10}
              required
              helperText='Use {{placeholder_name}} for dynamic content'
            />

            {/* Placeholders */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  Placeholders ({(formData.placeholders || []).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display='flex' flexDirection='column' gap={2}>
                  <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={addPlaceholder}
                  >
                    Add Placeholder
                  </Button>

                  {(formData.placeholders || []).map((placeholder, index) => (
                    <Card key={index} variant='outlined'>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label='Key'
                              value={placeholder.key}
                              onChange={e =>
                                updatePlaceholder(index, {
                                  key: e.target.value,
                                })
                              }
                              fullWidth
                              size='small'
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label='Label'
                              value={placeholder.label}
                              onChange={e =>
                                updatePlaceholder(index, {
                                  label: e.target.value,
                                })
                              }
                              fullWidth
                              size='small'
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <FormControl fullWidth size='small'>
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={placeholder.type}
                                onChange={e =>
                                  updatePlaceholder(index, {
                                    type: e.target.value as any,
                                  })
                                }
                                label='Type'
                              >
                                {PLACEHOLDER_TYPES.map(type => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={placeholder.required}
                                  onChange={e =>
                                    updatePlaceholder(index, {
                                      required: e.target.checked,
                                    })
                                  }
                                />
                              }
                              label='Required'
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Button
                              color='error'
                              onClick={() => removePlaceholder(index)}
                              fullWidth
                              size='small'
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Compliance */}
            <Box>
              <Typography variant='subtitle2' mb={1}>
                Compliance
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.compliance?.foia || false}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        compliance: {
                          ...formData.compliance,
                          foia: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label='FOIA Compliant'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.compliance?.cpra || false}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        compliance: {
                          ...formData.compliance,
                          cpra: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label='CPRA Compliant'
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant='contained'>
            {editingTemplate ? 'Update' : 'Create'} Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            {previewTemplate?.baseTemplate}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
