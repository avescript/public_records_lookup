import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFPreview from '../../../src/components/shared/PDFPreview';
import { piiDetectionService, PIIType } from '../../../src/services/piiDetectionService';

// Mock react-pdf
jest.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess, onLoadError }: any) => {
    // Simulate successful load
    React.useEffect(() => {
      if (onLoadSuccess) {
        onLoadSuccess({ numPages: 2 });
      }
    }, [onLoadSuccess]);
    
    return <div data-testid="mock-document">{children}</div>;
  },
  Page: ({ pageNumber, scale }: any) => (
    <div data-testid={`mock-page-${pageNumber}`} data-scale={scale}>
      Mock PDF Page {pageNumber}
    </div>
  ),
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}));

// Mock the PDF worker
jest.mock('../../../src/lib/pdf-worker', () => ({}));

// Mock PII Detection Service
jest.mock('../../../src/services/piiDetectionService', () => ({
  piiDetectionService: {
    getFindingsForRecord: jest.fn(),
  },
  PIIType: {
    SSN: 'SSN',
    PHONE: 'PHONE',
    ADDRESS: 'ADDRESS',
    PERSON_NAME: 'PERSON_NAME',
    EMAIL: 'EMAIL',
  },
}));

const mockFindings = [
  {
    recordId: '1',
    fileName: 'test.pdf',
    pageNumber: 1,
    piiType: 'SSN' as PIIType,
    confidence: 0.95,
    x: 100,
    y: 200,
    width: 120,
    height: 15,
    text: '123-45-6789',
    reasoning: 'Pattern matches SSN format',
  },
  {
    recordId: '1',
    fileName: 'test.pdf',
    pageNumber: 1,
    piiType: 'PHONE' as PIIType,
    confidence: 0.88,
    x: 200,
    y: 300,
    width: 100,
    height: 15,
    text: '(555) 123-4567',
    reasoning: 'Phone number pattern',
  },
];

describe('PDFPreview', () => {
  const defaultProps = {
    recordId: '1',
    fileName: 'test.pdf',
  };

  beforeEach(() => {
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockResolvedValue({
      recordId: '1',
      findings: mockFindings,
      totalFindings: 2,
      highConfidenceFindings: 1,
      piiTypesDetected: ['SSN', 'PHONE'],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render PDF preview with basic controls', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PDF Preview: test.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('Zoom Out')).toBeInTheDocument();
    expect(screen.getByText('Zoom In')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should load PII findings on mount', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(piiDetectionService.getFindingsForRecord).toHaveBeenCalledWith('1');
    });
  });

  it('should call onPIIFindingsLoad callback when findings are loaded', async () => {
    const mockCallback = jest.fn();
    render(<PDFPreview {...defaultProps} onPIIFindingsLoad={mockCallback} />);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockFindings);
    });
  });

  it('should display PII overlay controls when findings exist', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Show PII Overlays/)).toBeInTheDocument();
    });

    expect(screen.getByText('SSN')).toBeInTheDocument();
    expect(screen.getByText('PHONE')).toBeInTheDocument();
  });

  it('should handle zoom controls', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Fit (100%)')).toBeInTheDocument();
    });

    // Test zoom in
    fireEvent.click(screen.getByText('Zoom In'));
    await waitFor(() => {
      expect(screen.getByText('Fit (120%)')).toBeInTheDocument();
    });

    // Test zoom out
    fireEvent.click(screen.getByText('Zoom Out'));
    await waitFor(() => {
      expect(screen.getByText('Fit (100%)')).toBeInTheDocument();
    });

    // Test fit to width
    fireEvent.click(screen.getByText('Zoom In'));
    fireEvent.click(screen.getByText(/Fit \(\d+%\)/));
    await waitFor(() => {
      expect(screen.getByText('Fit (100%)')).toBeInTheDocument();
    });
  });

  it('should handle page navigation', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    // Test next page
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    // Test previous page
    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });

  it('should disable navigation buttons at boundaries', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      const prevButton = screen.getByText('Previous').closest('button');
      const nextButton = screen.getByText('Next').closest('button');
      
      expect(prevButton).toBeDisabled(); // Should be disabled on page 1
      expect(nextButton).not.toBeDisabled();
    });

    // Navigate to last page
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      const prevButton = screen.getByText('Previous').closest('button');
      const nextButton = screen.getByText('Next').closest('button');
      
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).toBeDisabled(); // Should be disabled on last page
    });
  });

  it('should toggle PII overlays visibility', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      const overlayToggle = screen.getByRole('checkbox', { name: /Show PII Overlays/ });
      expect(overlayToggle).toBeChecked(); // Should be enabled by default
    });

    // Toggle off
    const overlayToggle = screen.getByRole('checkbox', { name: /Show PII Overlays/ });
    fireEvent.click(overlayToggle);
    expect(overlayToggle).not.toBeChecked();

    // Toggle back on
    fireEvent.click(overlayToggle);
    expect(overlayToggle).toBeChecked();
  });

  it('should filter PII types', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      const ssnChip = screen.getByText('SSN');
      const phoneChip = screen.getByText('PHONE');
      
      expect(ssnChip).toBeInTheDocument();
      expect(phoneChip).toBeInTheDocument();
    });

    // Click to toggle off SSN
    fireEvent.click(screen.getByText('SSN'));
    // The chip should still be there but with different styling (this would need visual testing)
    expect(screen.getByText('SSN')).toBeInTheDocument();
  });

  it('should handle service errors gracefully', async () => {
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockRejectedValue(
      new Error('Service error')
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading PII findings:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should display Phase 0 fallback when PDF fails to load', async () => {
    // Mock Document component to simulate load error
    const MockDocumentWithError = ({ onLoadError }: any) => {
      React.useEffect(() => {
        if (onLoadError) {
          onLoadError(new Error('PDF load failed'));
        }
      }, [onLoadError]);
      
      return null;
    };

    jest.doMock('react-pdf', () => ({
      Document: MockDocumentWithError,
      Page: () => <div>Mock Page</div>,
      pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
    }));

    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PDF Preview Not Available (Phase 0)')).toBeInTheDocument();
      expect(screen.getByText(/This is a Phase 0 implementation/)).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Mock Document to not call onLoadSuccess immediately
    const MockDocumentLoading = () => <div data-testid="mock-document">Loading...</div>;
    
    jest.doMock('react-pdf', () => ({
      Document: MockDocumentLoading,
      Page: () => <div>Mock Page</div>,
      pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
    }));

    render(<PDFPreview {...defaultProps} />);

    expect(screen.getByText('Loading PDF preview...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show current page findings in overlay controls', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      // Both findings are on page 1, so should show "2 on this page"
      expect(screen.getByText(/2 on this page/)).toBeInTheDocument();
    });
  });

  it('should disable zoom buttons at limits', async () => {
    render(<PDFPreview {...defaultProps} />);

    await waitFor(() => {
      const zoomOutButton = screen.getByText('Zoom Out').closest('button');
      expect(zoomOutButton).not.toBeDisabled(); // Not at minimum yet
    });

    // Zoom out to minimum
    const zoomOutButton = screen.getByText('Zoom Out').closest('button');
    fireEvent.click(zoomOutButton!); // 80%
    fireEvent.click(zoomOutButton!); // 60%
    
    // Should be disabled at 50%
    await waitFor(() => {
      expect(zoomOutButton).toBeDisabled();
    });

    // Test zoom in limits
    const zoomInButton = screen.getByText('Zoom In').closest('button');
    
    // Zoom to maximum (multiple clicks to reach 300%)
    for (let i = 0; i < 10; i++) {
      if (!zoomInButton?.hasAttribute('disabled')) {
        fireEvent.click(zoomInButton!);
      }
    }
    
    await waitFor(() => {
      expect(zoomInButton).toBeDisabled();
    });
  });
});