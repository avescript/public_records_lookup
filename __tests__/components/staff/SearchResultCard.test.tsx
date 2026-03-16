import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SearchResultCard } from '../../../src/components/staff/EnhancedSearch/SearchResultCard';
import { EnhancedMatchCandidate } from '../../../src/services/enhancedAIRecordService';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('SearchResultCard', () => {
  const mockResult: EnhancedMatchCandidate = {
    id: 'test-record-1',
    title: 'Police Use of Force Report - Case #2025-UF-445',
    description:
      'Detailed use of force report involving Officer Martinez during traffic stop. Includes body camera footage analysis and witness statements.',
    source: 'Police Internal Affairs',
    relevanceScore: 0.95,
    confidence: 'high',
    keyPhrases: [
      'use of force',
      'body camera',
      'traffic stop',
      'Officer Martinez',
    ],
    distanceScore: 0.05,
    recordType: 'Use of Force Report',
    dateCreated: '2025-09-15T14:30:00Z',
    agency: 'Police',
    metadata: {
      fileSize: '4.2 MB',
      pageCount: 18,
      lastModified: '2025-09-20T10:15:00Z',
      classification: 'Restricted',
    },
    confidenceScore: 92,
    semanticScore: 0.94,
    keywordScore: 0.88,
    snippets: [
      {
        text: 'Officer Martinez initiated use of force procedures',
        highlights: [{ start: 17, end: 30, term: 'use of force' }],
        contextBefore: 'Officer Martinez initiated ',
        contextAfter: ' procedures during the incident',
      },
    ],
    recordSummary:
      'Use of force incident involving traffic stop with body camera evidence.',
    relatedRecords: ['test-record-2', 'test-record-3'],
  };

  const defaultProps = {
    result: mockResult,
    onPreview: jest.fn(),
    onSelect: jest.fn(),
    onStar: jest.fn(),
    selected: false,
    starred: false,
    showDetails: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders result card correctly', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText(mockResult.title)).toBeInTheDocument();
    expect(screen.getByText(mockResult.agency)).toBeInTheDocument();
    expect(screen.getByText(mockResult.recordType)).toBeInTheDocument();
    expect(screen.getByText(/Sep 15, 2025/)).toBeInTheDocument();
  });

  it('displays confidence score badge', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('shows relevance, semantic, and keyword scores', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Relevance')).toBeInTheDocument();
    expect(screen.getByText('Semantic')).toBeInTheDocument();
    expect(screen.getByText('Keywords')).toBeInTheDocument();

    // Check percentage values
    expect(screen.getByText('95%')).toBeInTheDocument(); // Relevance
    expect(screen.getByText('94%')).toBeInTheDocument(); // Semantic
    expect(screen.getByText('88%')).toBeInTheDocument(); // Keywords
  });

  it('displays key phrases as chips', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    mockResult.keyPhrases.forEach(phrase => {
      expect(screen.getByText(phrase)).toBeInTheDocument();
    });
  });

  it('shows snippets with highlights', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/highlighted content/i)).toBeInTheDocument();
    expect(screen.getByText(/Officer Martinez initiated/)).toBeInTheDocument();
  });

  it('handles card click for preview', async () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    const card = screen.getByText(mockResult.title).closest('[role="button"]');
    fireEvent.click(card!);

    await waitFor(() => {
      expect(defaultProps.onPreview).toHaveBeenCalledWith(mockResult.id);
    });
  });

  it('handles star button click', async () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    const starButton = screen.getByLabelText(/star/i);
    fireEvent.click(starButton);

    await waitFor(() => {
      expect(defaultProps.onStar).toHaveBeenCalledWith(mockResult.id);
    });
  });

  it('shows starred state correctly', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} starred={true} />
      </TestWrapper>
    );

    // Starred icon should be filled
    const starButton = screen.getByLabelText(/star/i);
    expect(starButton).toHaveAttribute('color', 'warning');
  });

  it('shows selected state with border', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} selected={true} />
      </TestWrapper>
    );

    const card = screen.getByText(mockResult.title).closest('.MuiCard-root');
    expect(card).toHaveStyle({ 'border-width': '2px' });
  });

  it('expands and collapses details section', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} showDetails={true} />
      </TestWrapper>
    );

    // Initially collapsed
    expect(screen.queryByText('Record Metadata')).not.toBeInTheDocument();

    // Click to expand
    const moreDetailsButton = screen.getByRole('button', {
      name: /more details/i,
    });
    fireEvent.click(moreDetailsButton);

    expect(screen.getByText('Record Metadata')).toBeInTheDocument();
    expect(screen.getByText('4.2 MB')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();

    // Click to collapse
    const lessDetailsButton = screen.getByRole('button', {
      name: /less details/i,
    });
    fireEvent.click(lessDetailsButton);

    expect(screen.queryByText('Record Metadata')).not.toBeInTheDocument();
  });

  it('displays AI summary when expanded', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} showDetails={true} />
      </TestWrapper>
    );

    // Expand details
    const moreDetailsButton = screen.getByRole('button', {
      name: /more details/i,
    });
    fireEvent.click(moreDetailsButton);

    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByText(mockResult.recordSummary!)).toBeInTheDocument();
  });

  it('shows related records when expanded', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} showDetails={true} />
      </TestWrapper>
    );

    // Expand details
    const moreDetailsButton = screen.getByRole('button', {
      name: /more details/i,
    });
    fireEvent.click(moreDetailsButton);

    expect(screen.getByText('Related Records')).toBeInTheDocument();
    expect(screen.getByText('Record 2')).toBeInTheDocument(); // Last 3 chars of test-record-2
    expect(screen.getByText('Record 3')).toBeInTheDocument(); // Last 3 chars of test-record-3
  });

  it('handles related record clicks', async () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} showDetails={true} />
      </TestWrapper>
    );

    // Expand details
    const moreDetailsButton = screen.getByRole('button', {
      name: /more details/i,
    });
    fireEvent.click(moreDetailsButton);

    // Click on related record
    const relatedRecord = screen.getByText('Record 2');
    fireEvent.click(relatedRecord);

    await waitFor(() => {
      expect(defaultProps.onPreview).toHaveBeenCalledWith('test-record-2');
    });
  });

  it('opens context menu on more options click', async () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    const moreButton = screen.getByLabelText(/more/i);
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });
  });

  it('handles context menu actions', async () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    const moreButton = screen.getByLabelText(/more/i);
    fireEvent.click(moreButton);

    const previewOption = await screen.findByText('Preview');
    fireEvent.click(previewOption);

    await waitFor(() => {
      expect(defaultProps.onPreview).toHaveBeenCalledWith(mockResult.id);
    });
  });

  it('truncates long descriptions', () => {
    const longResult = {
      ...mockResult,
      description:
        'This is a very long description that should be truncated when displayed in the card to prevent it from taking up too much space and making the UI look cluttered.',
    };

    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} result={longResult} />
      </TestWrapper>
    );

    // Text should be visually truncated via CSS
    const description = screen.getByText(longResult.description);
    expect(description).toHaveStyle({
      overflow: 'hidden',
      display: '-webkit-box',
      '-webkit-line-clamp': '2',
    });
  });

  it('handles empty or missing optional data gracefully', () => {
    const minimalResult: EnhancedMatchCandidate = {
      ...mockResult,
      snippets: [],
      recordSummary: undefined,
      relatedRecords: undefined,
      metadata: {},
    };

    render(
      <TestWrapper>
        <SearchResultCard
          {...defaultProps}
          result={minimalResult}
          showDetails={true}
        />
      </TestWrapper>
    );

    // Should still render without errors
    expect(screen.getByText(minimalResult.title)).toBeInTheDocument();
    expect(screen.queryByText(/highlighted content/i)).not.toBeInTheDocument();
  });

  it('shows correct agency icon based on agency type', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    // Police agency should show Security icon
    const avatar = screen
      .getByText(mockResult.title)
      .closest('.MuiCardContent-root')
      ?.querySelector('.MuiAvatar-root');

    expect(avatar).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <TestWrapper>
        <SearchResultCard {...defaultProps} />
      </TestWrapper>
    );

    // Should format ISO date to readable format
    expect(screen.getByText('Sep 15, 2025')).toBeInTheDocument();
  });
});
