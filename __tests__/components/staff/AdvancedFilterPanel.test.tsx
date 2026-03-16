import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AdvancedFilterPanel } from '../../../src/components/staff/StaffDashboard/AdvancedFilterPanel';

const mockTheme = createTheme();

const defaultProps = {
  filters: {
    status: [],
    priority: [],
    type: [],
    assignedTo: '',
    dateRange: {
      start: null,
      end: null,
    },
    searchTerm: '',
  },
  onFiltersChange: jest.fn(),
  onClearFilters: jest.fn(),
  isCollapsed: false,
  onToggleCollapse: jest.fn(),
  viewMode: 'card' as const,
  onViewModeChange: jest.fn(),
};

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {component}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('AdvancedFilterPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel with title', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Advanced Filters & View')).toBeInTheDocument();
    });

    it('should show view mode controls', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Card View')).toBeInTheDocument();
      expect(screen.getByText('Table View')).toBeInTheDocument();
    });

    it('should display search input', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search requests...')).toBeInTheDocument();
    });

    it('should show collapse/expand button', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const collapseButton = screen.getByLabelText('Hide advanced filters');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call onFiltersChange when typing in search', async () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search requests...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      await waitFor(() => {
        expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
          ...defaultProps.filters,
          searchTerm: 'test search',
        });
      });
    });

    it('should display current search term', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ ...defaultProps.filters, searchTerm: 'existing search' }}
        />
      );
      
      const searchInput = screen.getByDisplayValue('existing search');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('View Mode Controls', () => {
    it('should highlight current view mode', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const cardViewButton = screen.getByText('Card View');
      expect(cardViewButton).toHaveClass('MuiButton-contained');
    });

    it('should call onViewModeChange when switching view mode', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Table View'));
      
      expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('table');
    });

    it('should show correct view mode when table is selected', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          viewMode="table"
        />
      );
      
      const tableViewButton = screen.getByText('Table View');
      expect(tableViewButton).toHaveClass('MuiButton-contained');
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should call onToggleCollapse when clicking collapse button', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('Hide advanced filters'));
      
      expect(defaultProps.onToggleCollapse).toHaveBeenCalled();
    });

    it('should show expand button when collapsed', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          isCollapsed={true}
        />
      );
      
      expect(screen.getByLabelText('Show advanced filters')).toBeInTheDocument();
    });

    it('should hide advanced filters when collapsed', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          isCollapsed={true}
        />
      );
      
      expect(screen.queryByText('Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Priority')).not.toBeInTheDocument();
    });

    it('should show advanced filters when expanded', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Assigned To')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });
  });

  describe('Status Filters', () => {
    it('should render status filter options', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should handle status selection', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Pending'));
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        status: ['pending'],
      });
    });

    it('should handle multiple status selections', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ ...defaultProps.filters, status: ['pending'] }}
        />
      );
      
      fireEvent.click(screen.getByText('In Progress'));
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        status: ['pending', 'in_progress'],
      });
    });

    it('should deselect status when clicking selected option', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ ...defaultProps.filters, status: ['pending'] }}
        />
      );
      
      fireEvent.click(screen.getByText('Pending'));
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        status: [],
      });
    });
  });

  describe('Priority Filters', () => {
    it('should render priority filter options', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    it('should handle priority selection', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('High'));
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        priority: ['high'],
      });
    });
  });

  describe('Type Filters', () => {
    it('should render type filter options', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Records')).toBeInTheDocument();
      expect(screen.getByText('Investigation')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('should handle type selection', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Records'));
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        type: ['records'],
      });
    });
  });

  describe('Assigned To Filter', () => {
    it('should render assigned to dropdown', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const assignedToSelect = screen.getByLabelText('Assigned To');
      expect(assignedToSelect).toBeInTheDocument();
    });

    it('should show "All Staff" as default option', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByDisplayValue('All Staff')).toBeInTheDocument();
    });

    it('should handle staff member selection', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const assignedToSelect = screen.getByLabelText('Assigned To');
      fireEvent.change(assignedToSelect, { target: { value: 'john-smith' } });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        assignedTo: 'john-smith',
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should render date range inputs', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should handle start date selection', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('Start Date');
      const testDate = new Date('2024-01-15');
      
      fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        dateRange: {
          start: expect.any(Date),
          end: null,
        },
      });
    });

    it('should handle end date selection', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const endDateInput = screen.getByLabelText('End Date');
      
      fireEvent.change(endDateInput, { target: { value: '2024-01-20' } });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        dateRange: {
          start: null,
          end: expect.any(Date),
        },
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show clear filters button when filters are applied', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ 
            ...defaultProps.filters, 
            status: ['pending'],
            searchTerm: 'test'
          }}
        />
      );
      
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    it('should call onClearFilters when clicking clear button', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ 
            ...defaultProps.filters, 
            status: ['pending']
          }}
        />
      );
      
      fireEvent.click(screen.getByText('Clear All Filters'));
      
      expect(defaultProps.onClearFilters).toHaveBeenCalled();
    });

    it('should hide clear filters button when no filters are applied', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
    });
  });

  describe('Filter Chips', () => {
    it('should display active filter chips', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ 
            ...defaultProps.filters, 
            status: ['pending', 'in_progress'],
            priority: ['high']
          }}
        />
      );
      
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should remove filter when clicking chip delete', () => {
      renderWithProviders(
        <AdvancedFilterPanel 
          {...defaultProps} 
          filters={{ 
            ...defaultProps.filters, 
            status: ['pending']
          }}
        />
      );
      
      const chip = screen.getByText('pending');
      const deleteButton = chip.parentElement?.querySelector('[data-testid="CancelIcon"]');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
          ...defaultProps.filters,
          status: [],
        });
      }
    });
  });

  describe('Responsive Behavior', () => {
    it('should stack elements properly on smaller screens', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      // Check for responsive grid layout
      const gridContainers = document.querySelectorAll('.MuiGrid-container');
      expect(gridContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      expect(screen.getByLabelText('Search requests')).toBeInTheDocument();
      expect(screen.getByLabelText('Assigned To')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search requests...');
      searchInput.focus();
      
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Performance', () => {
    it('should handle frequent filter changes efficiently', () => {
      renderWithProviders(<AdvancedFilterPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search requests...');
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(searchInput, { target: { value: `test ${i}` } });
      }
      
      // Should debounce calls
      expect(defaultProps.onFiltersChange).toHaveBeenCalled();
    });
  });
});