/**
 * Redaction Configuration Panel
 * US-V2-030: Enhanced AI Redaction System
 *
 * Comprehensive configuration interface for redaction settings including
 * sensitivity modes, legal exemptions, custom patterns, and templates.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as LegalIcon,
  Info as InfoIcon,
  Pattern as PatternIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
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
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@/components/migration';
import { useAgency } from '@/contexts/AgencyContext';
import {
  enhancedPIIEngine,
  LegalExemptionType,
  RedactionSensitivityMode,
  SensitivityModeConfig,
} from '@/services/enhancedPIIEngine';
import { PIIType } from '@/services/piiDetectionService';

export interface RedactionConfigurationSettings {
  sensitivityMode: RedactionSensitivityMode;
  customThreshold?: number;
  enabledPIITypes: PIIType[];
  legalExemptions: LegalExemptionType[];
  customPatterns: CustomRedactionPattern[];
  batchProcessingEnabled: boolean;
  autoSuggestionsEnabled: boolean;
  consistencyCheckEnabled: boolean;
  templateId?: string;
}

export interface CustomRedactionPattern {
  id: string;
  name: string;
  description: string;
  piiType: PIIType;
  pattern: string;
  isRegex: boolean;
  confidenceBoost: number;
  enabled: boolean;
  agencySpecific: boolean;
}

export interface RedactionTemplate {
  id: string;
  name: string;
  description: string;
  agencyId?: string;
  settings: RedactionConfigurationSettings;
  isDefault: boolean;
  createdAt: string;
  lastModified: string;
  usageCount: number;
}

interface RedactionConfigurationPanelProps {
  currentSettings?: RedactionConfigurationSettings;
  onSettingsChange: (settings: RedactionConfigurationSettings) => void;
  onSaveTemplate?: (
    template: Omit<
      RedactionTemplate,
      'id' | 'createdAt' | 'lastModified' | 'usageCount'
    >
  ) => void;
  onLoadTemplate?: (templateId: string) => void;
  availableTemplates?: RedactionTemplate[];
  className?: string;
}

const defaultSettings: RedactionConfigurationSettings = {
  sensitivityMode: RedactionSensitivityMode.STANDARD,
  enabledPIITypes: Object.values(PIIType),
  legalExemptions: [],
  customPatterns: [],
  batchProcessingEnabled: true,
  autoSuggestionsEnabled: true,
  consistencyCheckEnabled: true,
};

export const RedactionConfigurationPanel: React.FC<
  RedactionConfigurationPanelProps
> = ({
  currentSettings = defaultSettings,
  onSettingsChange,
  onSaveTemplate,
  onLoadTemplate,
  availableTemplates = [],
  className,
}) => {
  const { currentAgency } = useAgency();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] =
    useState<RedactionConfigurationSettings>(currentSettings);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showPatternBuilder, setShowPatternBuilder] = useState(false);
  const [newPattern, setNewPattern] = useState<Partial<CustomRedactionPattern>>(
    {}
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get available sensitivity configurations
  const sensitivityModes = enhancedPIIEngine.getAllSensitivityModes();

  // Handle settings change and validation
  const updateSettings = useCallback(
    (newSettings: Partial<RedactionConfigurationSettings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Validate settings
      const errors = validateSettings(updatedSettings);
      setValidationErrors(errors);

      if (errors.length === 0) {
        onSettingsChange(updatedSettings);
      }
    },
    [settings, onSettingsChange]
  );

  // Validate configuration settings
  const validateSettings = (
    settings: RedactionConfigurationSettings
  ): string[] => {
    const errors: string[] = [];

    if (settings.enabledPIITypes.length === 0) {
      errors.push('At least one PII type must be enabled');
    }

    if (
      settings.customThreshold &&
      (settings.customThreshold < 0 || settings.customThreshold > 100)
    ) {
      errors.push('Custom threshold must be between 0 and 100');
    }

    settings.customPatterns.forEach((pattern, index) => {
      if (!pattern.name.trim()) {
        errors.push(`Pattern ${index + 1} must have a name`);
      }
      if (!pattern.pattern.trim()) {
        errors.push(`Pattern ${index + 1} must have a pattern definition`);
      }
      if (pattern.isRegex) {
        try {
          new RegExp(pattern.pattern);
        } catch {
          errors.push(`Pattern ${index + 1} has invalid regex syntax`);
        }
      }
    });

    return errors;
  };

  // Handle sensitivity mode change
  const handleSensitivityModeChange = (mode: RedactionSensitivityMode) => {
    const config = enhancedPIIEngine.getSensitivityModeConfig(mode);
    updateSettings({
      sensitivityMode: mode,
      enabledPIITypes: config.piiTypesIncluded,
      customThreshold: config.confidenceThreshold,
      legalExemptions: config.legalExemptionsEnabled
        ? [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY]
        : [],
    });
  };

  // Handle custom pattern creation
  const handleCreatePattern = () => {
    if (!newPattern.name || !newPattern.pattern || !newPattern.piiType) return;

    const pattern: CustomRedactionPattern = {
      id: `custom_${Date.now()}`,
      name: newPattern.name,
      description: newPattern.description || '',
      piiType: newPattern.piiType,
      pattern: newPattern.pattern,
      isRegex: newPattern.isRegex || false,
      confidenceBoost: newPattern.confidenceBoost || 0,
      enabled: true,
      agencySpecific: currentAgency ? true : false,
    };

    updateSettings({
      customPatterns: [...settings.customPatterns, pattern],
    });

    setNewPattern({});
    setShowPatternBuilder(false);
  };

  // Handle pattern deletion
  const handleDeletePattern = (patternId: string) => {
    updateSettings({
      customPatterns: settings.customPatterns.filter(p => p.id !== patternId),
    });
  };

  // Handle template save
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const template: Omit<
      RedactionTemplate,
      'id' | 'createdAt' | 'lastModified' | 'usageCount'
    > = {
      name: templateName,
      description: templateDescription,
      agencyId: currentAgency?.id,
      settings: settings,
      isDefault: false,
    };

    onSaveTemplate?.(template);
    setSaveDialogOpen(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  // Tab content components
  const SensitivityModeTab = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Sensitivity Level Configuration
      </Typography>
      <Typography variant='body2' color='text.secondary' paragraph>
        Choose how strictly PII should be detected and redacted
      </Typography>

      <Grid container spacing={3}>
        {sensitivityModes.map(config => (
          <Grid item xs={12} md={4} key={config.mode}>
            <Card
              sx={{
                border: settings.sensitivityMode === config.mode ? 2 : 1,
                borderColor:
                  settings.sensitivityMode === config.mode
                    ? 'primary.main'
                    : 'divider',
                cursor: 'pointer',
              }}
              onClick={() => handleSensitivityModeChange(config.mode)}
            >
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  {config.mode.charAt(0).toUpperCase() + config.mode.slice(1)}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  {config.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant='caption' display='block'>
                    Confidence Threshold: {config.confidenceThreshold}%
                  </Typography>
                  <Typography variant='caption' display='block'>
                    PII Types: {config.piiTypesIncluded.length}
                  </Typography>
                  <Typography variant='caption' display='block'>
                    Legal Exemptions:{' '}
                    {config.legalExemptionsEnabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>

                {settings.sensitivityMode === config.mode && (
                  <CheckCircleIcon
                    color='primary'
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showAdvancedOptions}
              onChange={e => setShowAdvancedOptions(e.target.checked)}
            />
          }
          label='Show Advanced Options'
        />
      </Box>

      <Collapse in={showAdvancedOptions}>
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant='subtitle1' gutterBottom>
            Custom Threshold
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={settings.customThreshold || 60}
              onChange={(_, value) =>
                updateSettings({ customThreshold: value as number })
              }
              min={0}
              max={100}
              step={5}
              marks
              valueLabelDisplay='on'
              valueLabelFormat={value => `${value}%`}
            />
          </Box>

          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Override the default confidence threshold for the selected
            sensitivity mode
          </Typography>
        </Paper>
      </Collapse>
    </Box>
  );

  const PIITypesTab = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        PII Type Selection
      </Typography>
      <Typography variant='body2' color='text.secondary' paragraph>
        Choose which types of personally identifiable information to detect and
        redact
      </Typography>

      <Grid container spacing={2}>
        {Object.values(PIIType).map(piiType => (
          <Grid item xs={12} sm={6} md={4} key={piiType}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabledPIITypes.includes(piiType)}
                  onChange={e => {
                    const newTypes = e.target.checked
                      ? [...settings.enabledPIITypes, piiType]
                      : settings.enabledPIITypes.filter(t => t !== piiType);
                    updateSettings({ enabledPIITypes: newTypes });
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>
                    {piiType.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {getPIITypeDescription(piiType)}
                  </Typography>
                </Box>
              }
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          variant='outlined'
          onClick={() =>
            updateSettings({ enabledPIITypes: Object.values(PIIType) })
          }
          sx={{ mr: 1 }}
        >
          Select All
        </Button>
        <Button
          variant='outlined'
          onClick={() => updateSettings({ enabledPIITypes: [] })}
        >
          Clear All
        </Button>
      </Box>
    </Box>
  );

  const LegalExemptionsTab = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Legal Exemptions
      </Typography>
      <Typography variant='body2' color='text.secondary' paragraph>
        Select applicable legal exemptions that justify redaction decisions
      </Typography>

      <Grid container spacing={2}>
        {Object.values(LegalExemptionType).map(exemption => (
          <Grid item xs={12} md={6} key={exemption}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.legalExemptions.includes(exemption)}
                  onChange={e => {
                    const newExemptions = e.target.checked
                      ? [...settings.legalExemptions, exemption]
                      : settings.legalExemptions.filter(ex => ex !== exemption);
                    updateSettings({ legalExemptions: newExemptions });
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>
                    {formatExemptionName(exemption)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {getExemptionDescription(exemption)}
                  </Typography>
                </Box>
              }
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const CustomPatternsTab = () => (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='h6'>Custom Patterns</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setShowPatternBuilder(true)}
        >
          Add Pattern
        </Button>
      </Box>

      <Typography variant='body2' color='text.secondary' paragraph>
        Create custom patterns for agency-specific PII types or improve
        detection accuracy
      </Typography>

      {settings.customPatterns.length === 0 ? (
        <Alert severity='info'>
          No custom patterns defined. Click &quot;Add Pattern&quot; to create
          your first custom detection rule.
        </Alert>
      ) : (
        <List>
          {settings.customPatterns.map(pattern => (
            <ListItem key={pattern.id} divider>
              <ListItemText
                primary={pattern.name}
                secondary={
                  <Box>
                    <Typography variant='caption' display='block'>
                      Type: {pattern.piiType} | Pattern: {pattern.pattern}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {pattern.description}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title='Toggle Enable'>
                  <Switch
                    checked={pattern.enabled}
                    onChange={e => {
                      const updatedPatterns = settings.customPatterns.map(p =>
                        p.id === pattern.id
                          ? { ...p, enabled: e.target.checked }
                          : p
                      );
                      updateSettings({ customPatterns: updatedPatterns });
                    }}
                  />
                </Tooltip>
                <Tooltip title='Delete Pattern'>
                  <IconButton
                    onClick={() => handleDeletePattern(pattern.id)}
                    color='error'
                    size='small'
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Pattern Builder Dialog */}
      <Dialog
        open={showPatternBuilder}
        onClose={() => setShowPatternBuilder(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Create Custom Pattern</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Pattern Name'
                value={newPattern.name || ''}
                onChange={e =>
                  setNewPattern({ ...newPattern, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>PII Type</InputLabel>
                <Select
                  value={newPattern.piiType || ''}
                  onChange={e =>
                    setNewPattern({
                      ...newPattern,
                      piiType: e.target.value as PIIType,
                    })
                  }
                >
                  {Object.values(PIIType).map(type => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Description'
                value={newPattern.description || ''}
                onChange={e =>
                  setNewPattern({ ...newPattern, description: e.target.value })
                }
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label='Pattern'
                value={newPattern.pattern || ''}
                onChange={e =>
                  setNewPattern({ ...newPattern, pattern: e.target.value })
                }
                required
                helperText='Enter text pattern or regular expression'
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Confidence Boost'
                type='number'
                value={newPattern.confidenceBoost || 0}
                onChange={e =>
                  setNewPattern({
                    ...newPattern,
                    confidenceBoost: parseInt(e.target.value),
                  })
                }
                InputProps={{ inputProps: { min: -20, max: 20 } }}
                helperText='-20 to +20'
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newPattern.isRegex || false}
                    onChange={e =>
                      setNewPattern({
                        ...newPattern,
                        isRegex: e.target.checked,
                      })
                    }
                  />
                }
                label='Use as Regular Expression'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPatternBuilder(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePattern}
            variant='contained'
            disabled={
              !newPattern.name || !newPattern.pattern || !newPattern.piiType
            }
          >
            Create Pattern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const AdvancedOptionsTab = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Advanced Options
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom>
                Processing Options
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.batchProcessingEnabled}
                    onChange={e =>
                      updateSettings({
                        batchProcessingEnabled: e.target.checked,
                      })
                    }
                  />
                }
                label='Enable Batch Processing'
              />

              <Typography variant='body2' color='text.secondary' paragraph>
                Process multiple documents simultaneously
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSuggestionsEnabled}
                    onChange={e =>
                      updateSettings({
                        autoSuggestionsEnabled: e.target.checked,
                      })
                    }
                  />
                }
                label='Enable AI Suggestions'
              />

              <Typography variant='body2' color='text.secondary' paragraph>
                Show AI-powered redaction suggestions and improvements
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.consistencyCheckEnabled}
                    onChange={e =>
                      updateSettings({
                        consistencyCheckEnabled: e.target.checked,
                      })
                    }
                  />
                }
                label='Enable Consistency Checks'
              />

              <Typography variant='body2' color='text.secondary'>
                Automatically check for redaction inconsistencies
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom>
                Template Management
              </Typography>

              {availableTemplates.length > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Load Template</InputLabel>
                  <Select
                    value=''
                    onChange={e => onLoadTemplate?.(e.target.value)}
                  >
                    {availableTemplates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} {template.isDefault && '(Default)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                fullWidth
                variant='outlined'
                startIcon={<SaveIcon />}
                onClick={() => setSaveDialogOpen(true)}
                sx={{ mb: 1 }}
              >
                Save as Template
              </Button>

              <Button
                fullWidth
                variant='outlined'
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const dataStr = JSON.stringify(settings, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'redaction-config.json';
                  link.click();
                }}
              >
                Export Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Card className={className}>
      <CardHeader
        avatar={<SettingsIcon />}
        title='Redaction Configuration'
        subheader='Configure AI redaction settings and preferences'
        action={
          validationErrors.length > 0 && (
            <Tooltip title={validationErrors.join(', ')}>
              <WarningIcon color='warning' />
            </Tooltip>
          )
        }
      />

      <CardContent>
        {validationErrors.length > 0 && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Configuration Issues: {validationErrors.join(', ')}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TuneIcon />} label='Sensitivity' />
          <Tab icon={<SecurityIcon />} label='PII Types' />
          <Tab icon={<LegalIcon />} label='Legal Exemptions' />
          <Tab icon={<PatternIcon />} label='Custom Patterns' />
          <Tab icon={<SettingsIcon />} label='Advanced' />
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && <SensitivityModeTab />}
          {activeTab === 1 && <PIITypesTab />}
          {activeTab === 2 && <LegalExemptionsTab />}
          {activeTab === 3 && <CustomPatternsTab />}
          {activeTab === 4 && <AdvancedOptionsTab />}
        </Box>
      </CardContent>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Configuration Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Template Name'
            fullWidth
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin='dense'
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={templateDescription}
            onChange={e => setTemplateDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveTemplate}
            variant='contained'
            disabled={!templateName.trim()}
          >
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

// Helper functions
const getPIITypeDescription = (piiType: PIIType): string => {
  const descriptions: Record<PIIType, string> = {
    [PIIType.SSN]: 'Social Security Numbers',
    [PIIType.PHONE]: 'Phone numbers and contact info',
    [PIIType.ADDRESS]: 'Physical and mailing addresses',
    [PIIType.PERSON_NAME]: 'Personal names and identities',
    [PIIType.EMAIL]: 'Email addresses',
    [PIIType.DOB]: 'Dates of birth',
    [PIIType.DRIVERS_LICENSE]: 'Driver license numbers',
    [PIIType.ACCOUNT_NUMBER]: 'Bank and financial account numbers',
    [PIIType.ROUTING_NUMBER]: 'Bank routing numbers',
    [PIIType.MEDICAL_ID]: 'Medical record identifiers',
    [PIIType.BADGE_NUMBER]: 'Employee badge numbers',
    [PIIType.CASE_NUMBER]: 'Case reference numbers',
    [PIIType.INCIDENT_NUMBER]: 'Incident report numbers',
    [PIIType.VEHICLE_ID]: 'Vehicle identification numbers',
    [PIIType.CONFIDENTIAL_SOURCE]: 'Confidential informant references',
  };
  return descriptions[piiType] || 'Unknown PII type';
};

const formatExemptionName = (exemption: LegalExemptionType): string => {
  return exemption
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Foia/g, 'FOIA')
    .replace(/Hipaa/g, 'HIPAA')
    .replace(/Ferpa/g, 'FERPA');
};

const getExemptionDescription = (exemption: LegalExemptionType): string => {
  const descriptions: Record<LegalExemptionType, string> = {
    [LegalExemptionType.FOIA_B1_NATIONAL_SECURITY]:
      'National security information',
    [LegalExemptionType.FOIA_B2_INTERNAL_RULES]:
      'Internal personnel rules and practices',
    [LegalExemptionType.FOIA_B3_STATUTORY_PROHIBITION]:
      'Information prohibited by statute',
    [LegalExemptionType.FOIA_B4_TRADE_SECRETS]:
      'Trade secrets and commercial information',
    [LegalExemptionType.FOIA_B5_DELIBERATIVE_PROCESS]:
      'Deliberative process privilege',
    [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY]:
      'Personal privacy protection',
    [LegalExemptionType.FOIA_B7_LAW_ENFORCEMENT]: 'Law enforcement records',
    [LegalExemptionType.FOIA_B8_FINANCIAL_INSTITUTIONS]:
      'Financial institution records',
    [LegalExemptionType.FOIA_B9_GEOLOGICAL_INFORMATION]:
      'Geological and geophysical information',
    [LegalExemptionType.STATE_PRIVACY_ACT]: 'State privacy act protection',
    [LegalExemptionType.HIPAA_HEALTH_INFORMATION]: 'Health information privacy',
    [LegalExemptionType.FERPA_EDUCATION_RECORDS]: 'Educational record privacy',
    [LegalExemptionType.LAW_ENFORCEMENT_SENSITIVE]:
      'Law enforcement sensitive information',
    [LegalExemptionType.ONGOING_INVESTIGATION]:
      'Active investigation protection',
    [LegalExemptionType.CONFIDENTIAL_SOURCE]: 'Confidential source protection',
  };
  return descriptions[exemption] || 'Legal exemption';
};

export default RedactionConfigurationPanel;
