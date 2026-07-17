'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';

import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@/components/migration';
import { aiChatService } from '@/services/aiChatService';

interface AssistantContext {
  requestId: string;
  totalRecords: number;
  highConfidenceCount: number;
  topDepartments: string[];
  topCategories: string[];
  currentQuery: string;
  topMatches: {
    id: string;
    title: string;
    relevanceScore: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    matchedTerms: string[];
  }[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface LocateChatAssistantProps {
  open: boolean;
  onClose: () => void;
  context: AssistantContext;
  onApplyQuery: (query: string) => void;
}

export function LocateChatAssistant({
  open,
  onClose,
  context,
  onApplyQuery,
}: LocateChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialContextSummary = useMemo(() => {
    const starterSuggestions = [
      'incident reports in the last 6 months',
      'records involving body camera retention',
      'transportation correspondence about traffic safety',
      'high confidence police evidence records',
    ];

    return {
      starterSuggestions,
      summary:
        `Request ${context.requestId}. ` +
        `${context.totalRecords} records in scope, ${context.highConfidenceCount} high-confidence matches. ` +
        `Current query: ${context.currentQuery || 'none'}.`,
    };
  }, [context.highConfidenceCount, context.requestId, context.totalRecords]);

  useEffect(() => {
    if (!open || conversationId) return;

    let isMounted = true;

    const initializeConversation = async () => {
      try {
        const conversation = await aiChatService.startConversation(
          context.requestId,
          initialContextSummary.summary
        );

        if (!isMounted) return;

        setConversationId(conversation.id);
        const history = aiChatService.getConversationHistory(conversation.id);

        const mappedHistory = history.map(message => ({
          id: message.id,
          role: message.type,
          content: message.content,
          timestamp: new Date(message.timestamp),
          suggestions: message.suggestions?.map(suggestion => suggestion.query),
        }));

        setMessages([
          ...mappedHistory,
          {
            id: `local-welcome-${Date.now()}`,
            role: 'assistant',
            content:
              'I can also summarize current match coverage and explain ranking logic from this Locate session.',
            timestamp: new Date(),
            suggestions: initialContextSummary.starterSuggestions,
          },
        ]);
      } catch {
        if (!isMounted) return;
        setMessages([
          {
            id: `fallback-welcome-${Date.now()}`,
            role: 'assistant',
            content:
              'I am available for query refinements and search summaries. Ask for a summary, explanation, or suggested query.',
            timestamp: new Date(),
            suggestions: initialContextSummary.starterSuggestions,
          },
        ]);
      }
    };

    void initializeConversation();

    return () => {
      isMounted = false;
    };
  }, [conversationId, context.requestId, initialContextSummary, open]);

  useEffect(() => {
    if (!open && conversationId) {
      aiChatService.endConversation(conversationId);
    }
  }, [conversationId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const applySuggestion = (query: string) => {
    onApplyQuery(query);
    setMessages(prev => [
      ...prev,
      {
        id: `apply-${Date.now()}`,
        role: 'assistant',
        content: `Applied query: "${query}". I can refine this further by date, department, or content type.`,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async () => {
    const prompt = inputValue.trim();
    if (!prompt || isThinking || !conversationId) return;

    setInputValue('');
    setIsThinking(true);

    try {
      const response = await aiChatService.sendMessage(
        conversationId,
        prompt,
        true
      );
      const history = aiChatService.getConversationHistory(conversationId);

      const mappedHistory: Message[] = history.map(message => ({
        id: message.id,
        role: message.type,
        content: message.content,
        timestamp: new Date(message.timestamp),
        suggestions: message.suggestions?.map(suggestion => suggestion.query),
      }));

      const extraMessages: Message[] = [];

      if (isSummaryPrompt(prompt)) {
        extraMessages.push(generateSummaryAndReasoningMessage(context));
      } else if (response.searchPerformed) {
        extraMessages.push(
          generateSearchReasoningMessage(context, prompt, response.searchCount)
        );
      }

      setMessages([...mappedHistory, ...extraMessages]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            'I had trouble processing that request. Try rephrasing, or ask for a summary of the current matches.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 430 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon />
            <Typography variant='h6'>AI Search Assistant</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'primary.contrastText' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='caption' color='text.secondary'>
            Active query: {context.currentQuery || 'None'}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'block' }}
          >
            Top departments: {context.topDepartments.join(', ') || 'n/a'}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'block' }}
          >
            Top categories: {context.topCategories.join(', ') || 'n/a'}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.map(message => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent:
                  message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '88%',
                  bgcolor:
                    message.role === 'user'
                      ? 'primary.main'
                      : 'background.paper',
                  color:
                    message.role === 'user'
                      ? 'primary.contrastText'
                      : 'text.primary',
                }}
              >
                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                {message.suggestions && message.suggestions.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.75,
                    }}
                  >
                    {message.suggestions.map(suggestion => (
                      <Chip
                        key={`${message.id}-${suggestion}`}
                        label={suggestion}
                        onClick={() => applySuggestion(suggestion)}
                        size='small'
                        sx={{ cursor: 'pointer', justifyContent: 'flex-start' }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          ))}

          {isThinking && (
            <Paper sx={{ p: 1.5, width: 'fit-content' }}>
              <Typography variant='body2' color='text.secondary'>
                Thinking...
              </Typography>
            </Paper>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size='sm'
            placeholder='Ask for query refinements, filters, or summaries...'
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            variant='contained'
            disabled={!inputValue.trim() || isThinking}
            onClick={sendMessage}
          >
            <SendIcon fontSize='small' />
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

function generateContextAwareResponse(
  prompt: string,
  context: AssistantContext
): Message {
  const lower = prompt.toLowerCase();

  if (lower.includes('summary') || lower.includes('summarize')) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date(),
      content:
        'Search summary:\n' +
        `- Total records: ${context.totalRecords}\n` +
        `- High confidence: ${context.highConfidenceCount}\n` +
        `- Most represented departments: ${context.topDepartments.join(', ') || 'n/a'}\n` +
        `- Most represented categories: ${context.topCategories.join(', ') || 'n/a'}`,
      suggestions: [
        'high confidence records only',
        `${context.topDepartments[0] || 'police'} records in the last 90 days`,
      ],
    };
  }

  if (
    lower.includes('date') ||
    lower.includes('month') ||
    lower.includes('year')
  ) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date(),
      content:
        'Try date-focused natural-language queries to narrow noisy matches. For example, combine a topic with a time window.',
      suggestions: [
        'incident reports from the last 6 months',
        'policy correspondence created in 2024',
        'body camera records from january to march',
      ],
    };
  }

  if (
    lower.includes('department') ||
    lower.includes('police') ||
    lower.includes('transportation')
  ) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date(),
      content:
        'Department-focused searches work best when combined with a content term (incident, retention, citation, footage).',
      suggestions: [
        `${context.topDepartments[0] || 'police'} incident evidence records`,
        `${context.topDepartments[1] || 'transportation'} traffic correspondence`,
      ],
    };
  }

  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    timestamp: new Date(),
    content:
      'I interpreted your request as a query refinement need. I can propose narrower terms, time windows, and category filters that improve relevance ranking.',
    suggestions: [
      `${prompt} high confidence`,
      `${prompt} in ${context.topCategories[0] || 'evidence'} category`,
      `${prompt} ${context.topDepartments[0] || 'police'} department`,
    ],
  };
}

function isSummaryPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    lower.includes('summary') ||
    lower.includes('summarize') ||
    lower.includes('reasoning') ||
    lower.includes('why') ||
    lower.includes('explain')
  );
}

function generateSummaryAndReasoningMessage(
  context: AssistantContext
): Message {
  const topTwo = context.topMatches.slice(0, 2);
  const topLines = topTwo
    .map(
      match =>
        `- ${match.title} (${match.relevanceScore}% / ${match.confidenceLevel})`
    )
    .join('\n');

  const reasoning = topTwo
    .map(match => {
      const terms =
        match.matchedTerms.slice(0, 3).join(', ') || 'semantic overlap';
      return `${match.id}: ranked high due to matched terms (${terms}) and metadata relevance.`;
    })
    .join('\n');

  return {
    id: `assistant-summary-${Date.now()}`,
    role: 'assistant',
    timestamp: new Date(),
    content:
      'Current locate summary:\n' +
      `- Records scanned: ${context.totalRecords}\n` +
      `- High-confidence matches: ${context.highConfidenceCount}\n` +
      `- Active query: ${context.currentQuery || 'none'}\n\n` +
      `Top matches:\n${topLines || '- No top matches available'}\n\n` +
      `Reasoning snapshot:\n${reasoning || '- Not enough ranking data to explain.'}`,
    suggestions: [
      'high confidence records only',
      `${context.topDepartments[0] || 'police'} records in the last 90 days`,
    ],
  };
}

function generateSearchReasoningMessage(
  context: AssistantContext,
  prompt: string,
  searchCount: number
): Message {
  const topMatch = context.topMatches[0];

  return {
    id: `assistant-reasoning-${Date.now()}`,
    role: 'assistant',
    timestamp: new Date(),
    content:
      `Reasoning for "${prompt}": returned ${searchCount} service-level results. ` +
      `In this locate set, top candidate is ${topMatch?.title || 'n/a'} ` +
      `with ${topMatch?.relevanceScore ?? 0}% relevance and ${topMatch?.confidenceLevel || 'unknown'} confidence.`,
    suggestions: [
      `${prompt} high confidence`,
      `${prompt} ${context.topCategories[0] || 'evidence'} category`,
    ],
  };
}
