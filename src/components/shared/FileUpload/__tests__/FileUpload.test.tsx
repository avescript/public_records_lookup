import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from './index';

describe('FileUpload', () => {
  const mockOnFilesSelected = jest.fn();
  const defaultProps = {
    onFilesSelected: mockOnFilesSelected,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area with instructions', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/select files/i)).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<FileUpload {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
    
    expect(screen.getByText('.pdf, .doc')).toBeInTheDocument();
    expect(screen.getByText('Maximum size: 5MB')).toBeInTheDocument();
  });
});
