/**
 * Smart Text Editor Component
 * Enhanced rich text editor with AI assistance, real-time suggestions,
 * grammar checking, and template insertion capabilities
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AutoFixHigh as MagicIcon,
  Cancel as RejectIcon,
  CheckCircle as AcceptIcon,
  ContentPaste as TemplateIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  FormatUnderlined as UnderlineIcon,
  Lightbulb as SuggestionIcon,
  Psychology as AIIcon,
  Redo as RedoIcon,
  Spellcheck as GrammarIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { aiResponseService } from '../../services/aiResponseService';
import { PublicRecordRequest } from '../../types';
import {
  ResponseLength,
  ResponseTemplate,
  ResponseTone,
  SmartEditingContext,
  WritingAssistanceSuggestion,
} from '../../types/response';

// Styled components
const EditorContainer = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const Toolbar = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));

const EditorArea = styled('div')(({ theme }) => ({
  minHeight: '300px',
  padding: theme.spacing(2),
  border: 'none',
  outline: 'none',
  fontSize: '14px',
  lineHeight: 1.6,
  fontFamily: theme.typography.body1.fontFamily,
  '&:focus': {
    outline: 'none',
  },
}));

const SuggestionBubble = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  zIndex: 1000,
  boxShadow: theme.shadows[8],
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

interface SmartTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tone: ResponseTone;
  length: ResponseLength;
  requestContext?: PublicRecordRequest;
  templates?: ResponseTemplate[];
  autoSuggest?: boolean;
  showAI?: boolean;
  readOnly?: boolean;
  height?: number;
}

export default function SmartTextEditor({
  value,
  onChange,
  placeholder = 'Start typing your response...',
  tone,
  length,
  requestContext,
  templates = [],
  autoSuggest = true,
  showAI = true,
  readOnly = false,
  height = 400,
}: SmartTextEditorProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<WritingAssistanceSuggestion[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [templateMenuAnchor, setTemplateMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [suggestionAnchor, setSuggestionAnchor] = useState<null | HTMLElement>(
    null
  );
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save to history
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(value);
        setHistory(newHistory.slice(-50)); // Keep only last 50 states
        setHistoryIndex(newHistory.length - 1);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [value, history, historyIndex]);

  // Get AI suggestions
  const getAISuggestions = useCallback(async () => {
    if (!autoSuggest || !showAI || !requestContext || value.length < 10) {
      return;
    }

    try {
      setIsLoading(true);
      const context: SmartEditingContext = {
        currentContent: value,
        cursorPosition,
        selectedText,
        tone,
        length,
        requestContext,
      };

      const newSuggestions =
        await aiResponseService.getWritingAssistance(context);
      setSuggestions(newSuggestions);

      if (newSuggestions.length > 0) {
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    autoSuggest,
    showAI,
    requestContext,
    value,
    cursorPosition,
    selectedText,
    tone,
    length,
  ]);

  // Debounced suggestion fetching
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    suggestionTimeoutRef.current = setTimeout(() => {
      getAISuggestions();
    }, 1000);

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [getAISuggestions]);

  // Handlers
  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    onChange(newContent);
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection) {
      setCursorPosition(selection.focusOffset);
      setSelectedText(selection.toString());
    }
  };

  const handleFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleApplySuggestion = (suggestion: WritingAssistanceSuggestion) => {
    const beforeCursor = value.substring(0, suggestion.position.start);
    const afterCursor = value.substring(suggestion.position.end);
    const newContent = beforeCursor + suggestion.content + afterCursor;

    onChange(newContent);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
    setNotification('Suggestion applied');
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.filter(s => s.id !== suggestionId));
  };

  const handleInsertTemplate = (template: ResponseTemplate) => {
    const selection = window.getSelection();
    const position = selection?.focusOffset || value.length;

    const beforeCursor = value.substring(0, position);
    const afterCursor = value.substring(position);
    const newContent = beforeCursor + template.baseTemplate + afterCursor;

    onChange(newContent);
    setTemplateMenuAnchor(null);
    setNotification('Template inserted');
  };

  const handleAIAssist = async () => {
    if (!requestContext) return;

    try {
      setIsLoading(true);
      const context: SmartEditingContext = {
        currentContent: value,
        cursorPosition,
        selectedText,
        tone,
        length,
        requestContext,
      };

      const suggestions = await aiResponseService.getWritingAssistance(context);
      if (suggestions.length > 0 && suggestions[0].type === 'completion') {
        // Auto-apply first completion suggestion
        handleApplySuggestion(suggestions[0]);
      } else {
        setSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error getting AI assistance:', error);
      setNotification('AI assistance unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const formatButtons = [
    { command: 'bold', icon: BoldIcon, label: 'Bold' },
    { command: 'italic', icon: ItalicIcon, label: 'Italic' },
    { command: 'underline', icon: UnderlineIcon, label: 'Underline' },
  ];

  const listButtons = [
    {
      command: 'insertUnorderedList',
      icon: BulletListIcon,
      label: 'Bullet List',
    },
    {
      command: 'insertOrderedList',
      icon: NumberListIcon,
      label: 'Numbered List',
    },
  ];

  return (
    <Box>
      <EditorContainer>
        {/* Toolbar */}
        <Toolbar>
          {/* Formatting */}
          {formatButtons.map(({ command, icon: Icon, label }) => (
            <Tooltip key={command} title={label}>
              <IconButton
                size='small'
                onClick={() => handleFormatting(command)}
                disabled={readOnly}
              >
                <Icon />
              </IconButton>
            </Tooltip>
          ))}

          <Divider orientation='vertical' flexItem />

          {/* Lists */}
          {listButtons.map(({ command, icon: Icon, label }) => (
            <Tooltip key={command} title={label}>
              <IconButton
                size='small'
                onClick={() => handleFormatting(command)}
                disabled={readOnly}
              >
                <Icon />
              </IconButton>
            </Tooltip>
          ))}

          <Divider orientation='vertical' flexItem />

          {/* History */}
          <Tooltip title='Undo'>
            <IconButton
              size='small'
              onClick={handleUndo}
              disabled={readOnly || historyIndex === 0}
            >
              <UndoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title='Redo'>
            <IconButton
              size='small'
              onClick={handleRedo}
              disabled={readOnly || historyIndex === history.length - 1}
            >
              <RedoIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          {/* AI Features */}
          {showAI && (
            <>
              <Tooltip title='Insert Template'>
                <IconButton
                  size='small'
                  onClick={e => setTemplateMenuAnchor(e.currentTarget)}
                  disabled={readOnly || templates.length === 0}
                >
                  <TemplateIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={`AI Suggestions (${suggestions.length})`}>
                <Badge badgeContent={suggestions.length} color='primary'>
                  <IconButton
                    size='small'
                    onClick={e => setSuggestionAnchor(e.currentTarget)}
                    disabled={readOnly}
                  >
                    <SuggestionIcon />
                  </IconButton>
                </Badge>
              </Tooltip>

              <Tooltip title='AI Assist'>
                <IconButton
                  size='small'
                  onClick={handleAIAssist}
                  disabled={readOnly || isLoading}
                >
                  {isLoading ? <CircularProgress size={20} /> : <AIIcon />}
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Status Indicators */}
          {tone && (
            <Chip label={`Tone: ${tone}`} size='small' variant='outlined' />
          )}
          {length && (
            <Chip label={`Length: ${length}`} size='small' variant='outlined' />
          )}
        </Toolbar>

        {/* Editor */}
        <EditorArea
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleTextChange}
          onSelect={handleSelectionChange}
          style={{ minHeight: height - 60 }}
        >
          {value ||
            (placeholder && <div style={{ color: '#999' }}>{placeholder}</div>)}
        </EditorArea>

        {/* Inline Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Box sx={{ position: 'relative' }}>
            {suggestions.slice(0, 1).map(suggestion => (
              <SuggestionBubble
                key={suggestion.id}
                sx={{
                  bottom: 8,
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
                onClick={() => handleApplySuggestion(suggestion)}
              >
                <MagicIcon fontSize='small' />
                <Typography variant='body2'>
                  {suggestion.content.substring(0, 50)}
                  {suggestion.content.length > 50 ? '...' : ''}
                </Typography>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    handleRejectSuggestion(suggestion.id);
                  }}
                  sx={{ color: 'inherit', ml: 1 }}
                >
                  <RejectIcon fontSize='small' />
                </IconButton>
              </SuggestionBubble>
            ))}
          </Box>
        )}
      </EditorContainer>

      {/* Template Menu */}
      <Menu
        anchorEl={templateMenuAnchor}
        open={Boolean(templateMenuAnchor)}
        onClose={() => setTemplateMenuAnchor(null)}
      >
        {templates.map(template => (
          <MenuItem
            key={template.id}
            onClick={() => handleInsertTemplate(template)}
          >
            <Box>
              <Typography variant='body2' fontWeight='medium'>
                {template.name}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {template.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        {templates.length === 0 && (
          <MenuItem disabled>
            <Typography variant='body2' color='text.secondary'>
              No templates available
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Suggestions Popover */}
      <Popover
        anchorEl={suggestionAnchor}
        open={Boolean(suggestionAnchor)}
        onClose={() => setSuggestionAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box
          sx={{
            minWidth: 300,
            maxWidth: 400,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          <Typography variant='subtitle2' sx={{ p: 2, pb: 1 }}>
            AI Suggestions ({suggestions.length})
          </Typography>
          {suggestions.length > 0 ? (
            <List dense>
              {suggestions.map(suggestion => (
                <ListItem key={suggestion.id}>
                  <ListItemIcon>
                    <SuggestionIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.content}
                    secondary={suggestion.reasoning}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Box>
                    <IconButton
                      size='small'
                      onClick={() => handleApplySuggestion(suggestion)}
                      color='primary'
                    >
                      <AcceptIcon fontSize='small' />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => handleRejectSuggestion(suggestion.id)}
                      color='secondary'
                    >
                      <RejectIcon fontSize='small' />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                No suggestions available. Keep typing for AI assistance.
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Notification */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='success' onClose={() => setNotification(null)}>
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
}
