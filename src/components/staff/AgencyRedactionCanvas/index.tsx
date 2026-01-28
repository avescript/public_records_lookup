/**
 * Agency-Aware Redaction Canvas
 * Epic 9 Task 4: Agency-Specific Redaction Rules
 * 
 * Enhanced RedactionCanvas with agency-specific rule integration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useAgency } from '../../../contexts/AgencyContext';
import { useAuth } from '../../../contexts/AuthContext';
import { redactionService, ManualRedaction } from '../../../services/redactionService';
import { 
  agencyRedactionRulesService,
} from '../../../services/agencyRedactionRulesService';
import {
  RedactionRule,
  SensitivityLevel,
} from '../../../services/agencyTypes';
import { piiDetectionService, PIIFinding, PIIType } from '../../../services/piiDetectionService';

interface AgencyRedactionCanvasProps {
  documentId: string;
  imageUrl: string;
  width: number;
  height: number;
  onRedactionChange?: (redactions: ManualRedaction[]) => void;
  readOnly?: boolean;
}

interface PendingAutoRedaction {
  id: string;
  rule: RedactionRule;
  findings: PIIFinding[];
  redactions: ManualRedaction[];
  requiresApproval: boolean;
}

export const AgencyRedactionCanvas: React.FC<AgencyRedactionCanvasProps> = ({
  documentId,
  imageUrl,
  width,
  height,
  onRedactionChange,
  readOnly = false,
}) => {
  const { currentAgency } = useAgency();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [redactions, setRedactions] = useState<ManualRedaction[]>([]);
  const [agencyRules, setAgencyRules] = useState<RedactionRule[]>([]);
  const [piiFindings, setPiiFindings] = useState<PIIFinding[]>([]);
  const [pendingAutoRedactions, setPendingAutoRedactions] = useState<PendingAutoRedaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);
  const [showRulePreview, setShowRulePreview] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RedactionRule | null>(null);
  const [notification, setNotification] = useState<{open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error'}>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRedaction, setCurrentRedaction] = useState<Partial<ManualRedaction> | null>(null);

  // Load agency rules and existing redactions
  const loadAgencyData = useCallback(async () => {
    if (!currentAgency?.id) return;

    try {
      setLoading(true);
      
      const [agencyTemplate, existingRedactions, detectedPII] = await Promise.all([
        agencyRedactionRulesService.getAgencyTemplate(currentAgency.id),
        redactionService.getRedactionsForDocument(documentId),
        piiDetectionService.detectPII(documentId, 'document') // Analyze document for PII
      ]);

      setAgencyRules(agencyTemplate?.rules || []);
      setRedactions(existingRedactions);
      setPiiFindings(detectedPII);

      // Auto-apply rules if enabled
      if (autoApplyEnabled && agencyTemplate?.rules) {
        await applyAutoRedactionRules(agencyTemplate.rules, detectedPII);
      }
    } catch (error) {
      console.error('Failed to load agency redaction data:', error);
      showNotification('Failed to load agency redaction rules', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentAgency?.id, documentId, autoApplyEnabled]);

  useEffect(() => {
    loadAgencyData();
  }, [loadAgencyData]);

  // Apply auto-redaction rules
  const applyAutoRedactionRules = useCallback(async (rules: RedactionRule[], findings: PIIFinding[]) => {
    const autoApplyRules = rules.filter(rule => rule.autoApply);
    const newPendingRedactions: PendingAutoRedaction[] = [];

    for (const rule of autoApplyRules) {
      const applicableFindings = findings.filter(finding => 
        rule.piiTypes.includes(finding.type as PIIType)
      );

      if (applicableFindings.length > 0) {
        const ruleRedactions: ManualRedaction[] = applicableFindings.map(finding => ({
          id: `auto_${rule.id}_${finding.id}`,
          x: finding.location?.x || 0,
          y: finding.location?.y || 0,
          width: finding.location?.width || 100,
          height: finding.location?.height || 20,
          reason: `Auto-applied: ${rule.name}`,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'system',
          agencyRuleId: rule.id,
          agencyId: currentAgency?.id,
          approvalStatus: rule.requiresApproval ? 'PENDING' : 'APPROVED',
          sensitivityLevel: rule.sensitivityLevel,
        }));

        newPendingRedactions.push({
          id: `pending_${rule.id}`,
          rule,
          findings: applicableFindings,
          redactions: ruleRedactions,
          requiresApproval: rule.requiresApproval,
        });
      }
    }

    setPendingAutoRedactions(newPendingRedactions);

    // Auto-approve non-approval-required redactions
    const autoApprovedRedactions = newPendingRedactions
      .filter(pending => !pending.requiresApproval)
      .flatMap(pending => pending.redactions);

    if (autoApprovedRedactions.length > 0) {
      setRedactions(prev => [...prev, ...autoApprovedRedactions]);
      showNotification(
        `Applied ${autoApprovedRedactions.length} automatic redaction${autoApprovedRedactions.length !== 1 ? 's' : ''}`,
        'success'
      );
    }

    // Show notification for approval-required redactions
    const approvalRequiredCount = newPendingRedactions
      .filter(pending => pending.requiresApproval)
      .reduce((sum, pending) => sum + pending.redactions.length, 0);

    if (approvalRequiredCount > 0) {
      showNotification(
        `${approvalRequiredCount} redaction${approvalRequiredCount !== 1 ? 's' : ''} require${approvalRequiredCount === 1 ? 's' : ''} approval`,
        'warning'
      );
    }
  }, [currentAgency?.id, user?.uid]);

  // Apply pending auto-redactions
  const applyPendingRedactions = async (pendingId: string, approved: boolean) => {
    const pending = pendingAutoRedactions.find(p => p.id === pendingId);
    if (!pending) return;

    if (approved) {
      const approvedRedactions = pending.redactions.map(redaction => ({
        ...redaction,
        approvalStatus: 'APPROVED' as const,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.uid,
      }));

      setRedactions(prev => [...prev, ...approvedRedactions]);
      showNotification(`Applied ${approvedRedactions.length} redactions from ${pending.rule.name}`, 'success');
    } else {
      showNotification(`Rejected ${pending.redactions.length} redactions from ${pending.rule.name}`, 'info');
    }

    setPendingAutoRedactions(prev => prev.filter(p => p.id !== pendingId));
  };

  // Canvas drawing handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly || !currentAgency) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentRedaction({
      x,
      y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || readOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const newRedaction = {
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width: Math.abs(currentX - startPos.x),
      height: Math.abs(currentY - startPos.y),
    };

    setCurrentRedaction(newRedaction);
    drawCanvas();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRedaction || !currentAgency) return;

    if (currentRedaction.width && currentRedaction.height && 
        currentRedaction.width > 10 && currentRedaction.height > 10) {
      
      const newRedaction: ManualRedaction = {
        id: `manual_${Date.now()}`,
        x: currentRedaction.x!,
        y: currentRedaction.y!,
        width: currentRedaction.width!,
        height: currentRedaction.height!,
        reason: 'Manual redaction',
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'unknown',
        agencyId: currentAgency.id,
        approvalStatus: 'APPROVED', // Manual redactions are typically pre-approved
      };

      setRedactions(prev => [...prev, newRedaction]);
      onRedactionChange?.([...redactions, newRedaction]);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentRedaction(null);
    drawCanvas();
  };

  // Draw canvas with redactions
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing redactions
    redactions.forEach(redaction => {
      ctx.fillStyle = redaction.approvalStatus === 'PENDING' 
        ? 'rgba(255, 193, 7, 0.7)' 
        : 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
      
      // Add border for pending redactions
      if (redaction.approvalStatus === 'PENDING') {
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2;
        ctx.strokeRect(redaction.x, redaction.y, redaction.width, redaction.height);
      }
    });

    // Draw pending auto-redactions
    pendingAutoRedactions.forEach(pending => {
      pending.redactions.forEach(redaction => {
        ctx.fillStyle = 'rgba(33, 150, 243, 0.5)';
        ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2;
        ctx.strokeRect(redaction.x, redaction.y, redaction.width, redaction.height);
      });
    });

    // Draw current redaction being drawn
    if (currentRedaction && currentRedaction.width && currentRedaction.height) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
      ctx.fillRect(currentRedaction.x!, currentRedaction.y!, currentRedaction.width!, currentRedaction.height!);
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2;
      ctx.strokeRect(currentRedaction.x!, currentRedaction.y!, currentRedaction.width!, currentRedaction.height!);
    }
  }, [redactions, pendingAutoRedactions, currentRedaction]);

  // Redraw canvas when redactions change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Show notification
  const showNotification = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  // Get sensitivity level color
  const getSensitivityColor = (level: SensitivityLevel): string => {
    switch (level) {
      case SensitivityLevel.LOW: return '#4caf50';
      case SensitivityLevel.MEDIUM: return '#ff9800';
      case SensitivityLevel.HIGH: return '#f44336';
      case SensitivityLevel.CRITICAL: return '#9c27b0';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading agency redaction rules...</Typography>
      </Box>
    );
  }

  if (!currentAgency) {
    return (
      <Alert severity="warning">
        Please select an agency to enable agency-specific redaction features.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Agency Rules Control Panel */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Agency Redaction Rules - {currentAgency.name}
          </Typography>
          <Box display="flex" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoApplyEnabled}
                  onChange={(e) => setAutoApplyEnabled(e.target.checked)}
                />
              }
              label="Auto-apply rules"
            />
            <Button
              startIcon={<PreviewIcon />}
              onClick={() => setShowRulePreview(true)}
              variant="outlined"
              size="small"
            >
              Preview Rules
            </Button>
          </Box>
        </Box>

        {agencyRules.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {agencyRules.map(rule => (
              <Chip
                key={rule.id}
                label={rule.name}
                size="small"
                sx={{
                  backgroundColor: getSensitivityColor(rule.sensitivityLevel),
                  color: 'white',
                }}
                icon={rule.autoApply ? <AutoAwesomeIcon /> : <SecurityIcon />}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Pending Auto-Redactions */}
      {pendingAutoRedactions.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Pending Auto-Redactions
          </Typography>
          {pendingAutoRedactions.map(pending => (
            <Box key={pending.id} sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="subtitle1">{pending.rule.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {pending.redactions.length} redaction{pending.redactions.length !== 1 ? 's' : ''} found
                    {pending.requiresApproval && ' (requires approval)'}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  {pending.requiresApproval ? (
                    <>
                      <Button
                        size="small"
                        color="success"
                        onClick={() => applyPendingRedactions(pending.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => applyPendingRedactions(pending.id, false)}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => applyPendingRedactions(pending.id, true)}
                    >
                      Apply
                    </Button>
                  )}
                </Box>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip
                  label={pending.rule.sensitivityLevel.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: getSensitivityColor(pending.rule.sensitivityLevel),
                    color: 'white',
                  }}
                />
                {pending.requiresApproval && (
                  <Chip
                    icon={<WarningIcon />}
                    label="Requires Approval"
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Redaction Canvas */}
      <Paper sx={{ p: 2, position: 'relative' }}>
        <Box position="relative" display="inline-block">
          <img 
            src={imageUrl} 
            alt="Document"
            style={{ 
              width: width,
              height: height,
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: readOnly ? 'default' : 'crosshair',
              maxWidth: '100%',
              height: 'auto',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </Box>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="textSecondary">
            {redactions.length} redaction{redactions.length !== 1 ? 's' : ''} applied
            {pendingAutoRedactions.length > 0 && ` • ${pendingAutoRedactions.length} pending auto-redaction${pendingAutoRedactions.length !== 1 ? 's' : ''}`}
          </Typography>
          {!readOnly && (
            <Typography variant="body2" color="textSecondary">
              Click and drag to create manual redactions
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Rule Preview Dialog */}
      <Dialog open={showRulePreview} onClose={() => setShowRulePreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agency Redaction Rules Preview</DialogTitle>
        <DialogContent>
          <List>
            {agencyRules.map(rule => (
              <ListItem key={rule.id}>
                <ListItemIcon>
                  {rule.autoApply ? <AutoAwesomeIcon /> : <SecurityIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={rule.name}
                  secondary={
                    <Box>
                      <Typography variant="body2">{rule.description}</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        <Chip
                          label={rule.sensitivityLevel.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: getSensitivityColor(rule.sensitivityLevel),
                            color: 'white',
                          }}
                        />
                        {rule.autoApply && (
                          <Chip label="Auto-Apply" size="small" color="primary" />
                        )}
                        {rule.requiresApproval && (
                          <Chip label="Requires Approval" size="small" color="warning" />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRulePreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          severity={notification.severity} 
          onClose={() => setNotification({ ...notification, open: false })}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgencyRedactionCanvas;