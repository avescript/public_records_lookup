/**
 * AI Decision Transparency Component
 * Displays AI decision reasoning, confidence scores, and allows user feedback
 */

'use client';

import React, { useState } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Psychology as AIIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUp as ThumbUpIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';

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
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@/components/migration';
import {
  AIDecision,
  AIInsight,
  unifiedAIAssistant,
} from '@/services/unifiedAIAssistant';

interface AIDecisionTransparencyProps {
  decision: AIDecision;
  showFeedbackControls?: boolean;
  showDetailedReasoning?: boolean;
  onFeedbackSubmitted?: (
    feedback: 'positive' | 'negative' | 'corrected'
  ) => void;
}

export function AIDecisionTransparency({
  decision,
  showFeedbackControls = true,
  showDetailedReasoning = true,
  onFeedbackSubmitted,
}: AIDecisionTransparencyProps) {
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [correctionDialog, setCorrectionDialog] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const handlePositiveFeedback = async () => {
    await unifiedAIAssistant.processFeedback(decision.id, 'positive');
    setFeedbackSubmitted(true);
    onFeedbackSubmitted?.('positive');
  };

  const handleNegativeFeedback = () => {
    setFeedbackDialog(true);
  };

  const handleCorrection = () => {
    setCorrectionDialog(true);
  };

  const submitNegativeFeedback = async () => {
    await unifiedAIAssistant.processFeedback(decision.id, 'negative');
    setFeedbackDialog(false);
    setFeedbackSubmitted(true);
    onFeedbackSubmitted?.('negative');
  };

  const submitCorrection = async () => {
    await unifiedAIAssistant.processFeedback(decision.id, 'corrected', {
      correctionText,
      rating,
    });
    setCorrectionDialog(false);
    setFeedbackSubmitted(true);
    onFeedbackSubmitted?.('corrected');
  };

  return (
    <Card
      elevation={2}
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
      }}
    >
      <CardContent>
        {/* Decision Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AIIcon color='primary' sx={{ mr: 1 }} />
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            AI Decision:{' '}
            {decision.action
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {formatTimestamp(decision.timestamp)}
          </Typography>
        </Box>

        {/* Confidence Score */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant='body2' sx={{ mr: 1 }}>
              Confidence:
            </Typography>
            <Chip
              label={`${Math.round(decision.confidence * 100)}% - ${getConfidenceLabel(decision.confidence)}`}
              color={getConfidenceColor(decision.confidence) as any}
              size='small'
              icon={<TrendingUpIcon />}
            />
          </Box>
          <LinearProgress
            variant='determinate'
            value={decision.confidence * 100}
            color={getConfidenceColor(decision.confidence) as any}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Step Context */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Workflow Step: ${decision.step.charAt(0).toUpperCase() + decision.step.slice(1)}`}
            variant='outlined'
            size='small'
          />
        </Box>

        {/* Reasoning */}
        {showDetailedReasoning && decision.reasoning.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                <Typography variant='subtitle2'>
                  AI Reasoning ({decision.reasoning.length} factors)
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {decision.reasoning.map((reason, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color='primary' />
                    </ListItemIcon>
                    <ListItemText
                      primary={reason}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Context Data */}
        {Object.keys(decision.context).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Decision Context:
            </Typography>
            <Box sx={{ pl: 2 }}>
              {Object.entries(decision.context).map(([key, value]) => (
                <Typography
                  key={key}
                  variant='caption'
                  display='block'
                  color='text.secondary'
                >
                  {key}:{' '}
                  {typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Feedback Status */}
        {decision.userFeedback && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity={
                decision.userFeedback === 'positive'
                  ? 'success'
                  : decision.userFeedback === 'negative'
                    ? 'error'
                    : 'info'
              }
              icon={
                decision.userFeedback === 'positive' ? (
                  <ThumbUpIcon />
                ) : decision.userFeedback === 'negative' ? (
                  <ThumbDownIcon />
                ) : (
                  <EditIcon />
                )
              }
            >
              You provided {decision.userFeedback} feedback for this decision
            </Alert>
          </Box>
        )}

        {/* Feedback Controls */}
        {showFeedbackControls &&
          !decision.userFeedback &&
          !feedbackSubmitted && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Was this AI decision helpful?
              </Typography>
              <ButtonGroup size='small' variant='outlined'>
                <Button
                  startIcon={<ThumbUpIcon />}
                  onClick={handlePositiveFeedback}
                  color='success'
                >
                  Helpful
                </Button>
                <Button
                  startIcon={<ThumbDownIcon />}
                  onClick={handleNegativeFeedback}
                  color='error'
                >
                  Not Helpful
                </Button>
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleCorrection}
                  color='primary'
                >
                  Suggest Improvement
                </Button>
              </ButtonGroup>
            </Box>
          )}

        {feedbackSubmitted && (
          <Box sx={{ mt: 2 }}>
            <Alert severity='success'>
              Thank you for your feedback! This helps improve AI performance.
            </Alert>
          </Box>
        )}
      </CardContent>

      {/* Negative Feedback Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)}>
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2 }}>
            Please let us know what could be improved about this AI decision.
          </Typography>
          <Rating
            value={rating}
            onChange={(_, newValue) => setRating(newValue)}
            size='large'
          />
          <Typography variant='caption' color='text.secondary' sx={{ mt: 1 }}>
            Rate the overall quality of this decision (optional)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
          <Button onClick={submitNegativeFeedback} color='error'>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog
        open={correctionDialog}
        onClose={() => setCorrectionDialog(false)}
      >
        <DialogTitle>Suggest Improvement</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2 }}>
            Help us improve by suggesting what the AI should have done
            differently.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label='Your suggestion'
            value={correctionText}
            onChange={e => setCorrectionText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Rating
            value={rating}
            onChange={(_, newValue) => setRating(newValue)}
            size='large'
          />
          <Typography variant='caption' color='text.secondary'>
            Rate the overall quality (optional)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrectionDialog(false)}>Cancel</Button>
          <Button
            onClick={submitCorrection}
            color='primary'
            disabled={!correctionText.trim()}
          >
            Submit Suggestion
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
  onInsightDismiss?: (insightId: string) => void;
}

export function AIInsightsPanel({
  insights,
  onInsightDismiss,
}: AIInsightsPanelProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <WarningIcon />;
      case 'medium':
        return <InfoIcon />;
      case 'low':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant='body2' color='text.secondary' textAlign='center'>
            No AI insights available at this time.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {insights.map((insight, index) => (
        <Card key={index} variant='outlined'>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                {getPriorityIcon(insight.priority)}
                <Typography variant='subtitle2' sx={{ ml: 1, mr: 2 }}>
                  {insight.title}
                </Typography>
                <Chip
                  label={insight.priority.toUpperCase()}
                  color={getPriorityColor(insight.priority) as any}
                  size='small'
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={`${Math.round(insight.confidence * 100)}%`}
                  size='small'
                  variant='outlined'
                />
                {onInsightDismiss && (
                  <IconButton
                    size='small'
                    onClick={() => onInsightDismiss(`insight-${index}`)}
                    sx={{ ml: 1 }}
                    title='Dismiss'
                  >
                    ×
                  </IconButton>
                )}
              </Box>
            </Box>

            <Typography variant='body2' sx={{ mb: 2 }}>
              {insight.description}
            </Typography>

            {insight.relatedSteps.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {insight.relatedSteps.map((step, stepIndex) => (
                  <Chip
                    key={stepIndex}
                    label={step}
                    size='small'
                    variant='outlined'
                  />
                ))}
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Type:{' '}
                {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
              </Typography>
              {insight.actionable && (
                <Chip
                  label='Actionable'
                  size='small'
                  color='primary'
                  variant='outlined'
                />
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
