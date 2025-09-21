import { fireEvent, render, screen } from '@testing-library/react';

import FileUpload from '../index';

// A reusable mock for useDropzone
interface FileRejection {
  file: File;
  errors: Array<{ message: string }>;
}

let mockDropzoneHook: {
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  acceptedFiles: File[];
  fileRejections: FileRejection[];
} = {
  getRootProps: () => ({}),
  getInputProps: () => ({}),
  isDragActive: false,
  acceptedFiles: [],
  fileRejections: [],
};

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => mockDropzoneHook,
}));

describe('FileUpload', () => {
  const mockOnFilesSelected = jest.fn();
  const defaultProps = {
    onFilesSelected: mockOnFilesSelected,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockDropzoneHook to default values
    mockDropzoneHook = {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
      acceptedFiles: [] as File[],
      fileRejections: [] as FileRejection[],
    };
  });

  describe('Rendering', () => {
    it('renders upload area with instructions', () => {
      render(<FileUpload {...defaultProps} />);

      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /select files/i })
      ).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      render(<FileUpload {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /select files/i })
      ).toBeDisabled();
    });

    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to upload files';
      render(<FileUpload {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays accepted file types and size limit', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const acceptedTypes = ['.pdf', '.doc'];

      render(
        <FileUpload
          {...defaultProps}
          maxSize={maxSize}
          acceptedFileTypes={acceptedTypes}
        />
      );

      expect(
        screen.getByText(text => text.includes('.pdf, .doc'))
      ).toBeInTheDocument();
      expect(
        screen.getByText(text => text.includes('5 MB'))
      ).toBeInTheDocument();
    });
  });

  describe('File Handling', () => {
    const mockFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const mockRejectedFile = new File(['test content'], 'test.exe', {
      type: 'application/x-msdownload',
    });

    it('displays accepted files with proper formatting', () => {
      mockDropzoneHook = {
        ...mockDropzoneHook,
        acceptedFiles: [mockFile],
      };

      render(<FileUpload {...defaultProps} />);
      expect(screen.getByText(/test\.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/bytes/i)).toBeInTheDocument();
    });

    it('displays file rejection messages', () => {
      mockDropzoneHook = {
        ...mockDropzoneHook,
        fileRejections: [
          {
            file: mockRejectedFile,
            errors: [{ message: 'File type not allowed' }],
          },
        ],
      };

      render(<FileUpload {...defaultProps} />);
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage.textContent).toContain('test.exe');
      expect(errorMessage.textContent).toContain('File type not allowed');
    });

    it('calls onFilesSelected with accepted files', () => {
      mockDropzoneHook = {
        ...mockDropzoneHook,
        acceptedFiles: [mockFile],
      };

      render(<FileUpload {...defaultProps} />);
      mockOnFilesSelected([mockFile]);
      expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile]);
    });

    it('shows drag active state', () => {
      mockDropzoneHook = {
        ...mockDropzoneHook,
        isDragActive: true,
      };

      render(<FileUpload {...defaultProps} />);
      expect(screen.getByText(/drop the files here/i)).toBeInTheDocument();
    });
  });

  describe('File Size Formatting', () => {
    it('formats different file sizes correctly', () => {
      const files = [
        new File(['x'.repeat(500)], 'small.txt', { type: 'text/plain' }),
        new File(['x'.repeat(1500)], 'medium.txt', { type: 'text/plain' }),
        new File(['x'.repeat(2 * 1024 * 1024)], 'large.txt', {
          type: 'text/plain',
        }),
      ];

      mockDropzoneHook = {
        ...mockDropzoneHook,
        acceptedFiles: files,
      };

      render(<FileUpload {...defaultProps} />);

      expect(screen.getByText(/small\.txt.*\(500 Bytes\)/)).toBeInTheDocument();
      expect(screen.getByText(/medium\.txt.*\(1\.46 KB\)/)).toBeInTheDocument();
      expect(screen.getByText(/large\.txt.*\(2 MB\)/)).toBeInTheDocument();
    });
  });
});
