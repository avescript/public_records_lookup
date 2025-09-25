import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PIIFindings from '../../../src/components/shared/PIIFindings';
import { piiDetectionService, PIIType, PIIFinding } from '../../../src/services/piiDetectionService';

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
    DOB: 'DOB',
    DRIVERS_LICENSE: 'DRIVERS_LICENSE',
    ACCOUNT_NUMBER: 'ACCOUNT_NUMBER',
    ROUTING_NUMBER: 'ROUTING_NUMBER',
    MEDICAL_ID: 'MEDICAL_ID',
  },
}));

const mockFindings: PIIFinding[] = [
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
  {
    recordId: '1',
    fileName: 'test.pdf',
    pageNumber: 2,
    piiType: 'ADDRESS' as PIIType,
    confidence: 0.75,
    x: 150,
    y: 250,
    width: 200,
    height: 30,
    text: '123 Main St, City, State',
    reasoning: 'Address pattern detected',
  },
  {
    recordId: '1',
    fileName: 'test.pdf',
    pageNumber: 1,
    piiType: 'EMAIL' as PIIType,
    confidence: 0.92,
    x: 300,
    y: 400,
    width: 150,
    height: 15,
    text: 'john@example.com',
    reasoning: 'Email format detected',
  },
];

describe('PIIFindings', () => {
  const defaultProps = {
    recordId: '1',
  };

  beforeEach(() => {
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockResolvedValue({
      recordId: '1',
      findings: mockFindings,
      totalFindings: 4,
      highConfidenceFindings: 3,
      piiTypesDetected: ['SSN', 'PHONE', 'ADDRESS', 'EMAIL'],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render PII findings header and stats', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PII Detection Results')).toBeInTheDocument();
      expect(screen.getByText('4 findings')).toBeInTheDocument();
    });

    expect(screen.getByText('4 total')).toBeInTheDocument();
    expect(screen.getByText('3 high confidence')).toBeInTheDocument();
    expect(screen.getByText('4 types')).toBeInTheDocument();
  });

  it('should group findings by type by default', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('SSN')).toBeInTheDocument();
      expect(screen.getByText('PHONE')).toBeInTheDocument();
      expect(screen.getByText('ADDRESS')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
    });

    // Each group should show count
    const ssnAccordion = screen.getByText('SSN').closest('.MuiAccordionSummary-root');
    expect(ssnAccordion).toBeInTheDocument();
  });

  it('should expand and collapse finding groups', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('SSN')).toBeInTheDocument();
    });

    // Initially, some groups should be expanded (SSN, PHONE)
    const ssnGroup = screen.getByText('SSN').closest('button');
    fireEvent.click(ssnGroup!);

    // Should collapse the group
    expect(ssnGroup).toBeInTheDocument();
  });

  it('should display individual PII findings with details', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      // Should show PII text and confidence
      expect(screen.getByText('123-45-6789')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    // Should show reasoning and location
    expect(screen.getByText('Pattern matches SSN format')).toBeInTheDocument();
    expect(screen.getByText(/Page 1, test.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/Coordinates: \(100, 200\)/)).toBeInTheDocument();
  });

  it('should handle finding selection callback', async () => {
    const mockCallback = jest.fn();
    render(<PIIFindings {...defaultProps} onFindingSelect={mockCallback} />);

    await waitFor(() => {
      expect(screen.getByText('123-45-6789')).toBeInTheDocument();
    });

    // Click on a finding
    const findingItem = screen.getByText('123-45-6789').closest('li');
    fireEvent.click(findingItem!);

    expect(mockCallback).toHaveBeenCalledWith(mockFindings[0]);
  });

  it('should filter by confidence level', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('4 findings')).toBeInTheDocument();
    });

    // Change filter to high confidence only
    const confidenceSelect = screen.getByLabelText('Confidence');
    fireEvent.mouseDown(confidenceSelect);
    const highOption = screen.getByText('High (≥80%)');
    fireEvent.click(highOption);

    // Should only show high confidence findings (3 out of 4)
    await waitFor(() => {
      expect(screen.getByText('3 findings')).toBeInTheDocument();
    });
  });

  it('should filter by high-risk PII types only', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('4 findings')).toBeInTheDocument();
    });

    // Toggle high-risk only filter
    const highRiskToggle = screen.getByText('High-risk only');
    fireEvent.click(highRiskToggle);

    // Should only show SSN findings (1 out of 4, as SSN is considered high-risk)
    await waitFor(() => {
      expect(screen.getByText('1 findings')).toBeInTheDocument();
    });
  });

  it('should show empty state when no findings exist', async () => {
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockResolvedValue({
      recordId: '1',
      findings: [],
      totalFindings: 0,
      highConfidenceFindings: 0,
      piiTypesDetected: [],
    });

    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No PII detected in this record')).toBeInTheDocument();
      expect(screen.getByText(/document appears to be safe for public release/)).toBeInTheDocument();
    });
  });

  it('should hide empty state when showEmptyState is false', async () => {
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockResolvedValue({
      recordId: '1',
      findings: [],
      totalFindings: 0,
      highConfidenceFindings: 0,
      piiTypesDetected: [],
    });

    const { container } = render(<PIIFindings {...defaultProps} showEmptyState={false} />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should handle service errors', async () => {
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockRejectedValue(
      new Error('Service error')
    );

    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PII Detection Results')).toBeInTheDocument();
      expect(screen.getByText('Service error')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Mock service to not resolve immediately
    (piiDetectionService.getFindingsForRecord as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PIIFindings {...defaultProps} />);

    expect(screen.getByText('PII Detection Results')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Analyzing document for PII...')).toBeInTheDocument();
  });

  it('should group findings by page when specified', async () => {
    render(<PIIFindings {...defaultProps} groupBy="page" />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 (test.pdf)')).toBeInTheDocument();
      expect(screen.getByText('Page 2 (test.pdf)')).toBeInTheDocument();
    });
  });

  it('should group findings by confidence level when specified', async () => {
    render(<PIIFindings {...defaultProps} groupBy="confidence" />);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument(); // 0.95, 0.92, 0.88
      expect(screen.getByText('Medium')).toBeInTheDocument(); // 0.75
    });
  });

  it('should group findings by file when specified', async () => {
    render(<PIIFindings {...defaultProps} groupBy="file" />);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should show no findings message when filters exclude all results', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('4 findings')).toBeInTheDocument();
    });

    // Apply filter that excludes all findings
    const confidenceSelect = screen.getByLabelText('Confidence');
    fireEvent.mouseDown(confidenceSelect);
    const lowOption = screen.getByText('Low (<70%)');
    fireEvent.click(lowOption);

    await waitFor(() => {
      expect(screen.getByText('No findings match the current filters.')).toBeInTheDocument();
    });
  });

  it('should display correct confidence icons and labels', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      // High confidence findings should show success icon
      const highConfidenceChips = screen.getAllByText(/9[25]%/);
      expect(highConfidenceChips.length).toBeGreaterThan(0);
      
      // Medium confidence findings
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should handle accordion expansion state management', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('SSN')).toBeInTheDocument();
    });

    const ssnAccordion = screen.getByText('SSN').closest('[aria-expanded]');
    const initialExpanded = ssnAccordion?.getAttribute('aria-expanded') === 'true';
    
    // Click to toggle
    fireEvent.click(screen.getByText('SSN'));
    
    await waitFor(() => {
      const newExpanded = ssnAccordion?.getAttribute('aria-expanded') === 'true';
      expect(newExpanded).toBe(!initialExpanded);
    });
  });

  it('should properly format finding details', async () => {
    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('123-45-6789')).toBeInTheDocument();
    });

    // Should show coordinate information
    expect(screen.getByText(/Coordinates: \(100, 200\) - 120 × 15/)).toBeInTheDocument();
  });

  it('should handle mixed confidence levels in filtering', async () => {
    // Add a low confidence finding to our mock data
    const lowConfidenceFinding: PIIFinding = {
      recordId: '1',
      fileName: 'test.pdf',
      pageNumber: 1,
      piiType: 'PERSON_NAME' as PIIType,
      confidence: 0.65,
      x: 50,
      y: 100,
      width: 80,
      height: 15,
      text: 'John Doe',
      reasoning: 'Name pattern but low confidence',
    };

    (piiDetectionService.getFindingsForRecord as jest.Mock).mockResolvedValue({
      recordId: '1',
      findings: [...mockFindings, lowConfidenceFinding],
      totalFindings: 5,
      highConfidenceFindings: 3,
      piiTypesDetected: ['SSN', 'PHONE', 'ADDRESS', 'EMAIL', 'PERSON_NAME'],
    });

    render(<PIIFindings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('5 findings')).toBeInTheDocument();
    });

    // Filter for medium confidence (70-79%)
    const confidenceSelect = screen.getByLabelText('Confidence');
    fireEvent.mouseDown(confidenceSelect);
    const mediumOption = screen.getByText('Medium (70-79%)');
    fireEvent.click(mediumOption);

    await waitFor(() => {
      expect(screen.getByText('1 findings')).toBeInTheDocument(); // Only ADDRESS at 0.75
    });
  });
});