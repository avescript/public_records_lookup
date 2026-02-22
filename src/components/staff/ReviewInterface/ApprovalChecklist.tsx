/**
 * ApprovalChecklist - Multi-level approval system with compliance verification
 * Part of ReviewInterface - Step 4 of V2 Workflow
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Comment as CommentIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
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
  Checkbox,
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
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import {
  ApprovalChecklist as ApprovalChecklistType,
  ApprovalChecklistItem,
  ApprovalLevel,
  ApprovalRequest,
  ApprovalStatus,
  ReviewComparison,
} from '@/types/review';

interface ApprovalChecklistProps {
  comparison: ReviewComparison;
  approvalRequests: ApprovalRequest[];
  onDecision: (status: ApprovalStatus, comments?: string) => void;
  loading: boolean;
  canApprove: boolean;
}

interface ChecklistItemProps {
  item: ApprovalChecklistItem;
  onChange: (checked: boolean, comments?: string) => void;
  disabled?: boolean;
}

function ChecklistItemComponent({
  item,
  onChange,
  disabled,
}: ChecklistItemProps) {
  const [checked, setChecked] = useState(item.checked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(item.comments || '');

  const handleChange = (newChecked: boolean) => {
    setChecked(newChecked);
    onChange(newChecked, comments);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'legal':
        return <GavelIcon />;
      case 'content':
        return <DescriptionIcon />;
      case 'format':
        return <StarIcon />;
      case 'compliance':
        return <SecurityIcon />;
      case 'quality':
        return <AssignmentIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'legal':
        return 'error';
      case 'content':
        return 'primary';
      case 'format':
        return 'info';
      case 'compliance':
        return 'warning';
      case 'quality':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={e => handleChange(e.target.checked)}
              disabled={disabled}
              color='primary'
            />
          }
          label=''
          sx={{ m: 0 }}
        />

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {getCategoryIcon(item.category)}
            <Chip
              label={item.category.toUpperCase()}
              color={getCategoryColor(item.category)}
              size='small'
              variant='outlined'
            />
            {item.required && (
              <Chip
                label='REQUIRED'
                color='error'
                size='small'
                variant='filled'
              />
            )}
            <Typography variant='body2' color='text.secondary'>
              Weight: {item.weight}%
            </Typography>
          </Box>

          <Typography variant='body1' sx={{ mb: 1 }}>
            {item.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size='small'
              onClick={() => setShowComments(!showComments)}
              startIcon={<CommentIcon />}
            >
              {comments ? 'Edit Comments' : 'Add Comments'}
            </Button>
          </Box>

          <Collapse in={showComments}>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder='Add comments about this item...'
              size='small'
              sx={{ mt: 2 }}
              onBlur={() => onChange(checked, comments)}
            />
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
}

export function ApprovalChecklist({
  comparison,
  approvalRequests,
  onDecision,
  loading,
  canApprove,
}: ApprovalChecklistProps) {
  const [checklist, setChecklist] = useState<ApprovalChecklistType>({
    items: [
      {
        id: 'legal-compliance',
        category: 'legal',
        description: 'Response complies with FOIA/CPRA legal requirements',
        checked: false,
        required: true,
        weight: 25,
      },
      {
        id: 'content-accuracy',
        category: 'content',
        description: 'Response content is accurate and addresses the request',
        checked: false,
        required: true,
        weight: 20,
      },
      {
        id: 'redaction-appropriate',
        category: 'compliance',
        description: 'Redactions are appropriate and properly applied',
        checked: false,
        required: true,
        weight: 20,
      },
      {
        id: 'format-professional',
        category: 'format',
        description: 'Response format is professional and well-structured',
        checked: false,
        required: false,
        weight: 15,
      },
      {
        id: 'quality-standards',
        category: 'quality',
        description: 'Response meets agency quality standards',
        checked: false,
        required: false,
        weight: 10,
      },
      {
        id: 'timeline-compliance',
        category: 'compliance',
        description: 'Response delivered within required timeframe',
        checked: false,
        required: true,
        weight: 10,
      },
    ],
    overallScore: 0,
    passThreshold: 85,
  });

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedApprover, setSelectedApprover] =
    useState<ApprovalLevel>('supervisor');
  const [assignComments, setAssignComments] = useState('');

  // Calculate overall score
  useEffect(() => {
    const totalWeight = checklist.items.reduce(
      (sum, item) => sum + item.weight,
      0
    );
    const weightedScore = checklist.items.reduce((sum, item) => {
      return sum + (item.checked ? item.weight : 0);
    }, 0);

    const score =
      totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    setChecklist(prev => ({ ...prev, overallScore: score }));
  }, [checklist.items]);

  const handleChecklistItemChange = (
    itemId: string,
    checked: boolean,
    comments?: string
  ) => {
    setChecklist(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, checked, comments } : item
      ),
    }));
  };

  const handleAssignApprover = async () => {
    try {
      const response = await fetch('/api/approvals/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: comparison.request.id,
          approverLevel: selectedApprover,
          comments: assignComments,
        }),
      });

      if (response.ok) {
        setShowAssignDialog(false);
        setAssignComments('');
        // Refresh approval requests would happen in parent component
      }
    } catch (error) {
      console.error('Failed to assign approver:', error);
    }
  };

  const getApprovalLevelName = (level: ApprovalLevel) => {
    switch (level) {
      case 'staff':
        return 'Staff Reviewer';
      case 'supervisor':
        return 'Supervisor';
      case 'legal':
        return 'Legal Review';
      case 'department_head':
        return 'Department Head';
      default:
        return level;
    }
  };

  const getApprovalStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'needs_revision':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const requiredItemsCompleted = checklist.items
    .filter(item => item.required)
    .every(item => item.checked);

  const canProceed =
    checklist.overallScore >= checklist.passThreshold && requiredItemsCompleted;

  return (
    <Box>
      {/* Checklist Overview */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant='h6' component='h2'>
              Approval Checklist
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant='h4'
                color={canProceed ? 'success.main' : 'warning.main'}
              >
                {checklist.overallScore}%
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                (Pass: {checklist.passThreshold}%)
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant='determinate'
            value={checklist.overallScore}
            color={canProceed ? 'success' : 'warning'}
            sx={{ height: 8, borderRadius: 4, mb: 2 }}
          />

          {!canProceed && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              {!requiredItemsCompleted
                ? 'Please complete all required items before proceeding.'
                : `Score must be at least ${checklist.passThreshold}% to approve.`}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' component='h2' gutterBottom>
            Review Items
          </Typography>

          {checklist.items.map(item => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              onChange={(checked, comments) =>
                handleChecklistItemChange(item.id, checked, comments)
              }
              disabled={!canApprove}
            />
          ))}
        </CardContent>
      </Card>

      {/* Approval Chain */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant='h6' component='h2'>
              Approval Chain
            </Typography>
            {canApprove && (
              <Button
                variant='outlined'
                onClick={() => setShowAssignDialog(true)}
                startIcon={<PersonIcon />}
              >
                Assign Approver
              </Button>
            )}
          </Box>

          {approvalRequests.length === 0 ? (
            <Alert severity='info'>
              No approval requests have been created yet. Use the &ldquo;Assign
              Approver&rdquo; button to start the approval process.
            </Alert>
          ) : (
            <Timeline>
              {approvalRequests.map((approval, index) => (
                <TimelineItem key={approval.id}>
                  <TimelineSeparator>
                    <TimelineDot
                      color={getApprovalStatusColor(approval.status)}
                      variant={
                        approval.status === 'pending' ? 'outlined' : 'filled'
                      }
                    >
                      {approval.status === 'approved' ? (
                        <CheckCircleIcon />
                      ) : approval.status === 'rejected' ? (
                        <CancelIcon />
                      ) : approval.status === 'needs_revision' ? (
                        <WarningIcon />
                      ) : (
                        <ScheduleIcon />
                      )}
                    </TimelineDot>
                    {index < approvalRequests.length - 1 && (
                      <TimelineConnector />
                    )}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography variant='subtitle1'>
                          {getApprovalLevelName(approval.level)}
                        </Typography>
                        <Chip
                          label={approval.status
                            .replace('_', ' ')
                            .toUpperCase()}
                          color={getApprovalStatusColor(approval.status)}
                          size='small'
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon fontSize='small' />
                        </Avatar>
                        <Typography variant='body2'>
                          {approval.approverName}
                        </Typography>
                      </Box>

                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 1 }}
                      >
                        Submitted:{' '}
                        {format(
                          new Date(approval.submittedAt),
                          'MMM dd, yyyy \'at\' h:mm a'
                        )}
                        {approval.reviewedAt && (
                          <span>
                            {' • Reviewed: '}
                            {format(
                              new Date(approval.reviewedAt),
                              'MMM dd, yyyy \'at\' h:mm a'
                            )}
                          </span>
                        )}
                      </Typography>

                      {approval.comments && (
                        <Typography
                          variant='body2'
                          sx={{
                            p: 1,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            fontStyle: 'italic',
                          }}
                        >
                          {approval.comments}
                        </Typography>
                      )}

                      {approval.checklist && (
                        <Accordion sx={{ mt: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant='body2'>
                              Checklist Score: {approval.checklist.overallScore}
                              %
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {approval.checklist.items.map(item => (
                                <ListItem key={item.id}>
                                  <ListItemIcon>
                                    <Checkbox
                                      checked={item.checked}
                                      disabled
                                      size='small'
                                    />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={item.description}
                                    secondary={item.comments}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment Integration */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' component='h2' gutterBottom>
            Risk-Based Approval Requirements
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Alert
                severity={
                  comparison.riskAssessment.level === 'low'
                    ? 'success'
                    : comparison.riskAssessment.level === 'medium'
                      ? 'warning'
                      : 'error'
                }
                sx={{ mb: 2 }}
              >
                <Typography variant='subtitle2' gutterBottom>
                  Risk Level: {comparison.riskAssessment.level.toUpperCase()}
                </Typography>
                {comparison.riskAssessment.requiresLegalReview && (
                  <Typography variant='body2'>
                    ⚖️ Legal review required before approval
                  </Typography>
                )}
                {comparison.riskAssessment.requiresSupervisorApproval && (
                  <Typography variant='body2'>
                    👤 Supervisor approval required
                  </Typography>
                )}
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant='subtitle2' gutterBottom>
                  Recommended Approvers:
                </Typography>
                <List dense>
                  {comparison.riskAssessment.level === 'high' ||
                  comparison.riskAssessment.level === 'critical' ? (
                    <>
                      <ListItem>
                        <ListItemIcon>
                          <GavelIcon color='error' />
                        </ListItemIcon>
                        <ListItemText
                          primary='Legal Review'
                          secondary='Required for high-risk requests'
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon color='primary' />
                        </ListItemIcon>
                        <ListItemText
                          primary='Department Head'
                          secondary='Executive approval needed'
                        />
                      </ListItem>
                    </>
                  ) : comparison.riskAssessment.level === 'medium' ? (
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon color='warning' />
                      </ListItemIcon>
                      <ListItemText
                        primary='Supervisor'
                        secondary='Supervisor review recommended'
                      />
                    </ListItem>
                  ) : (
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color='success' />
                      </ListItemIcon>
                      <ListItemText
                        primary='Staff Review'
                        secondary='Standard staff approval sufficient'
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canApprove && (
        <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ alignSelf: 'center' }}
          >
            Complete the checklist and provide your approval decision.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              color='error'
              onClick={() => onDecision('rejected')}
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              variant='outlined'
              color='warning'
              onClick={() => onDecision('needs_revision')}
              disabled={loading}
            >
              Request Revision
            </Button>
            <Button
              variant='contained'
              color='success'
              onClick={() => onDecision('approved')}
              disabled={loading || !canProceed}
              startIcon={<CheckCircleIcon />}
            >
              Approve
            </Button>
          </Box>
        </Paper>
      )}

      {/* Assign Approver Dialog */}
      <Dialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Assign Additional Approver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
            <InputLabel>Approver Level</InputLabel>
            <Select
              value={selectedApprover}
              onChange={e =>
                setSelectedApprover(e.target.value as ApprovalLevel)
              }
              label='Approver Level'
            >
              <MenuItem value='supervisor'>Supervisor</MenuItem>
              <MenuItem value='legal'>Legal Review</MenuItem>
              <MenuItem value='department_head'>Department Head</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={assignComments}
            onChange={e => setAssignComments(e.target.value)}
            placeholder='Optional: Add comments about why this approval is needed...'
            label='Comments'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignApprover}
            variant='contained'
            startIcon={<SendIcon />}
          >
            Assign Approver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
