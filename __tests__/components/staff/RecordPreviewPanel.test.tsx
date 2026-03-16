import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RecordPreviewPanel } from '../../../src/components/staff/EnhancedSearch/RecordPreviewPanel';
import enhancedAIRecordService from '../../../src/services/enhancedAIRecordService';

// Mock the service
jest.mock('../../../src/services/enhancedAIRecordService', () => ({
  getRecordPreview: jest.fn(),
}));

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RecordPreviewPanel', () => {
  const mockRecordData = {
    id: 'test-record-1',
    title: 'Police Use of Force Report - Case #2025-UF-445',
    content:
      'This is the full content of the record with important information about the incident. Officer Martinez responded to a traffic stop on Main Street.',
    highlights: [
      { start: 45, end: 56, term: 'information' },
      { start: 85, end: 100, term: 'Officer Martinez' },
    ],
    metadata: {
      fileSize: '4.2 MB',
      pageCount: 18,
      lastModified: '2025-09-20T10:15:00Z',
      classification: 'Restricted',
      creator: 'System',
      department: 'Police Internal Affairs',
    },
    summary: 'This is an AI-generated summary of the record content.',
  };

  const defaultProps = {
    recordId: 'test-record-1',
    onClose: jest.fn(),
    open: true,
    searchQuery: 'information Officer Martinez',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (enhancedAIRecordService.getRecordPreview as jest.Mock).mockResolvedValue(
      mockRecordData
    );
  });

  it('renders preview panel when open', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} open={false} />
      </TestWrapper>
    );

    expect(screen.queryByText(mockRecordData.title)).not.toBeInTheDocument();
  });

  it('loads record data on mount', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(enhancedAIRecordService.getRecordPreview).toHaveBeenCalledWith(
        'test-record-1',
        'information Officer Martinez'
      );
    });
  });

  it('shows loading state initially', () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error state on load failure', async () => {
    (enhancedAIRecordService.getRecordPreview as jest.Mock).mockRejectedValue(
      new Error('Failed to load')
    );

    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load record preview/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('handles retry on error', async () => {
    // First call fails, second succeeds
    (enhancedAIRecordService.getRecordPreview as jest.Mock)
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockRecordData);

    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load record preview/i)
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    expect(enhancedAIRecordService.getRecordPreview).toHaveBeenCalledTimes(2);
  });

  it('displays content tab with highlighted text', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Should be on content tab by default
    expect(screen.getByRole('tab', { name: /content/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Check for search match alert
    expect(screen.getByText(/found 2 matches/i)).toBeInTheDocument();

    // Content should be displayed
    expect(screen.getByText(/this is the full content/i)).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Click on Details tab
    const detailsTab = screen.getByRole('tab', { name: /details/i });
    fireEvent.click(detailsTab);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Record ID')).toBeInTheDocument();
  });

  it('displays metadata correctly in details tab', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Switch to details tab
    const detailsTab = screen.getByRole('tab', { name: /details/i });
    fireEvent.click(detailsTab);

    // Check metadata display
    expect(screen.getByText('4.2 MB')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Police Internal Affairs')).toBeInTheDocument();
  });

  it('displays search matches in details tab', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Switch to details tab
    const detailsTab = screen.getByRole('tab', { name: /details/i });
    fireEvent.click(detailsTab);

    // Check search matches section
    expect(screen.getByText('Search Matches')).toBeInTheDocument();
    expect(screen.getByText('information')).toBeInTheDocument();
    expect(screen.getByText('Officer Martinez')).toBeInTheDocument();
  });

  it('displays AI summary in summary tab', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Switch to summary tab
    const summaryTab = screen.getByRole('tab', { name: /summary/i });
    fireEvent.click(summaryTab);

    expect(
      screen.getByText(/this summary was generated by ai/i)
    ).toBeInTheDocument();
    expect(screen.getByText(mockRecordData.summary)).toBeInTheDocument();
  });

  it('shows message when no summary available', async () => {
    const dataWithoutSummary = { ...mockRecordData, summary: undefined };
    (enhancedAIRecordService.getRecordPreview as jest.Mock).mockResolvedValue(
      dataWithoutSummary
    );

    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Switch to summary tab
    const summaryTab = screen.getByRole('tab', { name: /summary/i });
    fireEvent.click(summaryTab);

    expect(screen.getByText(/no ai summary is available/i)).toBeInTheDocument();
  });

  it('displays history in history tab', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Switch to history tab
    const historyTab = screen.getByRole('tab', { name: /history/i });
    fireEvent.click(historyTab);

    expect(screen.getByText('Record Created')).toBeInTheDocument();
    expect(screen.getByText('Previewed')).toBeInTheDocument();
    expect(screen.getByText('Search Match')).toBeInTheDocument();
  });

  it('handles zoom controls', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Check initial zoom
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Zoom in
    const zoomInButton = screen.getByLabelText(/zoom in/i);
    fireEvent.click(zoomInButton);
    expect(screen.getByText('125%')).toBeInTheDocument();

    // Zoom out
    const zoomOutButton = screen.getByLabelText(/zoom out/i);
    fireEvent.click(zoomOutButton);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles fullscreen toggle', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    const fullscreenButton = screen.getByLabelText(/fullscreen/i);
    fireEvent.click(fullscreenButton);

    // Dialog should now be fullscreen (maxWidth=false and fullScreen=true)
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('handles close button click', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles action buttons', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Test download button
    const downloadButton = screen.getByLabelText(/download/i);
    expect(downloadButton).toBeInTheDocument();

    // Test share button
    const shareButton = screen.getByLabelText(/share/i);
    expect(shareButton).toBeInTheDocument();

    // Test print button
    const printButton = screen.getByLabelText(/print/i);
    expect(printButton).toBeInTheDocument();
  });

  it('highlights search terms in content', async () => {
    render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(mockRecordData.title)).toBeInTheDocument();
    });

    // Check that highlighted terms are styled
    const highlightedElements = screen.getAllByText((content, element) => {
      return (
        element?.tagName === 'SPAN' &&
        element.style.backgroundColor.includes('yellow')
      );
    });

    expect(highlightedElements.length).toBeGreaterThan(0);
  });

  it('handles recordId changes', async () => {
    const { rerender } = render(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(enhancedAIRecordService.getRecordPreview).toHaveBeenCalledWith(
        'test-record-1',
        'information Officer Martinez'
      );
    });

    // Change recordId
    rerender(
      <TestWrapper>
        <RecordPreviewPanel {...defaultProps} recordId='test-record-2' />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(enhancedAIRecordService.getRecordPreview).toHaveBeenCalledWith(
        'test-record-2',
        'information Officer Martinez'
      );
    });

    expect(enhancedAIRecordService.getRecordPreview).toHaveBeenCalledTimes(2);
  });
});
