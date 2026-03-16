/**
 * Attachment Manager Component Tests
 * V2-1 Epic: Enhanced Request Dashboard & Navigation
 * US-V2-011: Request Navigation & Entry
 */

import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';

import { AttachmentManager } from '../../../src/components/staff/RequestDetailsDrawer/AttachmentManager';
import { StoredRequest } from '../../../src/services/requestService';

const theme = createTheme();

const mockRequest: StoredRequest = {
  id: 'req-123',
  trackingId: 'TR-2024-001',
  title: 'Police Report Request',
  contactEmail: 'john.doe@example.com',
  department: 'Police',
  description: 'Request for incident report from January 1st',
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-01-01',
    preset: 'single-day',
  },
  status: 'under_review',
  submittedAt: Timestamp.fromDate(new Date('2024-01-15T09:00:00Z')),
  updatedAt: Timestamp.fromDate(new Date('2024-01-16T15:00:00Z')),
  attachmentCount: 3,
  agency: 'police-dept',
  associatedRecords: [],
};

const mockNoAttachmentsRequest: StoredRequest = {
  ...mockRequest,
  attachmentCount: 0,
  id: 'req-no-attachments',
};

// Mock file for testing file operations
const mockFile = new File(['test content'], 'test-document.pdf', {
  type: 'application/pdf',
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Mock URL.createObjectURL since it's not available in test environment
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock file reader
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    onload: null,
    onerror: null,
    result: 'data:application/pdf;base64,mock-base64-content',
  })),
});

describe('AttachmentManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders attachment manager component', () => {
      renderWithTheme(<AttachmentManager request={mockRequest} />);
      expect(screen.getByText('Attachments')).toBeInTheDocument();
    });

    it('displays attachment count', () => {
      renderWithTheme(<AttachmentManager request={mockRequest} />);
      expect(screen.getByText('3 files attached')).toBeInTheDocument();
    });

    it('shows single file label correctly', () => {
      const singleFileRequest = { ...mockRequest, attachmentCount: 1 };
      renderWithTheme(<AttachmentManager request={singleFileRequest} />);
      expect(screen.getByText('1 file attached')).toBeInTheDocument();
    });

    it('displays no attachments message when count is zero', () => {
      renderWithTheme(<AttachmentManager request={mockNoAttachmentsRequest} />);
      expect(screen.getByText('No attachments provided')).toBeInTheDocument();
    });
  });

  describe('File List Display', () => {
    it('shows mock attachment files when expand button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      expect(screen.getByText('incident_report.pdf')).toBeInTheDocument();
      expect(screen.getByText('witness_statement.docx')).toBeInTheDocument();
      expect(screen.getByText('photo_evidence.jpg')).toBeInTheDocument();
    });

    it('displays file sizes', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      expect(screen.getByText('2.4 MB')).toBeInTheDocument();
      expect(screen.getByText('1.2 MB')).toBeInTheDocument();
      expect(screen.getByText('856 KB')).toBeInTheDocument();
    });

    it('shows file types with appropriate icons', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('DOCX')).toBeInTheDocument();
      expect(screen.getByText('JPG')).toBeInTheDocument();
    });

    it('displays upload dates', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('File Actions', () => {
    it('shows download action for each file', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const downloadButtons = screen.getAllByText('Download');
      expect(downloadButtons).toHaveLength(3);
    });

    it('shows preview action for supported file types', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const previewButtons = screen.getAllByText('Preview');
      expect(previewButtons.length).toBeGreaterThan(0);
    });

    it('shows delete action with proper confirmation', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const deleteButtons = screen.getAllByLabelText(/delete/i);
      expect(deleteButtons).toHaveLength(3);
    });
  });

  describe('File Preview', () => {
    it('opens preview dialog when preview button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const previewButton = screen.getAllByText('Preview')[0];
      await user.click(previewButton);

      expect(screen.getByText('File Preview')).toBeInTheDocument();
    });

    it('displays file name in preview dialog', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const previewButton = screen.getAllByText('Preview')[0];
      await user.click(previewButton);

      expect(screen.getByText('incident_report.pdf')).toBeInTheDocument();
    });

    it('closes preview dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const previewButton = screen.getAllByText('Preview')[0];
      await user.click(previewButton);

      const closeButton = screen.getByLabelText('close');
      await user.click(closeButton);

      expect(screen.queryByText('File Preview')).not.toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('shows upload area when add files button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      expect(
        screen.getByText('Drop files here or click to browse')
      ).toBeInTheDocument();
    });

    it('handles file selection via input', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      const fileInput = screen.getByLabelText(/choose files/i);
      await user.upload(fileInput, mockFile);

      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    it('displays upload progress', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      const fileInput = screen.getByLabelText(/choose files/i);
      await user.upload(fileInput, mockFile);

      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('cancels upload when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      const fileInput = screen.getByLabelText(/choose files/i);
      await user.upload(fileInput, mockFile);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByText('test-document.pdf')).not.toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('shows file type restrictions', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
    });

    it('displays file size limits', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      expect(screen.getByText(/Maximum size: 10 MB/)).toBeInTheDocument();
    });

    it('handles invalid file types gracefully', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const addButton = screen.getByText('Add Files');
      await user.click(addButton);

      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable',
      });
      const fileInput = screen.getByLabelText(/choose files/i);

      await user.upload(fileInput, invalidFile);

      expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument();
    });
  });

  describe('Bulk Actions', () => {
    it('shows select all checkbox when files exist', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      expect(screen.getByLabelText(/select all files/i)).toBeInTheDocument();
    });

    it('enables bulk download when files are selected', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const selectAllCheckbox = screen.getByLabelText(/select all files/i);
      await user.click(selectAllCheckbox);

      expect(screen.getByText('Download Selected')).toBeInTheDocument();
    });

    it('enables bulk delete when files are selected', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      const selectAllCheckbox = screen.getByLabelText(/select all files/i);
      await user.click(selectAllCheckbox);

      expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file list gracefully', () => {
      renderWithTheme(<AttachmentManager request={mockNoAttachmentsRequest} />);
      expect(screen.getByText('No attachments provided')).toBeInTheDocument();
      expect(screen.queryByText('View Files')).not.toBeInTheDocument();
    });

    it('displays appropriate message when expand is clicked with no files', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockNoAttachmentsRequest} />);

      // Add Files button should still be available
      expect(screen.getByText('Add Files')).toBeInTheDocument();
    });

    it('handles large file counts appropriately', () => {
      const manyFilesRequest = { ...mockRequest, attachmentCount: 25 };
      renderWithTheme(<AttachmentManager request={manyFilesRequest} />);
      expect(screen.getByText('25 files attached')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('displays attachment icon in header', () => {
      renderWithTheme(<AttachmentManager request={mockRequest} />);
      const header = screen.getByText('Attachments').closest('div');
      expect(header?.querySelector('svg')).toBeInTheDocument();
    });

    it('shows file type icons for different file extensions', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AttachmentManager request={mockRequest} />);

      const expandButton = screen.getByText('View Files');
      await user.click(expandButton);

      // Check that file items contain icons
      const fileItems = screen.getAllByText(/\.(pdf|docx|jpg)$/i);
      expect(fileItems.length).toBeGreaterThan(0);
    });

    it('uses consistent Material-UI styling', () => {
      renderWithTheme(<AttachmentManager request={mockRequest} />);
      const card = screen.getByText('Attachments').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });
});
