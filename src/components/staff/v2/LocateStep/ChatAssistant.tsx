'use client';

import React, { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@/components/migration';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedQueries?: string[];
}

interface ChatAssistantProps {
  open: boolean;
  onClose: () => void;
  requestDescription: string;
  onApplyQuery: (query: string) => void;
}

/**
 * AI Chat Assistant for conversational search refinement
 * US-V2-021: AI Chatbot Search Assistant
 */
export function ChatAssistant({
  open,
  onClose,
  requestDescription,
  onApplyQuery,
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your AI search assistant. I can help you refine your search queries to find the most relevant records for this request: "${requestDescription}"\n\nWhat specific information are you looking for?`,
        timestamp: new Date(),
        suggestedQueries: [
          'Show me all police reports from the last 6 months',
          'Find incident reports involving specific officers',
          'Search for traffic citations on Highway 99',
          'Locate use of force records',
        ],
      };
      setMessages([welcomeMessage]);
    }
  }, [open, requestDescription]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (in production, this would call OpenAI/Vertex AI)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue, requestDescription);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplySuggestion = (query: string) => {
    onApplyQuery(query);
    const confirmMessage: Message = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: `Great! I've applied the search query: "${query}". The results should be updated now. Let me know if you need to refine the search further.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 420 },
          p: 0,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
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
          <IconButton
            onClick={onClose}
            size='small'
            sx={{ color: 'primary.contrastText' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'background.default',
          }}
        >
          {messages.map(message => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems:
                  message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '85%',
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
                <Typography
                  variant='body2'
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {message.content}
                </Typography>

                {/* Suggested Queries */}
                {message.suggestedQueries && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant='caption' sx={{ fontWeight: 600 }}>
                      Suggested Searches:
                    </Typography>
                    {message.suggestedQueries.map((query, index) => (
                      <Chip
                        key={index}
                        label={query}
                        onClick={() => handleApplySuggestion(query)}
                        size='small'
                        sx={{
                          cursor: 'pointer',
                          justifyContent: 'flex-start',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}

                <Typography
                  variant='caption'
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                    fontSize: '0.65rem',
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant='body2' color='text.secondary'>
                  AI is thinking...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Ask me about finding specific records...'
              disabled={isLoading}
              variant='outlined'
              size='sm'
            />
            <Button
              variant='contained'
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              sx={{ minWidth: 48, px: 2 }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

/**
 * Generate AI response based on user query
 * In production, this would call OpenAI/Vertex AI API
 */
function generateAIResponse(userQuery: string, requestContext: string): Message {
  const lowerQuery = userQuery.toLowerCase();

  // Context-aware response generation
  let content = '';
  let suggestedQueries: string[] = [];

  if (
    lowerQuery.includes('police') ||
    lowerQuery.includes('officer') ||
    lowerQuery.includes('arrest')
  ) {
    content =
      'I can help you search for police-related records. Based on your request, I recommend focusing on incident reports, arrest records, and officer documentation. Would you like to narrow down by date range or specific incident types?';
    suggestedQueries = [
      'police reports from 2025 involving use of force',
      'arrest records for case number 2025-4387',
      'officer training records for de-escalation',
      'body camera footage logs from July 2025',
    ];
  } else if (
    lowerQuery.includes('traffic') ||
    lowerQuery.includes('citation') ||
    lowerQuery.includes('violation')
  ) {
    content =
      'I can help you find traffic-related records. This includes citations, violations, and traffic stops. Would you like to filter by location, date, or violation type?';
    suggestedQueries = [
      'traffic citations on Highway 99 in August 2025',
      'speeding violations between Main and Oak',
      'DUI arrests in the past 12 months',
      'accident reports at specific intersections',
    ];
  } else if (
    lowerQuery.includes('when') ||
    lowerQuery.includes('date') ||
    lowerQuery.includes('time')
  ) {
    content =
      'I can help you search by date ranges. What specific timeframe are you interested in? You can search by exact dates, month ranges, or relative periods like "last 6 months".';
    suggestedQueries = [
      'records from January 2025 to March 2025',
      'incidents in the last 90 days',
      'documents created after June 1, 2025',
      'all records from 2024',
    ];
  } else if (
    lowerQuery.includes('type') ||
    lowerQuery.includes('kind') ||
    lowerQuery.includes('category')
  ) {
    content =
      'I can help you filter by document type. Common types include incident reports, case files, training records, citations, and administrative documents. Which type would you like to focus on?';
    suggestedQueries = [
      'incident reports with high priority',
      'case files with evidence logs',
      'training and certification records',
      'administrative review documents',
    ];
  } else if (lowerQuery.includes('help') || lowerQuery.includes('how')) {
    content =
      'I can assist you with:\n\n• Refining search queries for better results\n• Suggesting relevant record types and filters\n• Explaining search results and relevance scores\n• Finding records by date, department, or content\n\nWhat would you like help with?';
    suggestedQueries = [
      'Show me the most recent records',
      'Find high-priority documents only',
      'Search by specific department',
      'Explain confidence scores',
    ];
  } else {
    content = `I understand you're looking for: "${userQuery}"\n\nBased on the request context "${requestContext}", I'll help you find the most relevant records. Here are some refined search queries you can try:`;
    suggestedQueries = [
      `${userQuery} in the last 6 months`,
      `${userQuery} with high relevance score`,
      `detailed ${userQuery} reports`,
      `${userQuery} by department`,
    ];
  }

  return {
    id: `ai-${Date.now()}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
    suggestedQueries,
  };
}
