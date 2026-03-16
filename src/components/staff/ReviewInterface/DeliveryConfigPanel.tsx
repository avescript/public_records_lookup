/**
 * DeliveryConfigPanel - Multi-format export and delivery configuration
 * Part of ReviewInterface - Step 4 of V2 Workflow
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Description as DocIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  PictureAsPdf as PdfIcon,
  Preview as PreviewIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addDays, format, isAfter, isWeekend } from 'date-fns';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@/components/migration';
import {
  DeliveryConfiguration,
  DeliveryMethod,
  DeliveryRecipient,
  DocumentFormat,
  ReviewComparison,
} from '@/types/review';

interface DeliveryConfigPanelProps {
  requestId: string;
  comparison: ReviewComparison;
  config: DeliveryConfiguration | null;
  onChange: (config: DeliveryConfiguration) => void;
  onSend: () => void;
  onExport: (format: DocumentFormat) => void;
  loading: boolean;
  canSend: boolean;
  canExport: boolean;
}

const deliveryMethods: {
  value: DeliveryMethod;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'email',
    label: 'Email',
    icon: <EmailIcon />,
    description: "Send response directly to requester's email",
  },
  {
    value: 'portal',
    label: 'Online Portal',
    icon: <SecurityIcon />,
    description: 'Upload to secure online portal for pickup',
  },
  {
    value: 'mail',
    label: 'US Mail',
    icon: <SendIcon />,
    description: 'Send physical copy via postal mail',
  },
  {
    value: 'pickup',
    label: 'In-Person Pickup',
    icon: <PersonIcon />,
    description: 'Available for pickup at agency location',
  },
];

const documentFormats: {
  value: DocumentFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'pdf',
    label: 'PDF',
    icon: <PdfIcon />,
    description: 'Professional PDF document (recommended)',
  },
  {
    value: 'docx',
    label: 'Word Document',
    icon: <DocIcon />,
    description: 'Microsoft Word format (.docx)',
  },
  {
    value: 'html',
    label: 'HTML',
    icon: <PreviewIcon />,
    description: 'Web page format for online viewing',
  },
  {
    value: 'txt',
    label: 'Plain Text',
    icon: <DescriptionIcon />,
    description: 'Simple text format',
  },
];

export function DeliveryConfigPanel({
  requestId,
  comparison,
  config,
  onChange,
  onSend,
  onExport,
  loading,
  canSend,
  canExport,
}: DeliveryConfigPanelProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [newRecipient, setNewRecipient] = useState<Partial<DeliveryRecipient>>({
    name: '',
    email: '',
    phone: '',
    isPrimary: false,
  });
  const [previewDialog, setPreviewDialog] = useState(false);

  // Initialize default configuration
  useEffect(() => {
    if (!config && comparison?.request) {
      const defaultConfig: DeliveryConfiguration = {
        method: 'email',
        format: 'pdf',
        scheduledDate: getNextBusinessDay(),
        recipients: [
          {
            id: '1',
            name: comparison.request.requesterName,
            email: comparison.request.requesterEmail,
            isPrimary: true,
          },
        ],
        includeAttachments: true,
        requireSignature: false,
        trackDelivery: true,
        customMessage: '',
      };
      onChange(defaultConfig);
    }
  }, [comparison, config, onChange]);

  const getNextBusinessDay = (): Date => {
    let nextDay = addDays(new Date(), 1);
    while (isWeekend(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    return nextDay;
  };

  const handleConfigChange = (updates: Partial<DeliveryConfiguration>) => {
    if (config) {
      onChange({ ...config, ...updates });
    }
  };

  const handleAddRecipient = () => {
    if (newRecipient.name && newRecipient.email && config) {
      const recipient: DeliveryRecipient = {
        id: Date.now().toString(),
        name: newRecipient.name!,
        email: newRecipient.email!,
        phone: newRecipient.phone,
        isPrimary: newRecipient.isPrimary || false,
      };

      // If this is marked as primary, unmark others
      const updatedRecipients = newRecipient.isPrimary
        ? config.recipients
            .map(r => ({ ...r, isPrimary: false }))
            .concat(recipient)
        : config.recipients.concat(recipient);

      handleConfigChange({ recipients: updatedRecipients });
      setNewRecipient({ name: '', email: '', phone: '', isPrimary: false });
      setShowRecipientDialog(false);
    }
  };

  const handleRemoveRecipient = (recipientId: string) => {
    if (config) {
      const updatedRecipients = config.recipients.filter(
        r => r.id !== recipientId
      );
      handleConfigChange({ recipients: updatedRecipients });
    }
  };

  const validateConfiguration = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config) {
      errors.push('Configuration is required');
      return { isValid: false, errors };
    }

    if (config.recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (!config.recipients.some(r => r.isPrimary)) {
      errors.push('One recipient must be marked as primary');
    }

    if (config.method === 'email') {
      const emailRecipients = config.recipients.filter(r => r.email);
      if (emailRecipients.length === 0) {
        errors.push('Email addresses are required for email delivery');
      }
    }

    if (config.method === 'mail') {
      const mailRecipients = config.recipients.filter(r => r.address);
      if (mailRecipients.length === 0) {
        errors.push('Mailing addresses are required for postal delivery');
      }
    }

    if (config.scheduledDate && !isAfter(config.scheduledDate, new Date())) {
      errors.push('Scheduled date must be in the future');
    }

    return { isValid: errors.length === 0, errors };
  };

  const { isValid, errors } = validateConfiguration();

  const getDeliveryEstimate = (): string => {
    if (!config) return '';

    switch (config.method) {
      case 'email':
        return 'Immediate delivery';
      case 'portal':
        return 'Available immediately after processing';
      case 'mail':
        return '3-5 business days';
      case 'pickup':
        return 'Available next business day';
      default:
        return '';
    }
  };

  const steps = [
    'Choose Delivery Method',
    'Select Format & Recipients',
    'Schedule & Options',
    'Review & Send',
  ];

  if (!config) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <Typography>Loading delivery configuration...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Stepper */}
        <Paper sx={{ mb: 3, p: 2 }}>
          <Stepper activeStep={activeStep} orientation='horizontal'>
            {steps.map((label, index) => (
              <Step key={label} completed={index < activeStep}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {/* Step 1: Delivery Method */}
          {activeStep === 0 && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Choose Delivery Method
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 3 }}
                >
                  Select how you want to deliver the response to the requester.
                </Typography>

                <Grid container spacing={2}>
                  {deliveryMethods.map(method => (
                    <Grid item xs={12} sm={6} key={method.value}>
                      <Paper
                        elevation={config.method === method.value ? 3 : 1}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: config.method === method.value ? 2 : 1,
                          borderColor:
                            config.method === method.value
                              ? 'primary.main'
                              : 'divider',
                          '&:hover': { elevation: 2 },
                        }}
                        onClick={() =>
                          handleConfigChange({ method: method.value })
                        }
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          {method.icon}
                          <Typography variant='h6' sx={{ ml: 1 }}>
                            {method.label}
                          </Typography>
                          {config.method === method.value && (
                            <CheckCircleIcon
                              color='primary'
                              sx={{ ml: 'auto' }}
                            />
                          )}
                        </Box>
                        <Typography variant='body2' color='text.secondary'>
                          {method.description}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{ mt: 1, fontWeight: 'bold' }}
                        >
                          Estimate:{' '}
                          {method.value === config.method
                            ? getDeliveryEstimate()
                            : ''}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}
                >
                  <Button
                    variant='contained'
                    onClick={() => setActiveStep(1)}
                    disabled={!config.method}
                  >
                    Next
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Format & Recipients */}
          {activeStep === 1 && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Document Format & Recipients
                </Typography>

                {/* Document Format Selection */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant='subtitle1' gutterBottom>
                    Document Format
                  </Typography>
                  <Grid container spacing={2}>
                    {documentFormats.map(format => (
                      <Grid item xs={12} sm={6} md={3} key={format.value}>
                        <Paper
                          elevation={config.format === format.value ? 3 : 1}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            textAlign: 'center',
                            border: config.format === format.value ? 2 : 1,
                            borderColor:
                              config.format === format.value
                                ? 'primary.main'
                                : 'divider',
                          }}
                          onClick={() =>
                            handleConfigChange({ format: format.value })
                          }
                        >
                          {format.icon}
                          <Typography variant='subtitle2' sx={{ mt: 1 }}>
                            {format.label}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {format.description}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Recipients */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant='subtitle1'>
                      Recipients ({config.recipients.length})
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setShowRecipientDialog(true)}
                    >
                      Add Recipient
                    </Button>
                  </Box>

                  <List>
                    {config.recipients.map(recipient => (
                      <ListItem key={recipient.id} divider>
                        <ListItemIcon>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {recipient.name}
                              {recipient.isPrimary && (
                                <Chip
                                  label='PRIMARY'
                                  color='primary'
                                  size='small'
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              {recipient.email && (
                                <Typography variant='body2'>
                                  📧 {recipient.email}
                                </Typography>
                              )}
                              {recipient.phone && (
                                <Typography variant='body2'>
                                  📱 {recipient.phone}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => handleRemoveRecipient(recipient.id)}
                            disabled={config.recipients.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 3,
                  }}
                >
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                  <Button
                    variant='contained'
                    onClick={() => setActiveStep(2)}
                    disabled={!config.format || config.recipients.length === 0}
                  >
                    Next
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Schedule & Options */}
          {activeStep === 2 && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Delivery Options
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label='Scheduled Delivery'
                      value={config.scheduledDate}
                      onChange={date =>
                        handleConfigChange({ scheduledDate: date || undefined })
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: 'Leave blank for immediate delivery',
                        },
                      }}
                      minDateTime={new Date()}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Alert severity='info' sx={{ height: 'fit-content' }}>
                      <Typography variant='body2'>
                        Delivery estimate: {getDeliveryEstimate()}
                      </Typography>
                    </Alert>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.includeAttachments}
                          onChange={e =>
                            handleConfigChange({
                              includeAttachments: e.target.checked,
                            })
                          }
                        />
                      }
                      label='Include original attachments'
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.requireSignature}
                          onChange={e =>
                            handleConfigChange({
                              requireSignature: e.target.checked,
                            })
                          }
                        />
                      }
                      label='Require delivery signature'
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.trackDelivery}
                          onChange={e =>
                            handleConfigChange({
                              trackDelivery: e.target.checked,
                            })
                          }
                        />
                      }
                      label='Enable delivery tracking'
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label='Custom Message (Optional)'
                      value={config.customMessage || ''}
                      onChange={e =>
                        handleConfigChange({ customMessage: e.target.value })
                      }
                      placeholder='Add a personal message to include with the response...'
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 3,
                  }}
                >
                  <Button onClick={() => setActiveStep(1)}>Back</Button>
                  <Button variant='contained' onClick={() => setActiveStep(3)}>
                    Review
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Send */}
          {activeStep === 3 && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Review & Send
                </Typography>

                {/* Configuration Summary */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='subtitle1'>
                      Delivery Configuration
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Method
                        </Typography>
                        <Typography variant='body1'>
                          {
                            deliveryMethods.find(m => m.value === config.method)
                              ?.label
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Format
                        </Typography>
                        <Typography variant='body1'>
                          {
                            documentFormats.find(f => f.value === config.format)
                              ?.label
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Recipients
                        </Typography>
                        <Typography variant='body1'>
                          {config.recipients.length} recipient(s)
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          Scheduled
                        </Typography>
                        <Typography variant='body1'>
                          {config.scheduledDate
                            ? format(
                                config.scheduledDate,
                                "MMM dd, yyyy 'at' h:mm a"
                              )
                            : 'Immediate'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Validation Results */}
                {errors.length > 0 && (
                  <Alert severity='error' sx={{ mt: 2 }}>
                    <Typography variant='subtitle2' gutterBottom>
                      Please fix the following issues:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {errors.map((error, index) => (
                        <li key={index}>
                          <Typography variant='body2'>{error}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}

                {/* Final Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 3,
                  }}
                >
                  <Box>
                    <Button onClick={() => setActiveStep(2)} sx={{ mr: 2 }}>
                      Back
                    </Button>
                    <Button
                      startIcon={<PreviewIcon />}
                      onClick={() => setPreviewDialog(true)}
                    >
                      Preview
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {canExport && (
                      <Button
                        variant='outlined'
                        startIcon={<DownloadIcon />}
                        onClick={() => onExport(config.format)}
                        disabled={loading || !isValid}
                      >
                        Export Only
                      </Button>
                    )}
                    {canSend && (
                      <Button
                        variant='contained'
                        startIcon={<SendIcon />}
                        onClick={onSend}
                        disabled={loading || !isValid}
                        color='success'
                      >
                        Send Response
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Add Recipient Dialog */}
        <Dialog
          open={showRecipientDialog}
          onClose={() => setShowRecipientDialog(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Add Recipient</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Name'
                  value={newRecipient.name || ''}
                  onChange={e =>
                    setNewRecipient({ ...newRecipient, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  value={newRecipient.email || ''}
                  onChange={e =>
                    setNewRecipient({ ...newRecipient, email: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Phone (Optional)'
                  value={newRecipient.phone || ''}
                  onChange={e =>
                    setNewRecipient({ ...newRecipient, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newRecipient.isPrimary || false}
                      onChange={e =>
                        setNewRecipient({
                          ...newRecipient,
                          isPrimary: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Primary Recipient'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRecipientDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRecipient}
              variant='contained'
              disabled={!newRecipient.name || !newRecipient.email}
            >
              Add Recipient
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialog}
          onClose={() => setPreviewDialog(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>Delivery Preview</DialogTitle>
          <DialogContent>
            <Typography variant='body1' sx={{ mb: 2 }}>
              This is how your response will be delivered:
            </Typography>
            {/* Preview content would go here */}
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant='h6'>Response Preview</Typography>
              <Typography variant='body2' color='text.secondary'>
                Format: {config.format.toUpperCase()} • Method: {config.method}
              </Typography>
              {/* Response content preview would be rendered here */}
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
