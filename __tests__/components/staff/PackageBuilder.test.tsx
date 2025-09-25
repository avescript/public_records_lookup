/**
 * Package Builder Component Tests
 * Epic 6: Package & Delivery (Mock Sends)
 * US-060: Build combined package with cover sheet & index
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PackageBuilder } from '../../../src/components/staff/PackageBuilder';

const theme = createTheme();

// Simple mock data that matches component expectations
const mockAssociatedRecords = [
  {
    candidateId: 'record-1',
    title: 'Police Report #12345',
    description: 'Traffic incident report',
    source: 'Police Department Records',
    agency: 'Police',
    relevanceScore: 0.95,
    confidence: 'high' as const,
    keyPhrases: ['traffic', 'incident'],
    acceptedBy: 'staff@city.gov',
    acceptedAt: { toDate: () => new Date('2024-01-15') },
    metadata: { pageCount: 3 },
    recordType: 'document',
    dateCreated: '2024-01-10'
  }
];

const mockRequestInfo = {
  title: 'Traffic Records Request',
  contactEmail: 'citizen@example.com',
  department: 'police',
  submittedAt: { toDate: () => new Date('2024-01-10') },
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  requestId: 'req-123',
  associatedRecords: mockAssociatedRecords,
  requestInfo: mockRequestInfo,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PackageBuilder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders configure package dialog when opened', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    expect(screen.getByText('Configure Package')).toBeInTheDocument();
    expect(screen.getByLabelText('Package Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Traffic Records Request')).toBeInTheDocument();
  });

  it('displays associated records information', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    expect(screen.getByText('Records to Include (1)')).toBeInTheDocument();
    expect(screen.getByText('Police Report #12345')).toBeInTheDocument();
    expect(screen.getByText('Police Department Records • 3 pages')).toBeInTheDocument();
  });

  it('shows package summary', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    expect(screen.getByText(/Package will include:/)).toBeInTheDocument();
    expect(screen.getByText(/• Cover sheet with request details/)).toBeInTheDocument();
    expect(screen.getByText(/• 1 selected records/)).toBeInTheDocument();
    expect(screen.getByText(/• Estimated total: 4 pages/)).toBeInTheDocument();
  });

  it('allows editing package title', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    const titleInput = screen.getByLabelText('Package Title');
    fireEvent.change(titleInput, { target: { value: 'Custom Title' } });
    
    expect(titleInput).toHaveValue('Custom Title');
  });

  it('displays confidence chips correctly', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    const highConfidenceChip = screen.getByText('HIGH');
    expect(highConfidenceChip).toBeInTheDocument();
  });

  it('closes dialog when Cancel clicked', () => {
    const mockOnClose = jest.fn();
    
    renderWithTheme(
      <PackageBuilder {...defaultProps} onClose={mockOnClose} />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables Next button when title is empty', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    const titleInput = screen.getByLabelText('Package Title');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    const nextButton = screen.getByText('Next: Preview Package');
    expect(nextButton).toBeDisabled();
  });

  it('enables Next button when title is provided', () => {
    renderWithTheme(<PackageBuilder {...defaultProps} />);
    
    const nextButton = screen.getByText('Next: Preview Package');
    expect(nextButton).not.toBeDisabled();
  });

  it('handles empty associated records', () => {
    renderWithTheme(
      <PackageBuilder {...defaultProps} associatedRecords={[]} />
    );
    
    expect(screen.getByText('Records to Include (0)')).toBeInTheDocument();
    expect(screen.getByText(/• 0 selected records/)).toBeInTheDocument();
  });

  it('renders with closed state', () => {
    renderWithTheme(
      <PackageBuilder {...defaultProps} open={false} />
    );
    
    // Dialog should not be visible when closed
    expect(screen.queryByText('Configure Package')).not.toBeInTheDocument();
  });
});