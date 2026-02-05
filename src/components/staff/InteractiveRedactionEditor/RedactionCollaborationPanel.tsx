/**
 * Redaction Collaboration Panel
 * US-V2-031: Collaborative features for redaction editing
 *
 * Features:
 * - Comments and annotations on redactions
 * - Redaction approval workflow
 * - Real-time collaboration indicators
 * - Review assignments and notifications
 * - Collaborative quality assurance
 */

import React, { useEffect, useState } from 'react';
import {
  Assignment as AssignIcon,
  Cancel as RejectIcon,
  CheckCircle as ApproveIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
  MoreVert as MoreIcon,
  Notifications as NotificationIcon,
  Person as PersonIcon,
  Reply as ReplyIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';

import { InteractiveRedaction } from './InteractiveRedactionCanvas';

export interface RedactionComment {
  id: string;
  redactionId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'suggestion' | 'approval' | 'rejection';
  status: 'active' | 'resolved';
  parentId?: string; // For threaded comments
  attachments?: string[];
  mentions?: string[]; // User IDs mentioned in comment
}

export interface RedactionApproval {
  id: string;
  redactionId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  decision: string;
  timestamp: string;
  requirements?: string[];
}

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'editor' | 'reviewer' | 'approver' | 'viewer';
  isOnline: boolean;
  lastActivity: string;
}

interface RedactionCollaborationPanelProps {
  open: boolean;
  onClose: () => void;
  redactions: InteractiveRedaction[];
  selectedRedactionId?: string;
  currentUserId: string;
  readOnly?: boolean;
  onRedactionUpdate: (
    redactionId: string,
    updates: Partial<InteractiveRedaction>
  ) => void;
}

export const RedactionCollaborationPanel: React.FC<
  RedactionCollaborationPanelProps
> = ({
  open,
  onClose,
  redactions,
  selectedRedactionId,
  currentUserId,
  readOnly = false,
  onRedactionUpdate,
}) => {
  const theme = useTheme();
  const [comments, setComments] = useState<RedactionComment[]>([]);
  const [approvals, setApprovals] = useState<RedactionApproval[]>([]);
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'suggestion'>(
    'comment'
  );
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<string>(''); // decision text
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    setCollaborators([
      {
        id: 'user1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@agency.gov',
        role: 'reviewer',
        isOnline: true,
        lastActivity: new Date().toISOString(),
      },
      {
        id: 'user2',
        name: 'Mike Chen',
        email: 'mike.chen@agency.gov',
        role: 'approver',
        isOnline: false,
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: currentUserId,
        name: 'Current User',
        email: 'current@agency.gov',
        role: 'editor',
        isOnline: true,
        lastActivity: new Date().toISOString(),
      },
    ]);

    // Mock comments
    if (selectedRedactionId) {
      setComments([
        {
          id: 'comment1',
          redactionId: selectedRedactionId,
          authorId: 'user1',
          authorName: 'Sarah Johnson',
          content:
            'This redaction might be too broad. Consider reducing the width to only cover the SSN.',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          type: 'suggestion',
          status: 'active',
        },
        {
          id: 'comment2',
          redactionId: selectedRedactionId,
          authorId: currentUserId,
          authorName: 'Current User',
          content: "Good point. I'll adjust the boundaries.",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'comment',
          status: 'active',
          parentId: 'comment1',
        },
      ]);

      setApprovals([
        {
          id: 'approval1',
          redactionId: selectedRedactionId,
          reviewerId: 'user2',
          reviewerName: 'Mike Chen',
          status: 'pending',
          decision: '',
          timestamp: new Date().toISOString(),
          requirements: ['Legal review required', 'Verify PII classification'],
        },
      ]);
    }
  }, [selectedRedactionId, currentUserId]);

  /**
   * Add new comment
   */
  const addComment = () => {
    if (!newComment.trim() || !selectedRedactionId) return;

    const comment: RedactionComment = {
      id: `comment_${Date.now()}`,
      redactionId: selectedRedactionId,
      authorId: currentUserId,
      authorName: 'Current User',
      content: newComment,
      timestamp: new Date().toISOString(),
      type: commentType,
      status: 'active',
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');

    // Update redaction with comment indicator
    onRedactionUpdate(selectedRedactionId, {
      // Add any redaction-specific updates for comments
    });
  };

  /**
   * Submit approval/rejection
   */
  const submitApproval = (
    status: 'approved' | 'rejected' | 'changes_requested'
  ) => {
    if (!selectedRedactionId) return;

    const approval: RedactionApproval = {
      id: `approval_${Date.now()}`,
      redactionId: selectedRedactionId,
      reviewerId: currentUserId,
      reviewerName: 'Current User',
      status,
      decision: pendingApproval,
      timestamp: new Date().toISOString(),
    };

    setApprovals(prev =>
      prev.map(a =>
        a.redactionId === selectedRedactionId && a.reviewerId === currentUserId
          ? { ...a, ...approval }
          : a
      )
    );

    setShowApprovalDialog(false);
    setPendingApproval('');

    // Update redaction status
    onRedactionUpdate(selectedRedactionId, {
      approvalStatus: status === 'approved' ? 'APPROVED' : 'PENDING',
    });
  };

  /**
   * Get approval status for redaction
   */
  const getApprovalStatus = (redactionId: string) => {
    const approval = approvals.find(a => a.redactionId === redactionId);
    return approval?.status || 'pending';
  };

  /**
   * Get comment count for redaction
   */
  const getCommentCount = (redactionId: string) => {
    return comments.filter(
      c => c.redactionId === redactionId && c.status === 'active'
    ).length;
  };

  /**
   * Handle comment menu
   */
  const handleCommentMenu = (
    event: React.MouseEvent<HTMLElement>,
    commentId: string
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedComment(commentId);
  };

  /**
   * Delete comment
   */
  const deleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    setMenuAnchor(null);
    setSelectedComment(null);
  };

  /**
   * Resolve comment
   */
  const resolveComment = (commentId: string) => {
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, status: 'resolved' } : c))
    );
    setMenuAnchor(null);
    setSelectedComment(null);
  };

  /**
   * Get user by ID
   */
  const getUser = (userId: string) => {
    return collaborators.find(u => u.id === userId);
  };

  /**
   * Get role color
   */
  const getRoleColor = (role: CollaborationUser['role']) => {
    switch (role) {
      case 'editor':
        return 'primary';
      case 'reviewer':
        return 'warning';
      case 'approver':
        return 'success';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  const selectedRedaction = redactions.find(r => r.id === selectedRedactionId);

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Card sx={{ m: 0, borderRadius: 0, height: '100%' }}>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={1}>
                <CommentIcon />
                <Typography variant='h6'>Collaboration</Typography>
                <Badge badgeContent={comments.length} color='primary'>
                  <Box />
                </Badge>
              </Box>
            }
            subheader={
              selectedRedactionId
                ? `Redaction: ${selectedRedactionId.slice(0, 8)}...`
                : 'Select a redaction to collaborate'
            }
          />

          <CardContent
            sx={{
              p: 0,
              '&:last-child': { pb: 0 },
              height: 'calc(100% - 80px)',
              overflow: 'auto',
            }}
          >
            {/* Collaborators Section */}
            <Box p={2} borderBottom='1px solid #eee'>
              <Typography variant='subtitle2' gutterBottom>
                Active Collaborators ({collaborators.length})
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                {collaborators.map(user => (
                  <Tooltip
                    key={user.id}
                    title={
                      <Box>
                        <Typography variant='body2'>{user.name}</Typography>
                        <Typography variant='caption'>{user.email}</Typography>
                        <Typography variant='caption' display='block'>
                          {user.isOnline
                            ? 'Online'
                            : `Last seen ${formatDistanceToNow(new Date(user.lastActivity))} ago`}
                        </Typography>
                      </Box>
                    }
                  >
                    <Box position='relative'>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          border: user.isOnline
                            ? `2px solid ${theme.palette.success.main}`
                            : 'none',
                        }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                      <Chip
                        size='small'
                        label={user.role}
                        color={getRoleColor(user.role)}
                        sx={{
                          position: 'absolute',
                          bottom: -8,
                          right: -8,
                          fontSize: '0.6rem',
                          height: 16,
                        }}
                      />
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            {selectedRedactionId ? (
              <>
                {/* Approval Status Section */}
                <Box p={2} borderBottom='1px solid #eee'>
                  <Typography variant='subtitle2' gutterBottom>
                    Approval Status
                  </Typography>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Chip
                      size='small'
                      label={getApprovalStatus(selectedRedactionId)}
                      color={
                        getApprovalStatus(selectedRedactionId) === 'approved'
                          ? 'success'
                          : getApprovalStatus(selectedRedactionId) ===
                              'rejected'
                            ? 'error'
                            : 'warning'
                      }
                    />
                    {!readOnly && (
                      <Button
                        size='small'
                        onClick={() => setShowApprovalDialog(true)}
                        disabled={
                          getApprovalStatus(selectedRedactionId) === 'approved'
                        }
                      >
                        Review
                      </Button>
                    )}
                  </Box>

                  {approvals
                    .filter(a => a.redactionId === selectedRedactionId)
                    .map(approval => (
                      <Alert
                        key={approval.id}
                        severity={
                          approval.status === 'approved'
                            ? 'success'
                            : approval.status === 'rejected'
                              ? 'error'
                              : 'info'
                        }
                        sx={{ mb: 1 }}
                      >
                        <Typography variant='body2'>
                          <strong>{approval.reviewerName}</strong>
                          {approval.decision && (
                            <>
                              <br />
                              {approval.decision}
                            </>
                          )}
                        </Typography>
                        {approval.requirements &&
                          approval.requirements.length > 0 && (
                            <Box mt={1}>
                              <Typography variant='caption'>
                                Requirements:
                              </Typography>
                              {approval.requirements.map((req, index) => (
                                <Typography
                                  key={index}
                                  variant='caption'
                                  display='block'
                                >
                                  • {req}
                                </Typography>
                              ))}
                            </Box>
                          )}
                      </Alert>
                    ))}
                </Box>

                {/* Comments Section */}
                <Box p={2} borderBottom='1px solid #eee'>
                  <Typography variant='subtitle2' gutterBottom>
                    Comments (
                    {
                      comments.filter(
                        c => c.redactionId === selectedRedactionId
                      ).length
                    }
                    )
                  </Typography>

                  <List dense>
                    {comments
                      .filter(
                        c =>
                          c.redactionId === selectedRedactionId &&
                          c.status === 'active'
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.timestamp).getTime() -
                          new Date(b.timestamp).getTime()
                      )
                      .map(comment => (
                        <ListItem
                          key={comment.id}
                          sx={{
                            pl: comment.parentId ? 4 : 0,
                            border:
                              comment.type === 'suggestion'
                                ? `1px solid ${theme.palette.warning.main}`
                                : 'none',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {comment.authorName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Box display='flex' alignItems='center' gap={1}>
                                <Typography variant='body2' fontWeight='medium'>
                                  {comment.authorName}
                                </Typography>
                                <Chip
                                  size='small'
                                  label={comment.type}
                                  color={
                                    comment.type === 'suggestion'
                                      ? 'warning'
                                      : 'default'
                                  }
                                />
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {formatDistanceToNow(
                                    new Date(comment.timestamp)
                                  )}{' '}
                                  ago
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant='body2' sx={{ mt: 0.5 }}>
                                {comment.content}
                              </Typography>
                            }
                          />

                          <ListItemSecondaryAction>
                            <IconButton
                              size='small'
                              onClick={e => handleCommentMenu(e, comment.id)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                  </List>
                </Box>

                {/* Add Comment Section */}
                {!readOnly && (
                  <Box p={2}>
                    <Typography variant='subtitle2' gutterBottom>
                      Add Comment
                    </Typography>

                    <FormControl fullWidth size='small' sx={{ mb: 1 }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={commentType}
                        label='Type'
                        onChange={e =>
                          setCommentType(
                            e.target.value as 'comment' | 'suggestion'
                          )
                        }
                      >
                        <MenuItem value='comment'>Comment</MenuItem>
                        <MenuItem value='suggestion'>Suggestion</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder='Add your comment or suggestion...'
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      sx={{ mb: 1 }}
                    />

                    <Button
                      fullWidth
                      variant='contained'
                      startIcon={<SendIcon />}
                      onClick={addComment}
                      disabled={!newComment.trim()}
                    >
                      Add {commentType}
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box p={3} textAlign='center'>
                <Typography color='text.secondary'>
                  Select a redaction to view comments and collaborate
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Drawer>

      {/* Approval Dialog */}
      <Dialog
        open={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Review Redaction</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            Provide your decision and any comments for this redaction.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label='Decision Notes'
            placeholder='Explain your decision...'
            value={pendingApproval}
            onChange={e => setPendingApproval(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={() => submitApproval('changes_requested')}
            color='warning'
            startIcon={<WarningIcon />}
          >
            Request Changes
          </Button>
          <Button
            onClick={() => submitApproval('rejected')}
            color='error'
            startIcon={<RejectIcon />}
          >
            Reject
          </Button>
          <Button
            onClick={() => submitApproval('approved')}
            color='success'
            startIcon={<ApproveIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => selectedComment && resolveComment(selectedComment)}
        >
          <ApproveIcon fontSize='small' sx={{ mr: 1 }} />
          Resolve
        </MenuItem>
        <MenuItem
          onClick={() => selectedComment && deleteComment(selectedComment)}
        >
          <RejectIcon fontSize='small' sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};
