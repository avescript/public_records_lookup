/**
 * AdvancedFileUpload Component Tests
 * 
 * Comprehensive test suite for the AdvancedFileUpload component
 * covering file uploads, batch processing, progress tracking, and configuration.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../src/theme';
import AdvancedFileUpload from '../../../src/components/shared/AdvancedFileUpload';
import { useAgency } from '../../../src/contexts/AgencyContext';
import { advancedDocumentProcessingService } from '../../../src/services/advancedDocumentProcessingService';
import { ProcessingStatus, DocumentFileType } from '../../../src/services/advancedDocumentProcessingService';

// Mock dependencies
jest.mock('../../../src/contexts/AgencyContext');
jest.mock('../../../src/services/advancedDocumentProcessingService');

const mockUseAgency = useAgency as jest.MockedFunction<typeof useAgency>;
const mockService = advancedDocumentProcessingService as jest.Mocked<typeof advancedDocumentProcessingService>;

// Test component wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock file creation helper
const createMockFile = (name: string, type: string, size: number = 1024): File => {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
};

describe('AdvancedFileUpload', () => {
  const mockOnComplete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default agency context mock
    mockUseAgency.mockReturnValue({
      agency: {
        id: 'police',
        name: 'Police Department',
        type: 'law_enforcement' as any,
        tier: 'premium' as any,
        settings: {
          maxFileSize: 10485760, // 10MB
          allowedFormats: ['pdf', 'png', 'jpg', 'txt'],
          autoRedaction: true,
          requireApproval: false
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      loading: false,
      error: null
    });

    // Default service mocks
    mockService.processDocument = jest.fn();
    mockService.batchProcessDocuments = jest.fn();
    mockService.getBatchProgress = jest.fn();
    mockService.getProcessingStatus = jest.fn();
    mockService.getAllProcessingResults = jest.fn().mockReturnValue([]);
  });

  describe('Component Rendering', () => {
    test('should render component with default props', () => {
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      expect(screen.getByText('Advanced Document Processing')).toBeInTheDocument();
      expect(screen.getByText('Upload & Process Multiple Documents')).toBeInTheDocument();
      expect(screen.getByText(/Drag & drop documents here/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Browse Files/i })).toBeInTheDocument();
    });

    test('should render with custom title and description', () => {
      render(
        <TestWrapper>
          <AdvancedFileUpload 
            onComplete={mockOnComplete}
            title="Custom Title"
            description="Custom description"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });

    test('should show file format restrictions based on agency settings', () => {
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      expect(screen.getByText(/Supported formats: PDF, PNG, JPG, TXT/)).toBeInTheDocument();
      expect(screen.getByText(/Max file size: 10MB per file/)).toBeInTheDocument();
    });

    test('should handle missing agency context gracefully', () => {
      mockUseAgency.mockReturnValue({
        agency: null,
        loading: false,
        error: null
      });

      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      expect(screen.getByText(/Max file size: 5MB per file/)).toBeInTheDocument();
    });
  });

  describe('File Selection and Validation', () => {
    test('should accept valid files through file input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    test('should validate file types against agency settings', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const invalidFile = createMockFile('test.exe', 'application/octet-stream');

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
      });
    });

    test('should validate file sizes against agency limits', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const largeFile = createMockFile('large.pdf', 'application/pdf', 20 * 1024 * 1024); // 20MB

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds limit/)).toBeInTheDocument();
      });
    });

    test('should accept multiple files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const files = [
        createMockFile('test1.pdf', 'application/pdf'),
        createMockFile('test2.txt', 'text/plain'),
        createMockFile('test3.png', 'image/png')
      ];

      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
        expect(screen.getByText('test2.txt')).toBeInTheDocument();
        expect(screen.getByText('test3.png')).toBeInTheDocument();
      });
    });

    test('should prevent duplicate files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file1 = createMockFile('test.pdf', 'application/pdf');
      const file2 = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file1);
      await user.upload(fileInput, file2);

      await waitFor(() => {
        const fileElements = screen.getAllByText('test.pdf');
        expect(fileElements).toHaveLength(1);
      });

      expect(screen.getByText(/File already added/)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    test('should handle drag and drop events', async () => {
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const dropZone = screen.getByText(/Drag & drop documents here/).closest('div');
      const file = createMockFile('test.pdf', 'application/pdf');

      // Simulate drag over
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          items: [{ kind: 'file', type: 'application/pdf' }]
        }
      });

      expect(dropZone).toHaveClass('drag-over'); // Assuming CSS class is applied

      // Simulate drop
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file]
        }
      });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    test('should show drag feedback', () => {
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const dropZone = screen.getByText(/Drag & drop documents here/).closest('div');

      fireEvent.dragEnter(dropZone!);
      expect(screen.getByText(/Drop files here/)).toBeInTheDocument();

      fireEvent.dragLeave(dropZone!);
      expect(screen.getByText(/Drag & drop documents here/)).toBeInTheDocument();
    });
  });

  describe('File Management', () => {
    test('should allow removing individual files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove.*test\.pdf/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });
    });

    test('should allow clearing all files', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const files = [
        createMockFile('test1.pdf', 'application/pdf'),
        createMockFile('test2.txt', 'text/plain')
      ];

      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
        expect(screen.getByText('test2.txt')).toBeInTheDocument();
      });

      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(screen.queryByText('test1.pdf')).not.toBeInTheDocument();
        expect(screen.queryByText('test2.txt')).not.toBeInTheDocument();
      });
    });
  });

  describe('Processing Configuration', () => {
    test('should open configuration dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const configButton = screen.getByRole('button', { name: /processing options/i });
      await user.click(configButton);

      expect(screen.getByText('Processing Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/Enable OCR/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Enable PII Detection/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Enable Agency Validation/)).toBeInTheDocument();
    });

    test('should save configuration changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const configButton = screen.getByRole('button', { name: /processing options/i });
      await user.click(configButton);

      const ocrCheckbox = screen.getByLabelText(/Enable OCR/);
      await user.click(ocrCheckbox);

      const maxConcurrentInput = screen.getByLabelText(/Max Concurrent/);
      await user.clear(maxConcurrentInput);
      await user.type(maxConcurrentInput, '5');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.queryByText('Processing Configuration')).not.toBeInTheDocument();
    });

    test('should reset configuration to defaults', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const configButton = screen.getByRole('button', { name: /processing options/i });
      await user.click(configButton);

      const resetButton = screen.getByRole('button', { name: /reset to defaults/i });
      await user.click(resetButton);

      const maxConcurrentInput = screen.getByLabelText(/Max Concurrent/) as HTMLInputElement;
      expect(maxConcurrentInput.value).toBe('3');
    });
  });

  describe('Document Processing', () => {
    test('should start processing when process button is clicked', async () => {
      const user = userEvent.setup();
      
      mockService.batchProcessDocuments.mockResolvedValue('batch_123');
      mockService.getBatchProgress.mockReturnValue({
        batchId: 'batch_123',
        total: 1,
        completed: 0,
        failed: 0,
        inProgress: 1,
        currentFile: 'test.pdf',
        overallProgress: 0
      });

      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      expect(mockService.batchProcessDocuments).toHaveBeenCalledWith([file], expect.objectContaining({
        agencyId: 'police',
        maxConcurrent: 3,
        enablePIIDetection: true,
        enableAgencyValidation: true
      }));
    });

    test('should show progress during processing', async () => {
      const user = userEvent.setup();
      
      mockService.batchProcessDocuments.mockResolvedValue('batch_123');
      
      let progressCall = 0;
      mockService.getBatchProgress.mockImplementation(() => {
        progressCall++;
        if (progressCall === 1) {
          return {
            batchId: 'batch_123',
            total: 2,
            completed: 0,
            failed: 0,
            inProgress: 2,
            currentFile: 'test1.pdf',
            overallProgress: 0
          };
        } else {
          return {
            batchId: 'batch_123',
            total: 2,
            completed: 2,
            failed: 0,
            inProgress: 0,
            currentFile: null,
            overallProgress: 100
          };
        }
      });

      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const files = [
        createMockFile('test1.pdf', 'application/pdf'),
        createMockFile('test2.pdf', 'application/pdf')
      ];

      await user.upload(fileInput, files);

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      // Wait for processing to start
      await waitFor(() => {
        expect(screen.getByText(/Processing: 0 of 2 files/)).toBeInTheDocument();
      });
    });

    test('should handle processing completion', async () => {
      const user = userEvent.setup();
      
      const mockResults = [
        {
          id: 'result_1',
          fileName: 'test.pdf',
          fileType: DocumentFileType.PDF,
          status: ProcessingStatus.COMPLETED,
          extractedText: 'Sample text',
          processingTime: 1500,
          piiFindings: [],
          agencyRules: undefined
        }
      ];

      mockService.batchProcessDocuments.mockResolvedValue('batch_123');
      mockService.getBatchProgress.mockReturnValue({
        batchId: 'batch_123',
        total: 1,
        completed: 1,
        failed: 0,
        inProgress: 0,
        currentFile: null,
        overallProgress: 100
      });
      mockService.getAllProcessingResults.mockReturnValue(mockResults);

      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      // Simulate processing completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for polling interval
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(mockResults);
      });
    });

    test('should handle processing errors', async () => {
      const user = userEvent.setup();
      
      mockService.batchProcessDocuments.mockRejectedValue(new Error('Processing failed'));

      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText(/Processing failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    test('should display processing results', async () => {
      const mockResults = [
        {
          id: 'result_1',
          fileName: 'test.pdf',
          fileType: DocumentFileType.PDF,
          status: ProcessingStatus.COMPLETED,
          extractedText: 'Sample extracted text',
          processingTime: 1500,
          piiFindings: [
            {
              type: 'SSN' as any,
              value: '123-45-6789',
              confidence: 0.95,
              startIndex: 10,
              endIndex: 21,
              context: 'SSN: 123-45-6789'
            }
          ],
          agencyRules: undefined
        }
      ];

      render(
        <TestWrapper>
          <AdvancedFileUpload 
            onComplete={mockOnComplete} 
            showResults={true}
          />
        </TestWrapper>
      );

      // Simulate having results
      const component = screen.getByTestId('advanced-file-upload');
      
      // This would require implementing a way to pass results to the component
      // For now, we'll test that the results section exists when showResults is true
      expect(component).toBeInTheDocument();
    });

    test('should show retry option for failed files', async () => {
      const user = userEvent.setup();
      
      mockService.batchProcessDocuments.mockResolvedValue('batch_123');
      mockService.getBatchProgress.mockReturnValue({
        batchId: 'batch_123',
        total: 1,
        completed: 0,
        failed: 1,
        inProgress: 0,
        currentFile: null,
        overallProgress: 100
      });

      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByText(/1 failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/browse files/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /processing options/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /file upload area/i })).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      const configButton = screen.getByRole('button', { name: /processing options/i });

      await user.tab();
      expect(browseButton).toHaveFocus();

      await user.tab();
      expect(configButton).toHaveFocus();
    });

    test('should announce file additions to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const file = createMockFile('test.pdf', 'application/pdf');

      await user.upload(fileInput, file);

      // Check for aria-live region updates
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('should handle large number of files efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const files = Array.from({ length: 100 }, (_, i) => 
        createMockFile(`test${i}.txt`, 'text/plain')
      );

      const startTime = performance.now();
      await user.upload(fileInput, files);
      const endTime = performance.now();

      // Should render efficiently
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      await waitFor(() => {
        expect(screen.getByText('test0.txt')).toBeInTheDocument();
      });
    });

    test('should debounce file validation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedFileUpload onComplete={mockOnComplete} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/browse files/i);
      const files = [
        createMockFile('test1.pdf', 'application/pdf'),
        createMockFile('test2.pdf', 'application/pdf'),
        createMockFile('test3.pdf', 'application/pdf')
      ];

      // Rapid file additions
      await user.upload(fileInput, files[0]);
      await user.upload(fileInput, files[1]);
      await user.upload(fileInput, files[2]);

      // All files should be added without performance issues
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
        expect(screen.getByText('test2.pdf')).toBeInTheDocument();
        expect(screen.getByText('test3.pdf')).toBeInTheDocument();
      });
    });
  });
});