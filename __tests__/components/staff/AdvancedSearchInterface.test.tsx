import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { AdvancedSearchInterface } from '../../../src/components/staff/EnhancedSearch/AdvancedSearchInterface';
import {
  EnhancedSearchOptions,
  SavedSearch,
} from '../../../src/services/enhancedAIRecordService';

// Test theme
const theme = createTheme();

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {children}
    </LocalizationProvider>
  </ThemeProvider>
);

describe('AdvancedSearchInterface', () => {
  const mockOnSearch = jest.fn();
  const mockOnSaveSearch = jest.fn();
  const mockOnLoadSavedSearch = jest.fn();

  const defaultProps = {
    onSearch: mockOnSearch,
    onSaveSearch: mockOnSaveSearch,
    onLoadSavedSearch: mockOnLoadSavedSearch,
    loading: false,
  };

  const mockSavedSearches: SavedSearch[] = [
    {
      id: 'saved-1',
      name: 'Police Reports',
      query: 'use of force police reports',
      filters: {
        agencies: ['Police'],
        confidenceThreshold: 0.8,
      },
      searchMode: 'hybrid',
      createdAt: '2026-01-15T10:00:00Z',
      lastUsed: '2026-02-01T14:30:00Z',
      resultCount: 23,
      userId: 'test-user',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search interface correctly', () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    expect(
      screen.getByPlaceholderText(/search records using natural language/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText(/quick searches/i)).toBeInTheDocument();
  });

  it('handles search input and submission', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'police reports' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'police reports',
          searchMode: 'hybrid',
          sortBy: 'relevance',
          includeSnippets: true,
        })
      );
    });
  });

  it('handles Enter key submission', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.keyPress(searchInput, {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test query',
        })
      );
    });
  });

  it('disables search button when query is empty', () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeDisabled();
  });

  it('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} loading={true} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    expect(searchInput).toBeDisabled();
  });

  it('handles quick suggestion clicks', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const suggestionChip = screen.getByText('police use of force reports');
    fireEvent.click(suggestionChip);

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    expect(searchInput).toHaveValue('police use of force reports');
  });

  it('toggles filters section', () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const filtersButton = screen.getByRole('button', { name: /filters/i });

    // Initially collapsed
    expect(screen.queryByText(/advanced filters/i)).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(filtersButton);
    expect(screen.getByText(/advanced filters/i)).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(filtersButton);
    expect(screen.queryByText(/advanced filters/i)).not.toBeInTheDocument();
  });

  it('handles search mode changes', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Change search mode
    const searchModeSelect = screen.getByLabelText(/search mode/i);
    fireEvent.mouseDown(searchModeSelect);

    const semanticOption = await screen.findByText('Semantic Search');
    fireEvent.click(semanticOption);

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          searchMode: 'semantic',
        })
      );
    });
  });

  it('displays saved searches correctly', () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface
          {...defaultProps}
          savedSearches={mockSavedSearches}
        />
      </TestWrapper>
    );

    const savedSearchesButton = screen.getByRole('button', {
      name: /saved searches \(1\)/i,
    });
    fireEvent.click(savedSearchesButton);

    expect(screen.getByText('Police Reports')).toBeInTheDocument();
    expect(screen.getByText('use of force police reports')).toBeInTheDocument();
  });

  it('loads saved search when clicked', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface
          {...defaultProps}
          savedSearches={mockSavedSearches}
        />
      </TestWrapper>
    );

    // Open saved searches
    const savedSearchesButton = screen.getByRole('button', {
      name: /saved searches \(1\)/i,
    });
    fireEvent.click(savedSearchesButton);

    // Click on saved search
    const savedSearchCard = screen
      .getByText('Police Reports')
      .closest('[role="button"]');
    expect(savedSearchCard).toBeInTheDocument();

    fireEvent.click(savedSearchCard!);

    await waitFor(() => {
      expect(mockOnLoadSavedSearch).toHaveBeenCalledWith(mockSavedSearches[0]);
    });

    // Check that input is updated
    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    expect(searchInput).toHaveValue('use of force police reports');
  });

  it('handles save search functionality', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} resultCount={15} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Open save dialog
    const saveButton = screen.getByRole('button', { name: /save search/i });
    fireEvent.click(saveButton);

    expect(screen.getByText(/save current search/i)).toBeInTheDocument();

    // Enter search name
    const nameInput = screen.getByPlaceholderText(/enter search name/i);
    fireEvent.change(nameInput, { target: { value: 'My Test Search' } });

    // Save the search
    const confirmSaveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(confirmSaveButton);

    await waitFor(() => {
      expect(mockOnSaveSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Test Search',
          query: 'test query',
          resultCount: 15,
        })
      );
    });
  });

  it('applies filters correctly', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    // Set agency filter
    const agencySelect = screen.getByLabelText(/agencies/i);
    fireEvent.mouseDown(agencySelect);

    const policeOption = await screen.findByText('Police');
    fireEvent.click(policeOption);

    // Close dropdown by clicking outside
    fireEvent.click(document.body);

    // Submit search
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            agencies: ['Police'],
          }),
        })
      );
    });
  });

  it('handles clear all functionality', () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('adjusts confidence threshold', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    // Find and adjust confidence slider
    const confidenceSlider = screen.getByRole('slider', {
      name: /confidence threshold/i,
    });

    // Simulate slider change
    fireEvent.change(confidenceSlider, { target: { value: '85' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            confidenceThreshold: 0.85,
          }),
        })
      );
    });
  });

  it('handles switch controls', async () => {
    render(
      <TestWrapper>
        <AdvancedSearchInterface {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(
      /search records using natural language/i
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Toggle include highlights switch
    const highlightsSwitch = screen.getByRole('checkbox', {
      name: /include highlights/i,
    });
    fireEvent.click(highlightsSwitch);

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          includeSnippets: false,
        })
      );
    });
  });
});
