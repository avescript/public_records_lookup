import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  FileDownload as ExportIcon,
  MoreVert as MoreIcon,
  Person as UserIcon,
  Search as SearchIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUp as ThumbUpIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { aiChatService } from '../../services/aiChatService';
import {
  ChatConversation,
  ChatMessage,
  ChatResponse,
  ChatUIState,
  SearchSuggestion,
} from '../../types/chat';
import { EnhancedMatchCandidate } from '../../types/enhanced-search';

interface AISearchChatProps {
  requestId: string;
  initialContext?: string;
  onSearchResultsSelected?: (results: EnhancedMatchCandidate[]) => void;
  onClose?: () => void;
  maxHeight?: number;
  fullScreen?: boolean;
}

export const AISearchChat: React.FC<AISearchChatProps> = ({
  requestId,
  initialContext,
  onSearchResultsSelected,
  onClose,
  maxHeight = 600,
  fullScreen = false,
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Chat state
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  );
  const [currentMessage, setCurrentMessage] = useState('');
  const [uiState, setUiState] = useState<ChatUIState>({
    isLoading: false,
    isTyping: false,
    error: null,
    conversationId: null,
    showSuggestions: true,
    expandedResults: new Set(),
  });

  // UI state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set()
  );
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Initialize conversation
  useEffect(() => {
    const initChat = async () => {
      setUiState(prev => ({ ...prev, isLoading: true }));
      try {
        const newConversation = await aiChatService.startConversation(
          requestId,
          initialContext
        );
        setConversation(newConversation);
        setUiState(prev => ({
          ...prev,
          conversationId: newConversation.id,
          isLoading: false,
        }));
      } catch (error) {
        setUiState(prev => ({
          ...prev,
          error: 'Failed to start conversation',
          isLoading: false,
        }));
      }
    };

    initChat();
  }, [requestId, initialContext]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, scrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !conversation || uiState.isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setUiState(prev => ({
      ...prev,
      isLoading: true,
      isTyping: true,
      error: null,
    }));

    try {
      const response: ChatResponse = await aiChatService.sendMessage(
        conversation.id,
        userMessage,
        true
      );

      // Update conversation with new messages
      const updatedConversation = aiChatService.getConversation(
        conversation.id
      );
      if (updatedConversation) {
        setConversation(updatedConversation);
      }

      // Update suggestions
      setSuggestions(response.suggestions);

      // Notify parent of search results
      if (
        response.searchPerformed &&
        response.message.searchResults &&
        onSearchResultsSelected
      ) {
        onSearchResultsSelected(response.message.searchResults);
      }
    } catch (error) {
      setUiState(prev => ({
        ...prev,
        error: 'Failed to send message',
      }));
    } finally {
      setUiState(prev => ({
        ...prev,
        isLoading: false,
        isTyping: false,
      }));
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setCurrentMessage(suggestion.query);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle message expansion
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Clear conversation
  const handleClearConversation = async () => {
    if (!conversation) return;

    try {
      await aiChatService.clearConversation(conversation.id);
      const newConversation = await aiChatService.startConversation(
        requestId,
        initialContext
      );
      setConversation(newConversation);
      setSuggestions([]);
      setExpandedMessages(new Set());
      setUiState(prev => ({
        ...prev,
        conversationId: newConversation.id,
        error: null,
      }));
    } catch (error) {
      setUiState(prev => ({
        ...prev,
        error: 'Failed to clear conversation',
      }));
    }
  };

  // Export conversation
  const handleExportConversation = () => {
    if (!conversation) return;

    const exportContent = aiChatService.exportConversation(conversation.id);
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-conversation-${requestId}-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  // Copy message
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Message component
  const MessageComponent: React.FC<{ message: ChatMessage }> = ({
    message,
  }) => {
    const isUser = message.type === 'user';
    const isExpanded = expandedMessages.has(message.id);
    const hasSearchResults =
      message.searchResults && message.searchResults.length > 0;

    return (
      <ListItem
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          py: 1,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            maxWidth: '80%',
            width: 'auto',
          }}
        >
          {!isUser && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
              }}
            >
              <BotIcon fontSize='small' />
            </Avatar>
          )}

          <Paper
            elevation={1}
            sx={{
              p: 2,
              bgcolor: isUser
                ? theme.palette.primary.main
                : theme.palette.grey[100],
              color: isUser
                ? theme.palette.primary.contrastText
                : theme.palette.text.primary,
              borderRadius: isUser
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              position: 'relative',
            }}
          >
            <Typography
              variant='body1'
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 1,
                opacity: 0.7,
              }}
            >
              <Typography variant='caption'>
                {message.timestamp.toLocaleTimeString()}
              </Typography>

              {hasSearchResults && (
                <Chip
                  size='small'
                  label={`${message.searchResults!.length} results`}
                  icon={<SearchIcon fontSize='small' />}
                  variant='outlined'
                  sx={{ fontSize: '0.7rem' }}
                />
              )}

              <Tooltip title='Copy message'>
                <IconButton
                  size='small'
                  onClick={() => handleCopyMessage(message.content)}
                  sx={{ ml: 'auto', opacity: 0.6 }}
                  aria-label='Copy message'
                >
                  <CopyIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Search Results */}
            {hasSearchResults && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size='small'
                  onClick={() => toggleMessageExpansion(message.id)}
                  startIcon={isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                  sx={{ mb: 1 }}
                  aria-label={
                    isExpanded ? 'Hide search results' : 'Show search results'
                  }
                >
                  {isExpanded ? 'Hide' : 'Show'} Search Results (
                  {message.searchResults!.length})
                </Button>

                <Collapse in={isExpanded}>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {message.searchResults!.map((result, index) => (
                      <Card
                        key={index}
                        variant='outlined'
                        sx={{ mb: 1, bgcolor: 'background.paper' }}
                      >
                        <CardContent
                          sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}
                        >
                          <Typography variant='subtitle2' noWrap>
                            {result.title}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Confidence: {(result.confidence * 100).toFixed(0)}%
                          </Typography>
                          {result.snippet && (
                            <Typography variant='body2' sx={{ mt: 0.5 }}>
                              {result.snippet}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            )}

            {/* Suggestions */}
            {message.suggestions &&
              message.suggestions.length > 0 &&
              !isUser && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Suggestions:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {message.suggestions.map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion.description}
                        size='small'
                        variant='outlined'
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
          </Paper>

          {isUser && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.secondary.main,
              }}
            >
              <UserIcon fontSize='small' />
            </Avatar>
          )}
        </Box>
      </ListItem>
    );
  };

  if (uiState.isLoading && !conversation) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: maxHeight,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant='body2' color='text.secondary'>
          Starting conversation...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: fullScreen ? '100vh' : maxHeight,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color='primary' />
          <Typography variant='h6'>AI Search Assistant</Typography>
        </Box>

        <Box>
          <IconButton
            onClick={e => setAnchorEl(e.currentTarget)}
            size='small'
            aria-label='More options'
          >
            <MoreIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={handleClearConversation}>
              <ClearIcon fontSize='small' sx={{ mr: 1 }} />
              Clear Chat
            </MenuItem>
            <MenuItem onClick={() => setExportDialogOpen(true)}>
              <ExportIcon fontSize='small' sx={{ mr: 1 }} />
              Export
            </MenuItem>
            {onClose && (
              <MenuItem onClick={onClose}>
                <ClearIcon fontSize='small' sx={{ mr: 1 }} />
                Close
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <List
          sx={{
            flex: 1,
            overflowY: 'auto',
            py: 0,
          }}
        >
          {conversation?.messages.map(message => (
            <MessageComponent key={message.id} message={message} />
          ))}

          {/* Typing indicator */}
          {uiState.isTyping && (
            <ListItem sx={{ py: 1, px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  <BotIcon fontSize='small' />
                </Avatar>
                <Paper sx={{ p: 2, borderRadius: '16px 16px 16px 4px' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 1, 2].map(i => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: 'grey.400',
                          borderRadius: '50%',
                          animation: 'pulse 1.4s infinite',
                          animationDelay: `${i * 0.16}s`,
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            </ListItem>
          )}

          <div ref={messagesEndRef} />
        </List>

        {/* Loading bar */}
        {uiState.isLoading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          />
        )}
      </Box>

      {/* Suggestions */}
      {suggestions.length > 0 && uiState.showSuggestions && (
        <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion.description}
                size='small'
                variant='outlined'
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={currentMessage}
          onChange={e => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder='Ask me to search for records...'
          disabled={uiState.isLoading}
          variant='outlined'
          size='small'
        />

        <IconButton
          onClick={handleSendMessage}
          disabled={!currentMessage.trim() || uiState.isLoading}
          color='primary'
          aria-label='Send message'
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Error display */}
      {uiState.error && (
        <Box
          sx={{
            p: 1,
            bgcolor: theme.palette.error.light,
            color: theme.palette.error.contrastText,
            fontSize: '0.875rem',
          }}
        >
          {uiState.error}
        </Box>
      )}

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      >
        <DialogTitle>Export Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            Export this conversation as a Markdown file containing all messages
            and search results.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportConversation} variant='contained'>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AISearchChat;
