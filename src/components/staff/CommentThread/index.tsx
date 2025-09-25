/**
 * Comment Thread Component (US-050)
 * Displays comment threads with ability to add new comments and resolve threads
 * Part of Epic 5: Approvals & Legal Review
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from '@mui/material';
import {
  Comment as CommentIcon,
  Add as AddIcon,
  CheckCircle as ResolveIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  PriorityHigh as PriorityIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { 
  legalReviewService, 
  CommentThread, 
  Comment,
  type CommentThread as CommentThreadType 
} from '../../../services/legalReviewService';

interface CommentThreadProps {
  recordId: string;
  fileName: string;
  onThreadCreated?: (thread: CommentThread) => void;
  onThreadUpdated?: (thread: CommentThread) => void;
}

interface NewThreadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    threadType: CommentThreadType['threadType'],
    content: string,
    priority: CommentThreadType['priority']
  ) => void;
}

const NewThreadDialog: React.FC<NewThreadDialogProps> = ({ open, onClose, onSubmit }) => {
  const [threadType, setThreadType] = useState<CommentThreadType['threadType']>('general_comment');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<CommentThreadType['priority']>('medium');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(threadType, content.trim(), priority);
      setContent('');
      setThreadType('general_comment');
      setPriority('medium');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Comment Thread</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Thread Type</InputLabel>
              <Select
                value={threadType}
                onChange={(e) => setThreadType(e.target.value as CommentThreadType['threadType'])}
                label="Thread Type"
              >
                <MenuItem value="general_comment">General Comment</MenuItem>
                <MenuItem value="change_request">Change Request</MenuItem>
                <MenuItem value="clarification">Clarification</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CommentThreadType['priority'])}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comment"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your comment or question..."
              helperText="Provide detailed information about your comment or request"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!content.trim()}
        >
          Create Thread
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CommentItemProps {
  comment: Comment;
  isLatest: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isLatest }) => {
  const getAvatarColor = (role: Comment['authorRole']) => {
    switch (role) {
      case 'legal_reviewer': return '#1976d2';
      case 'records_officer': return '#2e7d32';
      case 'admin': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getRoleLabel = (role: Comment['authorRole']) => {
    switch (role) {
      case 'legal_reviewer': return 'Legal Reviewer';
      case 'records_officer': return 'Records Officer';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  return (
    <ListItem 
      alignItems="flex-start" 
      sx={{ 
        py: 2,
        backgroundColor: isLatest ? '#f8f9fa' : 'transparent',
        borderRadius: 1,
        mb: 1
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: getAvatarColor(comment.authorRole) }}>
          <PersonIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {comment.authorName}
            </Typography>
            <Chip 
              label={getRoleLabel(comment.authorRole)} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            {comment.isResolution && (
              <Chip 
                label="Resolution" 
                size="small" 
                color="success" 
                icon={<ResolveIcon />}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {new Date(comment.timestamp).toLocaleString()}
            </Typography>
          </Box>
        }
        secondary={
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
            {comment.content}
          </Typography>
        }
      />
    </ListItem>
  );
};

interface ThreadCardProps {
  thread: CommentThreadType;
  onAddComment: (content: string, isResolution: boolean) => void;
  onResolveThread: () => void;
  onCloseThread: () => void;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ 
  thread, 
  onAddComment, 
  onResolveThread, 
  onCloseThread 
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const getStatusColor = (status: CommentThreadType['status']) => {
    switch (status) {
      case 'open': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: CommentThreadType['priority']) => {
    switch (priority) {
      case 'urgent': return '#d32f2f';
      case 'high': return '#ed6c02';
      case 'medium': return '#0288d1';
      case 'low': return '#2e7d32';
      default: return '#757575';
    }
  };

  const getTypeLabel = (type: CommentThreadType['threadType']) => {
    switch (type) {
      case 'change_request': return 'Change Request';
      case 'general_comment': return 'General Comment';
      case 'clarification': return 'Clarification';
      default: return 'Comment';
    }
  };

  const handleAddComment = (isResolution: boolean = false) => {
    if (newComment.trim()) {
      onAddComment(newComment.trim(), isResolution);
      setNewComment('');
      setIsAddingComment(false);
    }
  };

  return (
    <Card sx={{ mb: 2, border: thread.status === 'open' ? '2px solid #ed6c02' : undefined }}>
      <CardContent>
        {/* Thread Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <CommentIcon color="primary" />
            <Typography variant="h6">
              {getTypeLabel(thread.threadType)}
            </Typography>
            <Chip 
              label={thread.status.replace('_', ' ').toUpperCase()} 
              color={getStatusColor(thread.status)}
              size="small"
            />
            <Chip 
              label={thread.priority.toUpperCase()} 
              style={{ 
                backgroundColor: getPriorityColor(thread.priority),
                color: 'white'
              }}
              size="small"
              icon={<PriorityIcon />}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
              Created: {new Date(thread.createdAt).toLocaleDateString()}
            </Typography>
            {thread.status === 'open' && (
              <>
                <Tooltip title="Resolve Thread">
                  <IconButton size="small" onClick={onResolveThread} color="success">
                    <ResolveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close Thread">
                  <IconButton size="small" onClick={onCloseThread} color="error">
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* Comments List */}
        <List sx={{ py: 0 }}>
          {thread.comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <CommentItem 
                comment={comment} 
                isLatest={index === thread.comments.length - 1}
              />
              {index < thread.comments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Add Comment Section */}
        {thread.status === 'open' && (
          <Box sx={{ mt: 2 }}>
            {!isAddingComment ? (
              <Button
                startIcon={<ReplyIcon />}
                onClick={() => setIsAddingComment(true)}
                variant="outlined"
                size="small"
              >
                Add Comment
              </Button>
            ) : (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: '#fafafa' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment..."
                  variant="outlined"
                  size="small"
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    onClick={() => {
                      setIsAddingComment(false);
                      setNewComment('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddComment(false)}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleAddComment(true)}
                    disabled={!newComment.trim()}
                    startIcon={<ResolveIcon />}
                  >
                    Add & Resolve
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const CommentThreadComponent: React.FC<CommentThreadProps> = ({
  recordId,
  fileName,
  onThreadCreated,
  onThreadUpdated,
}) => {
  const [threads, setThreads] = useState<CommentThreadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);

  // Mock current user - in real app this would come from auth context
  const currentUser = {
    id: 'user_legal_001',
    name: 'Sarah Johnson',
    role: 'legal_reviewer' as const,
  };

  useEffect(() => {
    loadThreads();
  }, [recordId, fileName]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const threadList = await legalReviewService.getCommentThreadsForRecord(recordId, fileName);
      setThreads(threadList);
      setError(null);
    } catch (err) {
      console.error('Failed to load comment threads:', err);
      setError('Failed to load comment threads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (
    threadType: CommentThreadType['threadType'],
    content: string,
    priority: CommentThreadType['priority']
  ) => {
    try {
      const newThread = await legalReviewService.createCommentThread(
        recordId,
        fileName,
        threadType,
        content,
        currentUser.id,
        currentUser.name,
        currentUser.role,
        priority
      );
      
      setThreads([newThread, ...threads]);
      onThreadCreated?.(newThread);
    } catch (err) {
      console.error('Failed to create thread:', err);
      setError('Failed to create comment thread');
    }
  };

  const handleAddComment = async (threadId: string, content: string, isResolution: boolean) => {
    try {
      await legalReviewService.addComment(
        threadId,
        content,
        currentUser.id,
        currentUser.name,
        currentUser.role,
        isResolution
      );
      
      await loadThreads(); // Reload to get updated thread
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
    }
  };

  const handleResolveThread = async (threadId: string) => {
    try {
      const updatedThread = await legalReviewService.updateThreadStatus(threadId, 'resolved');
      await loadThreads();
      onThreadUpdated?.(updatedThread);
    } catch (err) {
      console.error('Failed to resolve thread:', err);
      setError('Failed to resolve thread');
    }
  };

  const handleCloseThread = async (threadId: string) => {
    try {
      const updatedThread = await legalReviewService.updateThreadStatus(threadId, 'closed');
      await loadThreads();
      onThreadUpdated?.(updatedThread);
    } catch (err) {
      console.error('Failed to close thread:', err);
      setError('Failed to close thread');
    }
  };

  if (loading) {
    return (
      <Box p={2}>
        <Typography>Loading comment threads...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h6">
          Comment Threads ({threads.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewThreadDialogOpen(true)}
        >
          New Thread
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Thread Stats */}
      {threads.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {threads.filter(t => t.status === 'open').length}
                </Typography>
                <Typography variant="caption">Open</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {threads.filter(t => t.status === 'resolved').length}
                </Typography>
                <Typography variant="caption">Resolved</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {threads.filter(t => t.threadType === 'change_request').length}
                </Typography>
                <Typography variant="caption">Change Requests</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {threads.reduce((sum, t) => sum + t.comments.length, 0)}
                </Typography>
                <Typography variant="caption">Total Comments</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Threads List */}
      {threads.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CommentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Comment Threads
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start a conversation by creating the first comment thread for this record.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewThreadDialogOpen(true)}
          >
            Create First Thread
          </Button>
        </Paper>
      ) : (
        threads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            onAddComment={(content, isResolution) => handleAddComment(thread.id, content, isResolution)}
            onResolveThread={() => handleResolveThread(thread.id)}
            onCloseThread={() => handleCloseThread(thread.id)}
          />
        ))
      )}

      {/* New Thread Dialog */}
      <NewThreadDialog
        open={newThreadDialogOpen}
        onClose={() => setNewThreadDialogOpen(false)}
        onSubmit={handleCreateThread}
      />
    </Box>
  );
};

export default CommentThreadComponent;