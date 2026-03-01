/**
 * Redaction Collaboration Panel Component Tests
 * US-V2-031: Testing collaborative features and workflows
 */

import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RedactionCollaborationPanel } from '../../src/components/staff/InteractiveRedactionEditor/RedactionCollaborationPanel';
import {
  ApprovalWorkflow,
  CollaborationUser,
  CommentThread,
} from '../../src/components/staff/InteractiveRedactionEditor/types';
import { theme } from '../../src/theme';

// Mock authentication context
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'current-user',
      email: 'current@example.com',
      displayName: 'Current User',
    },
  }),
}));

const mockActiveUsers: CollaborationUser[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'staff',
    avatar: 'https://example.com/avatar1.jpg',
    status: 'active',
    cursor: { x: 150, y: 200 },
    lastActive: '2024-01-15T10:00:00Z',
    permissions: ['edit', 'comment', 'approve'],
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'supervisor',
    avatar: 'https://example.com/avatar2.jpg',
    status: 'viewing',
    cursor: { x: 300, y: 400 },
    lastActive: '2024-01-15T10:30:00Z',
    permissions: ['edit', 'comment', 'approve', 'review'],
  },
  {
    id: 'user-3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'reviewer',
    avatar: 'https://example.com/avatar3.jpg',
    status: 'idle',
    cursor: null,
    lastActive: '2024-01-15T09:45:00Z',
    permissions: ['comment', 'review'],
  },
];

const mockCommentThreads: CommentThread[] = [
  {
    id: 'thread-1',
    redactionId: 'redaction-1',
    position: { x: 100, y: 100 },
    resolved: false,
    createdAt: '2024-01-15T10:00:00Z',
    comments: [
      {
        id: 'comment-1',
        content: 'Should we redact this entire section?',
        author: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar1.jpg',
        },
        timestamp: '2024-01-15T10:00:00Z',
        edited: false,
      },
      {
        id: 'comment-2',
        content: 'Yes, this contains PII that should be protected.',
        author: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: 'https://example.com/avatar2.jpg',
        },
        timestamp: '2024-01-15T10:05:00Z',
        edited: false,
      },
    ],
  },
  {
    id: 'thread-2',
    redactionId: 'redaction-2',
    position: { x: 300, y: 200 },
    resolved: true,
    createdAt: '2024-01-15T09:30:00Z',
    comments: [
      {
        id: 'comment-3',
        content: 'This redaction looks good.',
        author: {
          id: 'user-3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          avatar: 'https://example.com/avatar3.jpg',
        },
        timestamp: '2024-01-15T09:30:00Z',
        edited: false,
      },
    ],
  },
];

const mockApprovalWorkflow: ApprovalWorkflow = {
  id: 'approval-1',
  documentId: 'test-doc',
  requiredApprovers: ['user-2', 'user-3'],
  currentApprovals: [
    {
      userId: 'user-2',
      userName: 'Jane Smith',
      status: 'approved',
      timestamp: '2024-01-15T11:00:00Z',
      comments: 'Redactions look comprehensive and appropriate.',
    },
  ],
  status: 'pending',
  submittedBy: 'current-user',
  submittedAt: '2024-01-15T10:45:00Z',
  deadline: '2024-01-16T17:00:00Z',
  priority: 'normal',
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RedactionCollaborationPanel', () => {
  const defaultProps = {
    recordId: 'test-record',
    documentId: 'test-doc',
    activeUsers: mockActiveUsers,
    commentThreads: mockCommentThreads,
    approvalWorkflow: mockApprovalWorkflow,
    onAddComment: jest.fn(),
    onResolveThread: jest.fn(),
    onSubmitApproval: jest.fn(),
    onUpdateApproval: jest.fn(),
    currentUserId: 'current-user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Active Users Display', () => {
    it('should display all active users', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should show user status indicators', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Viewing')).toBeInTheDocument();
      expect(screen.getByText('Idle')).toBeInTheDocument();
    });

    it('should display user avatars', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const avatars = screen.getAllByRole('img', { name: /avatar/i });
      expect(avatars).toHaveLength(3);
    });

    it('should show user roles and permissions', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Supervisor')).toBeInTheDocument();
      expect(screen.getByText('Reviewer')).toBeInTheDocument();
    });

    it('should display last active times', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
      expect(screen.getByText(/10:30 AM/)).toBeInTheDocument();
      expect(screen.getByText(/9:45 AM/)).toBeInTheDocument();
    });
  });

  describe('Comment Threads', () => {
    it('should display all comment threads', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.getByText('Should we redact this entire section?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Yes, this contains PII that should be protected.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('This redaction looks good.')
      ).toBeInTheDocument();
    });

    it('should show thread resolution status', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const resolvedThreads = screen.getAllByText(/resolved/i);
      const unresolvedThreads = screen.getAllByText(/unresolved/i);

      expect(resolvedThreads).toHaveLength(1);
      expect(unresolvedThreads).toHaveLength(1);
    });

    it('should display comment authors and timestamps', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getAllByText('John Doe')).toHaveLength(2); // Once in users, once in comments
      expect(screen.getAllByText('Jane Smith')).toHaveLength(2);
      expect(screen.getAllByText('Bob Wilson')).toHaveLength(2);

      expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
      expect(screen.getByText(/10:05 AM/)).toBeInTheDocument();
      expect(screen.getByText(/9:30 AM/)).toBeInTheDocument();
    });

    it('should allow adding new comments', async () => {
      const onAddComment = jest.fn();
      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          onAddComment={onAddComment}
        />,
        { wrapper: TestWrapper }
      );

      const commentInput = screen.getByRole('textbox', {
        name: /add comment/i,
      });
      const submitButton = screen.getByRole('button', {
        name: /post comment/i,
      });

      await userEvent.type(commentInput, 'This is a new comment');
      await userEvent.click(submitButton);

      expect(onAddComment).toHaveBeenCalledWith(
        'thread-1', // First thread
        expect.objectContaining({
          content: 'This is a new comment',
          author: expect.objectContaining({
            id: 'current-user',
          }),
        })
      );
    });

    it('should handle thread resolution', async () => {
      const onResolveThread = jest.fn();
      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          onResolveThread={onResolveThread}
        />,
        { wrapper: TestWrapper }
      );

      const resolveButtons = screen.getAllByRole('button', {
        name: /resolve thread/i,
      });
      await userEvent.click(resolveButtons[0]);

      expect(onResolveThread).toHaveBeenCalledWith('thread-1', true);
    });

    it('should allow reopening resolved threads', async () => {
      const onResolveThread = jest.fn();
      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          onResolveThread={onResolveThread}
        />,
        { wrapper: TestWrapper }
      );

      const reopenButton = screen.getByRole('button', {
        name: /reopen thread/i,
      });
      await userEvent.click(reopenButton);

      expect(onResolveThread).toHaveBeenCalledWith('thread-2', false);
    });

    it('should support @mentions in comments', async () => {
      const onAddComment = jest.fn();
      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          onAddComment={onAddComment}
        />,
        { wrapper: TestWrapper }
      );

      const commentInput = screen.getByRole('textbox', {
        name: /add comment/i,
      });

      await userEvent.type(commentInput, '@Jane Smith please review this');

      // Should show mention suggestions
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();

      const submitButton = screen.getByRole('button', {
        name: /post comment/i,
      });
      await userEvent.click(submitButton);

      expect(onAddComment).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          content: '@Jane Smith please review this',
          mentions: [{ userId: 'user-2', userName: 'Jane Smith' }],
        })
      );
    });
  });

  describe('Approval Workflow', () => {
    it('should display approval workflow status', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText(/approval workflow/i)).toBeInTheDocument();
      expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
      expect(
        screen.getByText(/1 of 2 approvals received/i)
      ).toBeInTheDocument();
    });

    it('should show required approvers', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText(/jane smith.*approved/i)).toBeInTheDocument();
      expect(screen.getByText(/bob wilson.*pending/i)).toBeInTheDocument();
    });

    it('should display approval deadline', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText(/deadline.*jan 16, 2024/i)).toBeInTheDocument();
    });

    it('should allow submitting approval', async () => {
      const onSubmitApproval = jest.fn();
      const propsWithUserAsApprover = {
        ...defaultProps,
        currentUserId: 'user-3', // Bob Wilson who hasn't approved yet
        onSubmitApproval,
      };

      render(<RedactionCollaborationPanel {...propsWithUserAsApprover} />, {
        wrapper: TestWrapper,
      });

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await userEvent.click(approveButton);

      const commentInput = screen.getByRole('textbox', {
        name: /approval comments/i,
      });
      await userEvent.type(commentInput, 'Looks good to me');

      const submitButton = screen.getByRole('button', {
        name: /submit approval/i,
      });
      await userEvent.click(submitButton);

      expect(onSubmitApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-3',
          status: 'approved',
          comments: 'Looks good to me',
        })
      );
    });

    it('should allow rejecting with comments', async () => {
      const onSubmitApproval = jest.fn();
      const propsWithUserAsApprover = {
        ...defaultProps,
        currentUserId: 'user-3',
        onSubmitApproval,
      };

      render(<RedactionCollaborationPanel {...propsWithUserAsApprover} />, {
        wrapper: TestWrapper,
      });

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await userEvent.click(rejectButton);

      const commentInput = screen.getByRole('textbox', {
        name: /rejection reason/i,
      });
      await userEvent.type(commentInput, 'Needs more redactions');

      const submitButton = screen.getByRole('button', {
        name: /submit rejection/i,
      });
      await userEvent.click(submitButton);

      expect(onSubmitApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-3',
          status: 'rejected',
          comments: 'Needs more redactions',
        })
      );
    });

    it('should show approval history', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.getByText(/redactions look comprehensive/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/jan 15, 2024.*11:00 am/i)).toBeInTheDocument();
    });

    it('should disable approval actions for non-approvers', () => {
      const propsWithNonApprover = {
        ...defaultProps,
        currentUserId: 'non-approver',
      };

      render(<RedactionCollaborationPanel {...propsWithNonApprover} />, {
        wrapper: TestWrapper,
      });

      expect(screen.queryByRole('button', { name: /approve/i })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /reject/i })).toBeDisabled();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle new comment notifications', async () => {
      const { rerender } = render(
        <RedactionCollaborationPanel {...defaultProps} />,
        { wrapper: TestWrapper }
      );

      const updatedThreads = [
        ...mockCommentThreads,
        {
          ...mockCommentThreads[0],
          comments: [
            ...mockCommentThreads[0].comments,
            {
              id: 'comment-4',
              content: 'New real-time comment',
              author: {
                id: 'user-1',
                name: 'John Doe',
                email: 'john@example.com',
                avatar: 'https://example.com/avatar1.jpg',
              },
              timestamp: new Date().toISOString(),
              edited: false,
            },
          ],
        },
      ];

      rerender(
        <RedactionCollaborationPanel
          {...defaultProps}
          commentThreads={updatedThreads.slice(0, 1)}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('New real-time comment')).toBeInTheDocument();
      });
    });

    it('should show typing indicators', () => {
      const usersWithTyping = [
        ...mockActiveUsers,
        {
          ...mockActiveUsers[0],
          isTyping: true,
          typingIn: 'thread-1',
        },
      ];

      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          activeUsers={usersWithTyping}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/john doe is typing/i)).toBeInTheDocument();
    });

    it('should update user presence in real-time', () => {
      const { rerender } = render(
        <RedactionCollaborationPanel {...defaultProps} />,
        { wrapper: TestWrapper }
      );

      const updatedUsers = mockActiveUsers.map(user =>
        user.id === 'user-1' ? { ...user, status: 'idle' as const } : user
      );

      rerender(
        <RedactionCollaborationPanel
          {...defaultProps}
          activeUsers={updatedUsers}
        />
      );

      expect(screen.getAllByText('Idle')).toHaveLength(2);
    });
  });

  describe('Notifications', () => {
    it('should show notification badge for unread comments', () => {
      const threadsWithUnread = mockCommentThreads.map(thread => ({
        ...thread,
        unreadCount: thread.id === 'thread-1' ? 2 : 0,
      }));

      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          commentThreads={threadsWithUnread}
        />,
        { wrapper: TestWrapper }
      );

      const badge = screen.getByText('2');
      expect(badge).toHaveClass('notification-badge');
    });

    it('should show mention notifications', () => {
      const threadsWithMentions = [
        {
          ...mockCommentThreads[0],
          comments: [
            {
              id: 'comment-mention',
              content: '@Current User please check this',
              author: mockCommentThreads[0].comments[0].author,
              timestamp: new Date().toISOString(),
              edited: false,
              mentions: [{ userId: 'current-user', userName: 'Current User' }],
            },
          ],
          hasMentions: true,
        },
      ];

      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          commentThreads={threadsWithMentions}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('NotificationsActiveIcon')).toBeInTheDocument();
    });

    it('should show approval deadline warnings', () => {
      const urgentWorkflow = {
        ...mockApprovalWorkflow,
        deadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        priority: 'urgent' as const,
      };

      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          approvalWorkflow={urgentWorkflow}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
      expect(screen.getByText(/urgent/i)).toBeInTheDocument();
    });
  });

  describe('Collaboration Controls', () => {
    it('should show collaboration settings', () => {
      render(
        <RedactionCollaborationPanel {...defaultProps} showSettings={true} />,
        { wrapper: TestWrapper }
      );

      const settingsButton = screen.getByRole('button', {
        name: /collaboration settings/i,
      });
      userEvent.click(settingsButton);

      expect(screen.getByText(/notification preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/permission settings/i)).toBeInTheDocument();
    });

    it('should allow muting notifications', async () => {
      render(
        <RedactionCollaborationPanel {...defaultProps} showSettings={true} />,
        { wrapper: TestWrapper }
      );

      const settingsButton = screen.getByRole('button', {
        name: /collaboration settings/i,
      });
      await userEvent.click(settingsButton);

      const muteToggle = screen.getByRole('switch', {
        name: /mute notifications/i,
      });
      await userEvent.click(muteToggle);

      expect(muteToggle).toBeChecked();
    });

    it('should allow filtering comment threads', async () => {
      render(
        <RedactionCollaborationPanel {...defaultProps} showFilters={true} />,
        { wrapper: TestWrapper }
      );

      const filterButton = screen.getByRole('button', {
        name: /filter threads/i,
      });
      await userEvent.click(filterButton);

      const unresolvedFilter = screen.getByRole('checkbox', {
        name: /show unresolved/i,
      });
      await userEvent.click(unresolvedFilter);

      expect(
        screen.getByText('Should we redact this entire section?')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('This redaction looks good.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Permissions and Security', () => {
    it('should respect user permissions for actions', () => {
      const limitedUser = {
        ...mockActiveUsers[2], // Reviewer with limited permissions
        permissions: ['comment'] as const[],
      };

      const propsWithLimitedUser = {
        ...defaultProps,
        currentUserId: 'user-3',
        activeUsers: [limitedUser],
      };

      render(<RedactionCollaborationPanel {...propsWithLimitedUser} />, {
        wrapper: TestWrapper,
      });

      // Should not show approval buttons for users without approval permissions
      expect(
        screen.queryByRole('button', { name: /approve/i })
      ).not.toBeInTheDocument();
    });

    it('should prevent unauthorized actions', async () => {
      const onResolveThread = jest.fn();
      const propsWithNoEditPermission = {
        ...defaultProps,
        currentUserId: 'limited-user',
        onResolveThread,
      };

      render(<RedactionCollaborationPanel {...propsWithNoEditPermission} />, {
        wrapper: TestWrapper,
      });

      // Resolve buttons should be disabled or hidden for users without permission
      const resolveButtons = screen.queryAllByRole('button', {
        name: /resolve thread/i,
      });
      if (resolveButtons.length > 0) {
        expect(resolveButtons[0]).toBeDisabled();
      }
    });

    it('should validate comment content', async () => {
      const onAddComment = jest.fn();
      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          onAddComment={onAddComment}
        />,
        { wrapper: TestWrapper }
      );

      const commentInput = screen.getByRole('textbox', {
        name: /add comment/i,
      });
      const submitButton = screen.getByRole('button', {
        name: /post comment/i,
      });

      // Try to submit empty comment
      await userEvent.click(submitButton);
      expect(onAddComment).not.toHaveBeenCalled();

      // Try to submit valid comment
      await userEvent.type(commentInput, 'Valid comment');
      await userEvent.click(submitButton);
      expect(onAddComment).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.getByRole('region', { name: /collaboration panel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('list', { name: /active users/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: /comment threads/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: /approval workflow/i })
      ).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const commentInput = screen.getByRole('textbox', {
        name: /add comment/i,
      });
      commentInput.focus();
      expect(commentInput).toHaveFocus();

      // Tab to submit button
      fireEvent.keyDown(commentInput, { key: 'Tab' });
      const submitButton = screen.getByRole('button', {
        name: /post comment/i,
      });
      expect(submitButton).toHaveFocus();
    });

    it('should announce important updates to screen readers', async () => {
      render(<RedactionCollaborationPanel {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const onAddComment = jest.fn();
      const commentInput = screen.getByRole('textbox', {
        name: /add comment/i,
      });
      const submitButton = screen.getByRole('button', {
        name: /post comment/i,
      });

      await userEvent.type(commentInput, 'New comment');
      await userEvent.click(submitButton);

      // Should have live region for announcements
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no active users', () => {
      render(
        <RedactionCollaborationPanel {...defaultProps} activeUsers={[]} />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/no other users active/i)).toBeInTheDocument();
    });

    it('should show empty state when no comments', () => {
      render(
        <RedactionCollaborationPanel {...defaultProps} commentThreads={[]} />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });

    it('should show empty state when no approval workflow', () => {
      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          approvalWorkflow={undefined}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/no approval workflow/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of comments efficiently', () => {
      const largeCommentThread: CommentThread = {
        id: 'large-thread',
        redactionId: 'redaction-1',
        position: { x: 100, y: 100 },
        resolved: false,
        createdAt: '2024-01-15T10:00:00Z',
        comments: Array.from({ length: 100 }, (_, i) => ({
          id: `comment-${i}`,
          content: `Comment ${i}`,
          author: mockCommentThreads[0].comments[0].author,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          edited: false,
        })),
      };

      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          commentThreads={[largeCommentThread]}
        />,
        { wrapper: TestWrapper }
      );

      // Should render without performance issues
      expect(screen.getByText('Comment 0')).toBeInTheDocument();
      expect(screen.getByText('Comment 99')).toBeInTheDocument();
    });

    it('should implement virtual scrolling for large comment lists', () => {
      const manyThreads = Array.from({ length: 50 }, (_, i) => ({
        ...mockCommentThreads[0],
        id: `thread-${i}`,
        comments: [
          {
            ...mockCommentThreads[0].comments[0],
            id: `comment-${i}`,
            content: `Comment in thread ${i}`,
          },
        ],
      }));

      render(
        <RedactionCollaborationPanel
          {...defaultProps}
          commentThreads={manyThreads}
          enableVirtualScrolling={true}
        />,
        { wrapper: TestWrapper }
      );

      // Should only render visible comments
      const visibleComments = screen.getAllByText(/comment in thread/i);
      expect(visibleComments.length).toBeLessThan(50);
      expect(visibleComments.length).toBeGreaterThan(5);
    });
  });
});
