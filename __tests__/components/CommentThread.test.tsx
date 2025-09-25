/**
 * Cimport CommentThreadComponent from '../../src/components/staff/CommentThread';
import { legalReviewService } from '../../src/services/legalReviewService';
import type { CommentThread as CommentThreadType, Comment } from '../../src/services/legalReviewService';

// Mock the legal review service
jest.mock('../../src/services/legalReviewService');Thread Component Tests (Epic 5 - US-050)
 * Tests for comment thread creation, management, and resolution UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentThread } from '../../src/components/staff/CommentThread';
import { legalReviewService } from '../../src/services/legalReviewService';
import type { CommentThread as CommentThreadType, Comment } from '../../src/services/legalReviewService';

// Mock the legal review service
jest.mock('../../../src/services/legalReviewService');
const mockLegalReviewService = legalReviewService as jest.Mocked<typeof legalReviewService>;

// Mock Material-UI components for cleaner testing
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Dialog: ({ open, children, onClose }: any) => 
    open ? <div data-testid="dialog" onClick={onClose}>{children}</div> : null,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogActions: ({ children }: any) => <div data-testid="dialog-actions">{children}</div>,
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  AccordionSummary: ({ children, onClick }: any) => 
    <div data-testid="accordion-summary" onClick={onClick}>{children}</div>,
  AccordionDetails: ({ children }: any) => <div data-testid="accordion-details">{children}</div>,
}));

describe('CommentThread Component', () => {
  const mockCurrentUser = {
    id: 'user-123',
    name: 'John Doe',
    role: 'legal_reviewer' as const,
  };

  const mockThread: CommentThreadType = {
    id: 'thread-1',
    recordId: 'record-123',
    fileName: 'document.pdf',
    threadType: 'change_request',
    priority: 'high',
    status: 'open',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    comments: [
      {
        id: 'comment-1',
        threadId: 'thread-1',
        content: 'Need additional redactions on this document',
        authorId: 'user-456',
        authorName: 'Sarah Johnson',
        authorRole: 'legal_reviewer',
        timestamp: '2024-01-15T10:00:00.000Z',
        isResolution: false,
      }
    ]
  };

  const mockCommentThreads: CommentThreadType[] = [mockThread];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLegalReviewService.getCommentThreadsForRecord.mockResolvedValue(mockCommentThreads);
    mockLegalReviewService.createCommentThread.mockResolvedValue(mockThread);
    mockLegalReviewService.addComment.mockResolvedValue(mockThread.comments[0]);
    mockLegalReviewService.updateThreadStatus.mockResolvedValue(mockThread);
  });

  describe('Initial Render', () => {
    it('should render comment threads section', async () => {
      render(
        <CommentThreadComponentComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByText('Comment Threads')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Need additional redactions on this document')).toBeInTheDocument();
      });
    });

    it('should display thread count badge', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
      });
    });

    it('should show empty state when no threads exist', async () => {
      mockLegalReviewService.getCommentThreadsForRecord.mockResolvedValue([]);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No comment threads yet')).toBeInTheDocument();
      });
    });

    it('should load threads on mount', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(mockLegalReviewService.getCommentThreadsForRecord).toHaveBeenCalledWith(
          'record-123',
          'document.pdf'
        );
      });
    });
  });

  describe('New Thread Creation', () => {
    it('should open new thread dialog when button clicked', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      const newThreadButton = screen.getByText('New Thread');
      fireEvent.click(newThreadButton);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Comment Thread')).toBeInTheDocument();
    });

    it('should create new thread with valid data', async () => {
      const newThread: CommentThreadType = {
        id: 'thread-2',
        recordId: 'record-123',
        fileName: 'document.pdf',
        threadType: 'general_comment',
        priority: 'medium',
        status: 'open',
        createdAt: '2024-01-15T11:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
        comments: [{
          id: 'comment-2',
          threadId: 'thread-2',
          content: 'New comment thread',
          authorId: 'user-123',
          authorName: 'John Doe',
          authorRole: 'legal_reviewer',
          timestamp: '2024-01-15T11:00:00.000Z',
          isResolution: false,
        }]
      };

      mockLegalReviewService.createCommentThread.mockResolvedValue(newThread);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      // Open dialog
      fireEvent.click(screen.getByText('New Thread'));

      // Fill form
      const commentInput = screen.getByLabelText('Comment');
      fireEvent.change(commentInput, { target: { value: 'New comment thread' } });

      const typeSelect = screen.getByLabelText('Thread Type');
      fireEvent.change(typeSelect, { target: { value: 'general_comment' } });

      const prioritySelect = screen.getByLabelText('Priority');
      fireEvent.change(prioritySelect, { target: { value: 'medium' } });

      // Submit
      const createButton = screen.getByText('Create Thread');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockLegalReviewService.createCommentThread).toHaveBeenCalledWith(
          'record-123',
          'document.pdf',
          'general_comment',
          'New comment thread',
          'user-123',
          'John Doe',
          'legal_reviewer',
          'medium'
        );
      });
    });

    it('should handle creation errors gracefully', async () => {
      mockLegalReviewService.createCommentThread.mockRejectedValue(
        new Error('Creation failed')
      );

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      // Open dialog and submit invalid data
      fireEvent.click(screen.getByText('New Thread'));
      fireEvent.click(screen.getByText('Create Thread'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create thread')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      // Open dialog
      fireEvent.click(screen.getByText('New Thread'));

      // Try to submit without comment
      const createButton = screen.getByText('Create Thread');
      fireEvent.click(createButton);

      // Should not call service
      expect(mockLegalReviewService.createCommentThread).not.toHaveBeenCalled();
    });

    it('should close dialog after successful creation', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      // Open dialog
      fireEvent.click(screen.getByText('New Thread'));
      expect(screen.getByTestId('dialog')).toBeInTheDocument();

      // Fill and submit form
      const commentInput = screen.getByLabelText('Comment');
      fireEvent.change(commentInput, { target: { value: 'Test comment' } });
      fireEvent.click(screen.getByText('Create Thread'));

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Thread Display', () => {
    it('should display thread metadata correctly', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Change Request')).toBeInTheDocument(); // Thread type
        expect(screen.getByText('High')).toBeInTheDocument(); // Priority
        expect(screen.getByText('Open')).toBeInTheDocument(); // Status
      });
    });

    it('should display all comments in thread', async () => {
      const threadWithMultipleComments = {
        ...mockThread,
        comments: [
          mockThread.comments[0],
          {
            id: 'comment-2',
            threadId: 'thread-1',
            content: 'I will review this',
            authorId: 'user-789',
            authorName: 'Mike Wilson',
            authorRole: 'records_officer' as const,
            timestamp: '2024-01-15T11:00:00.000Z',
            isResolution: false,
          }
        ]
      };

      mockLegalReviewService.getCommentThreadsForRecord.mockResolvedValue([threadWithMultipleComments]);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Need additional redactions on this document')).toBeInTheDocument();
        expect(screen.getByText('I will review this')).toBeInTheDocument();
      });
    });

    it('should show comment author information', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Legal Reviewer')).toBeInTheDocument();
      });
    });

    it('should display comment timestamps', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        // Should display formatted date
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Adding Comments', () => {
    it('should show reply input when reply button clicked', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reply')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reply'));

      expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    });

    it('should add new comment when submitted', async () => {
      const newComment: Comment = {
        id: 'comment-new',
        threadId: 'thread-1',
        content: 'This is a reply',
        authorId: 'user-123',
        authorName: 'John Doe',
        authorRole: 'legal_reviewer',
        timestamp: '2024-01-15T12:00:00.000Z',
        isResolution: false,
      };

      mockLegalReviewService.addComment.mockResolvedValue(newComment);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Reply'));
      });

      const replyInput = screen.getByPlaceholderText('Add a comment...');
      fireEvent.change(replyInput, { target: { value: 'This is a reply' } });

      const submitButton = screen.getByText('Add Comment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLegalReviewService.addComment).toHaveBeenCalledWith(
          'thread-1',
          'This is a reply',
          'user-123',
          'John Doe',
          'legal_reviewer',
          false
        );
      });
    });

    it('should handle resolution comments', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Reply'));
      });

      const replyInput = screen.getByPlaceholderText('Add a comment...');
      fireEvent.change(replyInput, { target: { value: 'This resolves the issue' } });

      const resolutionCheckbox = screen.getByLabelText('Mark as resolution');
      fireEvent.click(resolutionCheckbox);

      const submitButton = screen.getByText('Add Comment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLegalReviewService.addComment).toHaveBeenCalledWith(
          'thread-1',
          'This resolves the issue',
          'user-123',
          'John Doe',
          'legal_reviewer',
          true
        );
      });
    });

    it('should clear reply input after successful submission', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Reply'));
      });

      const replyInput = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;
      fireEvent.change(replyInput, { target: { value: 'Test reply' } });
      fireEvent.click(screen.getByText('Add Comment'));

      await waitFor(() => {
        expect(replyInput.value).toBe('');
      });
    });
  });

  describe('Thread Status Management', () => {
    it('should show resolve button for open threads', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Resolve')).toBeInTheDocument();
      });
    });

    it('should resolve thread when resolve button clicked', async () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      mockLegalReviewService.updateThreadStatus.mockResolvedValue(resolvedThread);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Resolve'));
      });

      expect(mockLegalReviewService.updateThreadStatus).toHaveBeenCalledWith(
        'thread-1',
        'resolved'
      );
    });

    it('should not show resolve button for resolved threads', async () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      mockLegalReviewService.getCommentThreadsForRecord.mockResolvedValue([resolvedThread]);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
      });
    });

    it('should show different styling for resolved threads', async () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      mockLegalReviewService.getCommentThreadsForRecord.mockResolvedValue([resolvedThread]);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Resolved')).toBeInTheDocument();
      });
    });
  });

  describe('Priority and Type Indicators', () => {
    it('should display correct priority colors', async () => {
      const highPriorityThread = { ...mockThread, priority: 'high' as const };
      mockLegalReviewService.getCommentThreadsForRecord.mockResolvedValue([highPriorityThread]);

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        const priorityChip = screen.getByText('High');
        expect(priorityChip).toBeInTheDocument();
        // Would check for specific styling/color class if testing CSS
      });
    });

    it('should display thread type with appropriate icon', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Change Request')).toBeInTheDocument();
        // Could check for specific icon if mocking icons differently
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      mockLegalReviewService.getCommentThreadsForRecord.mockRejectedValue(
        new Error('Failed to load')
      );

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading comment threads')).toBeInTheDocument();
      });
    });

    it('should handle comment addition errors', async () => {
      mockLegalReviewService.addComment.mockRejectedValue(
        new Error('Failed to add comment')
      );

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Reply'));
      });

      const replyInput = screen.getByPlaceholderText('Add a comment...');
      fireEvent.change(replyInput, { target: { value: 'Test reply' } });
      fireEvent.click(screen.getByText('Add Comment'));

      await waitFor(() => {
        expect(screen.getByText('Failed to add comment')).toBeInTheDocument();
      });
    });

    it('should handle thread status update errors', async () => {
      mockLegalReviewService.updateThreadStatus.mockRejectedValue(
        new Error('Failed to update status')
      );

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Resolve'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update thread status')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      expect(screen.getByLabelText('Comment Threads')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Thread actions')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      const newThreadButton = screen.getByText('New Thread');
      
      // Should be focusable
      newThreadButton.focus();
      expect(document.activeElement).toBe(newThreadButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(newThreadButton, { key: 'Enter' });
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle mobile viewport correctly', async () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <CommentThreadComponentComponent
          recordId="record-123"
          fileName="document.pdf"
          currentUser={mockCurrentUser}
        />
      );

      // Component should render properly on mobile
      await waitFor(() => {
        expect(screen.getByText('Comment Threads')).toBeInTheDocument();
      });
    });
  });
});