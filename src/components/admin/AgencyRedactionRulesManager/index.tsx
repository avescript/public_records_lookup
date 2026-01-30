/**
 * Agency Redaction Rules Manager Component
 * Epic 9 Task 4: Agency-Specific Redaction Rules
 *
 * UI component for managing and configuring agency-specific redaction rules
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  AutoMode as AutoModeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
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
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAgency } from '../../../contexts/AgencyContext';
import { agencyRedactionRulesService } from '../../../services/agencyRedactionRulesService';
import {
  AgencyRedactionTemplate,
  RedactionRule,
  SensitivityLevel,
} from '../../../services/agencyTypes';
import { PIIType } from '../../../services/piiDetectionService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`agency-rules-tabpanel-${index}`}
      aria-labelledby={`agency-rules-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AgencyRedactionRulesManager: React.FC = () => {
  const { currentAgency } = useAgency();
  const [template, setTemplate] = useState<AgencyRedactionTemplate | null>(
    null
  );
  const [allTemplates, setAllTemplates] = useState<AgencyRedactionTemplate[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RedactionRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState<Partial<RedactionRule>>({});
  const [stats, setStats] = useState<any>(null);

  // Load agency template and statistics
  const loadAgencyData = useCallback(async () => {
    if (!currentAgency?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [agencyTemplate, templates, agencyStats] = await Promise.all([
        agencyRedactionRulesService.getAgencyTemplate(currentAgency.id),
        agencyRedactionRulesService.getAllTemplates(),
        agencyRedactionRulesService.getAgencyRulesSummary(currentAgency.id),
      ]);

      setTemplate(agencyTemplate);
      setAllTemplates(templates);
      setStats(agencyStats);
    } catch (error) {
      console.error('Failed to load agency redaction data:', error);
      setError('Failed to load redaction rules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentAgency?.id]);

  useEffect(() => {
    loadAgencyData();
  }, [loadAgencyData]);

  // Handle rule creation/editing
  const handleSaveRule = async () => {
    if (
      !currentAgency?.id ||
      !ruleFormData.id ||
      !ruleFormData.name ||
      !ruleFormData.piiTypes
    ) {
      return;
    }

    try {
      const rule: RedactionRule = {
        id: ruleFormData.id,
        name: ruleFormData.name,
        description: ruleFormData.description || '',
        piiTypes: ruleFormData.piiTypes,
        sensitivityLevel:
          ruleFormData.sensitivityLevel || SensitivityLevel.MEDIUM,
        autoApply: ruleFormData.autoApply || false,
        requiresApproval: ruleFormData.requiresApproval || false,
        retentionPeriod: ruleFormData.retentionPeriod,
      };

      // Validate rule
      const validation = agencyRedactionRulesService.validateRuleForAgency(
        currentAgency.id,
        rule
      );
      if (!validation.isValid) {
        setError(`Rule validation failed: ${validation.issues.join(', ')}`);
        return;
      }

      const success = await agencyRedactionRulesService.addRuleToAgency(
        currentAgency.id,
        rule
      );
      if (success) {
        setOpenRuleDialog(false);
        setEditingRule(null);
        setRuleFormData({});
        await loadAgencyData();
      } else {
        setError('Failed to save rule. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
      setError('Failed to save rule. Please try again.');
    }
  };

  // Handle rule deletion
  const handleDeleteRule = async (ruleId: string) => {
    if (!currentAgency?.id) return;

    try {
      const success = await agencyRedactionRulesService.removeRuleFromAgency(
        currentAgency.id,
        ruleId
      );
      if (success) {
        await loadAgencyData();
      } else {
        setError('Failed to delete rule. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
      setError('Failed to delete rule. Please try again.');
    }
  };

  // Open rule dialog for editing
  const handleEditRule = (rule: RedactionRule) => {
    setEditingRule(rule);
    setRuleFormData(rule);
    setOpenRuleDialog(true);
  };

  // Open rule dialog for creating new rule
  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleFormData({
      id: `rule_${Date.now()}`,
      sensitivityLevel: SensitivityLevel.MEDIUM,
      autoApply: false,
      requiresApproval: false,
      piiTypes: [],
    });
    setOpenRuleDialog(true);
  };

  // Get sensitivity level color
  const getSensitivityColor = (level: SensitivityLevel): string => {
    switch (level) {
      case SensitivityLevel.LOW:
        return '#4caf50';
      case SensitivityLevel.MEDIUM:
        return '#ff9800';
      case SensitivityLevel.HIGH:
        return '#f44336';
      case SensitivityLevel.CRITICAL:
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <Typography>Loading agency redaction rules...</Typography>
      </Box>
    );
  }

  if (!currentAgency) {
    return (
      <Alert severity='warning'>
        Please select an agency to manage redaction rules.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display='flex' alignItems='center' justifyContent='between' mb={3}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Redaction Rules Configuration
          </Typography>
          <Typography variant='subtitle1' color='textSecondary'>
            {currentAgency.name} - Manage agency-specific redaction rules and
            templates
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleCreateRule}
          sx={{ ml: 2 }}
        >
          Add Rule
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
          >
            <Tab
              label='Current Rules'
              icon={<GavelIcon />}
              iconPosition='start'
            />
            <Tab
              label='Statistics'
              icon={<AssessmentIcon />}
              iconPosition='start'
            />
            <Tab
              label='Templates'
              icon={<SecurityIcon />}
              iconPosition='start'
            />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {template?.rules && template.rules.length > 0 ? (
            <Grid container spacing={3}>
              {template.rules.map(rule => (
                <Grid item xs={12} key={rule.id}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        alignItems='start'
                        mb={2}
                      >
                        <Box>
                          <Typography variant='h6' gutterBottom>
                            {rule.name}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='textSecondary'
                            mb={2}
                          >
                            {rule.description}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton
                            onClick={() => handleEditRule(rule)}
                            size='small'
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteRule(rule.id)}
                            size='small'
                            color='error'
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box display='flex' flexWrap='wrap' gap={1} mb={2}>
                        <Chip
                          label={rule.sensitivityLevel.toUpperCase()}
                          size='small'
                          sx={{
                            backgroundColor: getSensitivityColor(
                              rule.sensitivityLevel
                            ),
                            color: 'white',
                          }}
                        />
                        {rule.autoApply && (
                          <Chip
                            icon={<AutoModeIcon />}
                            label='Auto-Apply'
                            size='small'
                            color='primary'
                          />
                        )}
                        {rule.requiresApproval && (
                          <Chip
                            icon={<WarningIcon />}
                            label='Requires Approval'
                            size='small'
                            color='warning'
                          />
                        )}
                      </Box>

                      <Box>
                        <Typography variant='subtitle2' gutterBottom>
                          PII Types Protected:
                        </Typography>
                        <Box display='flex' flexWrap='wrap' gap={1}>
                          {rule.piiTypes.map(piiType => (
                            <Chip
                              key={piiType}
                              label={piiType.replace('_', ' ')}
                              size='small'
                              variant='outlined'
                            />
                          ))}
                        </Box>
                      </Box>

                      {rule.retentionPeriod && (
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          mt={1}
                        >
                          Retention Period: {rule.retentionPeriod} days
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity='info'>
              No redaction rules configured for this agency. Click "Add Rule" to
              create your first rule.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {stats ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Rule Summary
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary='Total Rules'
                          secondary={stats.totalRules}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary='Auto-Apply Rules'
                          secondary={stats.autoApplyRules}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary='Approval Required Rules'
                          secondary={stats.approvalRequiredRules}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      By Sensitivity Level
                    </Typography>
                    <List>
                      {Object.entries(stats.bySensitivity).map(
                        ([level, count]) => (
                          <ListItem key={level}>
                            <ListItemText
                              primary={
                                <Box display='flex' alignItems='center' gap={1}>
                                  <Chip
                                    label={level.toUpperCase()}
                                    size='small'
                                    sx={{
                                      backgroundColor: getSensitivityColor(
                                        level as SensitivityLevel
                                      ),
                                      color: 'white',
                                    }}
                                  />
                                  <span>{count} rules</span>
                                </Box>
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      PII Types Coverage
                    </Typography>
                    <Box display='flex' flexWrap='wrap' gap={1}>
                      {Object.entries(stats.byPIIType)
                        .filter(([, count]) => count > 0)
                        .map(([piiType, count]) => (
                          <Tooltip
                            key={piiType}
                            title={`${count} rules protect this type`}
                          >
                            <Chip
                              label={`${piiType.replace('_', ' ')} (${count})`}
                              variant='outlined'
                            />
                          </Tooltip>
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity='info'>
              No statistics available for this agency.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant='h6' gutterBottom>
            Available Agency Templates
          </Typography>
          <Grid container spacing={2}>
            {allTemplates.map(tmpl => (
              <Grid item xs={12} md={6} key={tmpl.id}>
                <Card
                  variant={
                    tmpl.agencyId === currentAgency?.id
                      ? 'elevation'
                      : 'outlined'
                  }
                  sx={{
                    border: tmpl.agencyId === currentAgency?.id ? 2 : 1,
                    borderColor:
                      tmpl.agencyId === currentAgency?.id
                        ? 'primary.main'
                        : 'grey.300',
                  }}
                >
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      {tmpl.agencyName}
                    </Typography>
                    <Typography variant='body2' color='textSecondary' mb={2}>
                      {tmpl.description}
                    </Typography>
                    <Typography variant='body2' mb={1}>
                      Rules: {tmpl.rules.length}
                    </Typography>
                    <Typography variant='body2' mb={1}>
                      Version: {tmpl.version}
                    </Typography>
                    <Typography variant='body2'>
                      Updated: {new Date(tmpl.updatedAt).toLocaleDateString()}
                    </Typography>
                    {tmpl.agencyId === currentAgency?.id && (
                      <Chip
                        label='Current Agency'
                        color='primary'
                        size='small'
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Rule Create/Edit Dialog */}
      <Dialog
        open={openRuleDialog}
        onClose={() => setOpenRuleDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingRule ? 'Edit Redaction Rule' : 'Create New Redaction Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Rule Name'
                  value={ruleFormData.name || ''}
                  onChange={e =>
                    setRuleFormData({ ...ruleFormData, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Rule ID'
                  value={ruleFormData.id || ''}
                  onChange={e =>
                    setRuleFormData({ ...ruleFormData, id: e.target.value })
                  }
                  disabled={!!editingRule}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Description'
                  value={ruleFormData.description || ''}
                  onChange={e =>
                    setRuleFormData({
                      ...ruleFormData,
                      description: e.target.value,
                    })
                  }
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sensitivity Level</InputLabel>
                  <Select
                    value={
                      ruleFormData.sensitivityLevel || SensitivityLevel.MEDIUM
                    }
                    onChange={e =>
                      setRuleFormData({
                        ...ruleFormData,
                        sensitivityLevel: e.target.value as SensitivityLevel,
                      })
                    }
                    label='Sensitivity Level'
                  >
                    {Object.values(SensitivityLevel).map(level => (
                      <MenuItem key={level} value={level}>
                        {level.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Retention Period (days)'
                  type='number'
                  value={ruleFormData.retentionPeriod || ''}
                  onChange={e =>
                    setRuleFormData({
                      ...ruleFormData,
                      retentionPeriod: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>PII Types</InputLabel>
                  <Select
                    multiple
                    value={ruleFormData.piiTypes || []}
                    onChange={e =>
                      setRuleFormData({
                        ...ruleFormData,
                        piiTypes: e.target.value as PIIType[],
                      })
                    }
                    label='PII Types'
                    renderValue={selected => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as PIIType[]).map(value => (
                          <Chip
                            key={value}
                            label={value.replace('_', ' ')}
                            size='small'
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {Object.values(PIIType).map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={ruleFormData.autoApply || false}
                      onChange={e =>
                        setRuleFormData({
                          ...ruleFormData,
                          autoApply: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Auto-Apply Rule'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={ruleFormData.requiresApproval || false}
                      onChange={e =>
                        setRuleFormData({
                          ...ruleFormData,
                          requiresApproval: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Requires Approval'
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRuleDialog(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveRule}>
            {editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgencyRedactionRulesManager;
