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

interface AssistantContext {
  requestId: string;
  totalRecords: number;
  highConfidenceCount: number;
  topDepartments: string[];
  topCategories: string[];
  currentQuery: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = useMemo<Message>(() => {
    const starterSuggestions = [
      'incident reports in the last 6 months',
      'records involving body camera retention',
      'transportation correspondence about traffic safety',
      'high confidence police evidence records',
    ];

    return {
      id: 'welcome',
      role: 'assistant',
      content:
        `AI assistant ready for request ${context.requestId}. ` +
        'I can refine natural-language queries, suggest search terms, and explain why matches rank highly. ' +
        `Current context: ${context.totalRecords} records, ${context.highConfidenceCount} high-confidence matches.`,
      timestamp: new Date(),
      suggestions: starterSuggestions,
    };
  }, [context.highConfidenceCount, context.requestId, context.totalRecords]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [open, messages.length, welcomeMessage]);

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

  const sendMessage = () => {
    const prompt = inputValue.trim();
    if (!prompt || isThinking) return;

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      },
    ]);
    setInputValue('');
    setIsThinking(true);

    window.setTimeout(() => {
      const response = generateContextAwareResponse(prompt, context);
      setMessages(prev => [...prev, response]);
      setIsThinking(false);
    }, 700);
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
