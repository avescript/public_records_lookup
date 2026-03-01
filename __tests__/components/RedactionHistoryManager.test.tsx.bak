/**
 * Redaction History Manager Component Tests
 * US-V2-031: Testing version history and rollback functionality
 */

import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RedactionHistoryManager } from '../../src/components/staff/InteractiveRedactionEditor/RedactionHistoryManager';
import {
  EditorHistoryState,
  HistoryEntry,
} from '../../src/components/staff/InteractiveRedactionEditor/types';
import { theme } from '../../src/theme';

const mockHistoryEntries: HistoryEntry[] = [
  {
    id: 'history-1',
    timestamp: '2024-01-15T10:00:00Z',
    action: 'CREATE',
    description: 'Created SSN redaction',
    userId: 'user-1',
    userName: 'John Doe',
    redactionId: 'redaction-1',
    changes: {
      added: [
        {
          id: 'redaction-1',
          recordId: 'test-record',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 100,
          y: 100,
          width: 150,
          height: 25,
          shape: 'rectangle' as const,
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: 'user-1',
          type: 'manual' as const,
        },
      ],
      modified: [],
      removed: [],
    },
    qualityScore: 85,
    autoSaved: true,
    snapshot: {
      redactions: [
        {
          id: 'redaction-1',
          recordId: 'test-record',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 100,
          y: 100,
          width: 150,
          height: 25,
          shape: 'rectangle' as const,
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: 'user-1',
          type: 'manual' as const,
        },
      ],
      lastModified: '2024-01-15T10:00:00Z',
      version: 1,
    },
  },
  {
    id: 'history-2',
    timestamp: '2024-01-15T11:00:00Z',
    action: 'MODIFY',
    description: 'Adjusted redaction dimensions',
    userId: 'user-1',
    userName: 'John Doe',
    redactionId: 'redaction-1',
    changes: {
      added: [],
      modified: [
        {
          id: 'redaction-1',
          recordId: 'test-record',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 100,
          y: 100,
          width: 200, // Changed from 150
          height: 25,
          shape: 'rectangle' as const,
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: 'user-1',
          type: 'manual' as const,
        },
      ],
      removed: [],
    },
    qualityScore: 90,
    autoSaved: false,
    snapshot: {
      redactions: [
        {
          id: 'redaction-1',
          recordId: 'test-record',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 100,
          y: 100,
          width: 200,
          height: 25,
          shape: 'rectangle' as const,
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: 'user-1',
          type: 'manual' as const,
        },
      ],
      lastModified: '2024-01-15T11:00:00Z',
      version: 2,
    },
  },
  {
    id: 'history-3',
    timestamp: '2024-01-15T12:00:00Z',
    action: 'DELETE',
    description: 'Removed redundant redaction',
    userId: 'user-2',
    userName: 'Jane Smith',
    redactionId: 'redaction-2',
    changes: {
      added: [],
      modified: [],
      removed: [
        {
          id: 'redaction-2',
          recordId: 'test-record',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 300,
          y: 200,
          width: 100,
          height: 20,
          shape: 'ellipse' as const,
          createdAt: '2024-01-15T09:00:00Z',
          createdBy: 'user-2',
          type: 'ai-assisted' as const,
        },
      ],
    },
    qualityScore: 88,
    autoSaved: true,
    snapshot: {
      redactions: [
        {
          id: 'redaction-1',
          recordId: 'test-record',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 100,
          y: 100,
          width: 200,
          height: 25,
          shape: 'rectangle' as const,
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: 'user-1',
          type: 'manual' as const,
        },
      ],
      lastModified: '2024-01-15T12:00:00Z',
      version: 3,
    },
  },
];

const mockHistoryState: EditorHistoryState = {
  entries: mockHistoryEntries,
  currentIndex: 2, // Latest entry
  maxEntries: 50,
  hasUnsavedChanges: false,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RedactionHistoryManager', () => {
  const defaultProps = {
    history: mockHistoryState,
    onRestore: jest.fn(),
    onClearHistory: jest.fn(),
    onExportHistory: jest.fn(),
    currentSnapshot: mockHistoryEntries[2].snapshot,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('History Entry Display', () => {
    it('should render all history entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Created SSN redaction')).toBeInTheDocument();
      expect(
        screen.getByText('Adjusted redaction dimensions')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Removed redundant redaction')
      ).toBeInTheDocument();
    });

    it('should display entry timestamps', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText(/Jan 15, 2024, 10:00 AM/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024, 11:00 AM/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024, 12:00 PM/)).toBeInTheDocument();
    });

    it('should show user information for each entry', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getAllByText('John Doe')).toHaveLength(2);
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display action types with appropriate icons', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId('AddIcon')).toBeInTheDocument(); // CREATE action
      expect(screen.getByTestId('EditIcon')).toBeInTheDocument(); // MODIFY action
      expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument(); // DELETE action
    });

    it('should show quality scores for entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Quality: 85%')).toBeInTheDocument();
      expect(screen.getByText('Quality: 90%')).toBeInTheDocument();
      expect(screen.getByText('Quality: 88%')).toBeInTheDocument();
    });

    it('should indicate auto-saved vs manual saves', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const autoSaveIndicators = screen.getAllByTestId('AutoModeIcon');
      expect(autoSaveIndicators).toHaveLength(2); // Two auto-saved entries

      const manualSaveIndicator = screen.getByTestId('SaveIcon');
      expect(manualSaveIndicator).toBeInTheDocument();
    });
  });

  describe('Current Entry Highlighting', () => {
    it('should highlight the current history entry', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const historyEntries = screen.getAllByRole('listitem');
      expect(historyEntries[2]).toHaveClass('current'); // Latest entry should be current
    });

    it('should update highlighting when different entry is selected', async () => {
      const onRestore = jest.fn();
      render(
        <RedactionHistoryManager {...defaultProps} onRestore={onRestore} />,
        { wrapper: TestWrapper }
      );

      const firstEntry = screen.getAllByRole('listitem')[0];
      await userEvent.click(firstEntry);

      expect(onRestore).toHaveBeenCalledWith(mockHistoryEntries[0].snapshot);
    });
  });

  describe('Restore Functionality', () => {
    it('should show restore button for non-current entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      expect(restoreButtons).toHaveLength(2); // Two non-current entries
    });

    it('should call onRestore when restore button is clicked', async () => {
      const onRestore = jest.fn();
      render(
        <RedactionHistoryManager {...defaultProps} onRestore={onRestore} />,
        { wrapper: TestWrapper }
      );

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      await userEvent.click(restoreButtons[0]);

      expect(onRestore).toHaveBeenCalledWith(mockHistoryEntries[0].snapshot);
    });

    it('should show confirmation dialog for restore', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      await userEvent.click(restoreButtons[0]);

      expect(screen.getByText(/confirm version restore/i)).toBeInTheDocument();
      expect(
        screen.getByText(/this will replace your current redactions/i)
      ).toBeInTheDocument();
    });

    it('should handle restore confirmation', async () => {
      const onRestore = jest.fn();
      render(
        <RedactionHistoryManager {...defaultProps} onRestore={onRestore} />,
        { wrapper: TestWrapper }
      );

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      await userEvent.click(restoreButtons[0]);

      const confirmButton = screen.getByRole('button', {
        name: /confirm restore/i,
      });
      await userEvent.click(confirmButton);

      expect(onRestore).toHaveBeenCalledWith(mockHistoryEntries[0].snapshot);
    });

    it('should handle restore cancellation', async () => {
      const onRestore = jest.fn();
      render(
        <RedactionHistoryManager {...defaultProps} onRestore={onRestore} />,
        { wrapper: TestWrapper }
      );

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      await userEvent.click(restoreButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(onRestore).not.toHaveBeenCalled();
      expect(
        screen.queryByText(/confirm version restore/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Side-by-Side Comparison', () => {
    it('should show compare button for entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      expect(compareButtons).toHaveLength(3);
    });

    it('should open comparison view when compare button is clicked', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      await userEvent.click(compareButtons[0]);

      expect(screen.getByText(/version comparison/i)).toBeInTheDocument();
      expect(screen.getByText(/version 1/i)).toBeInTheDocument();
      expect(screen.getByText(/current version/i)).toBeInTheDocument();
    });

    it('should display changes in comparison view', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      await userEvent.click(compareButtons[1]); // Compare version 2

      await waitFor(() => {
        expect(screen.getByText(/changes made/i)).toBeInTheDocument();
        expect(screen.getByText(/modified: 1 redaction/i)).toBeInTheDocument();
        expect(
          screen.getByText(/width changed: 150 → 200/i)
        ).toBeInTheDocument();
      });
    });

    it('should allow switching between compared versions', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      await userEvent.click(compareButtons[0]);

      const versionSelector = screen.getByRole('combobox', {
        name: /select version to compare/i,
      });
      await userEvent.selectOptions(versionSelector, 'history-2');

      expect(screen.getByText(/version 2/i)).toBeInTheDocument();
    });

    it('should close comparison view', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      await userEvent.click(compareButtons[0]);

      const closeButton = screen.getByRole('button', {
        name: /close comparison/i,
      });
      await userEvent.click(closeButton);

      expect(screen.queryByText(/version comparison/i)).not.toBeInTheDocument();
    });
  });

  describe('History Management', () => {
    it('should show clear history option', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const menuButton = screen.getByRole('button', {
        name: /history actions/i,
      });
      userEvent.click(menuButton);

      waitFor(() => {
        expect(screen.getByText(/clear history/i)).toBeInTheDocument();
      });
    });

    it('should confirm before clearing history', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const menuButton = screen.getByRole('button', {
        name: /history actions/i,
      });
      await userEvent.click(menuButton);

      const clearButton = screen.getByText(/clear history/i);
      await userEvent.click(clearButton);

      expect(screen.getByText(/confirm clear history/i)).toBeInTheDocument();
      expect(
        screen.getByText(/this action cannot be undone/i)
      ).toBeInTheDocument();
    });

    it('should call onClearHistory when confirmed', async () => {
      const onClearHistory = jest.fn();
      render(
        <RedactionHistoryManager
          {...defaultProps}
          onClearHistory={onClearHistory}
        />,
        { wrapper: TestWrapper }
      );

      const menuButton = screen.getByRole('button', {
        name: /history actions/i,
      });
      await userEvent.click(menuButton);

      const clearButton = screen.getByText(/clear history/i);
      await userEvent.click(clearButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm clear/i,
      });
      await userEvent.click(confirmButton);

      expect(onClearHistory).toHaveBeenCalled();
    });

    it('should show export history option', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const menuButton = screen.getByRole('button', {
        name: /history actions/i,
      });
      await userEvent.click(menuButton);

      expect(screen.getByText(/export history/i)).toBeInTheDocument();
    });

    it('should call onExportHistory when export is clicked', async () => {
      const onExportHistory = jest.fn();
      render(
        <RedactionHistoryManager
          {...defaultProps}
          onExportHistory={onExportHistory}
        />,
        { wrapper: TestWrapper }
      );

      const menuButton = screen.getByRole('button', {
        name: /history actions/i,
      });
      await userEvent.click(menuButton);

      const exportButton = screen.getByText(/export history/i);
      await userEvent.click(exportButton);

      expect(onExportHistory).toHaveBeenCalledWith(mockHistoryState.entries);
    });
  });

  describe('Search and Filter', () => {
    it('should filter history by action type', async () => {
      render(<RedactionHistoryManager {...defaultProps} showFilters={true} />, {
        wrapper: TestWrapper,
      });

      const actionFilter = screen.getByRole('combobox', {
        name: /filter by action/i,
      });
      await userEvent.selectOptions(actionFilter, 'CREATE');

      expect(screen.getByText('Created SSN redaction')).toBeInTheDocument();
      expect(
        screen.queryByText('Adjusted redaction dimensions')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Removed redundant redaction')
      ).not.toBeInTheDocument();
    });

    it('should filter history by user', async () => {
      render(<RedactionHistoryManager {...defaultProps} showFilters={true} />, {
        wrapper: TestWrapper,
      });

      const userFilter = screen.getByRole('combobox', {
        name: /filter by user/i,
      });
      await userEvent.selectOptions(userFilter, 'user-2');

      expect(
        screen.getByText('Removed redundant redaction')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Created SSN redaction')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Adjusted redaction dimensions')
      ).not.toBeInTheDocument();
    });

    it('should search history by description', async () => {
      render(<RedactionHistoryManager {...defaultProps} showSearch={true} />, {
        wrapper: TestWrapper,
      });

      const searchInput = screen.getByRole('textbox', {
        name: /search history/i,
      });
      await userEvent.type(searchInput, 'SSN');

      expect(screen.getByText('Created SSN redaction')).toBeInTheDocument();
      expect(
        screen.queryByText('Adjusted redaction dimensions')
      ).not.toBeInTheDocument();
    });
  });

  describe('Statistics and Summary', () => {
    it('should display history statistics', () => {
      render(<RedactionHistoryManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Total Entries: 3')).toBeInTheDocument();
      expect(screen.getByText('Average Quality: 87.7%')).toBeInTheDocument();
      expect(screen.getByText('Auto-saved: 2')).toBeInTheDocument();
      expect(screen.getByText('Manual: 1')).toBeInTheDocument();
    });

    it('should show quality trend', () => {
      render(<RedactionHistoryManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      // Should show quality improvement indicator
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    it('should display action breakdown', () => {
      render(<RedactionHistoryManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Creates: 1')).toBeInTheDocument();
      expect(screen.getByText('Modifies: 1')).toBeInTheDocument();
      expect(screen.getByText('Deletes: 1')).toBeInTheDocument();
    });
  });

  describe('Unsaved Changes Indicator', () => {
    it('should show unsaved changes warning', () => {
      const historyWithUnsaved = {
        ...mockHistoryState,
        hasUnsavedChanges: true,
      };

      render(
        <RedactionHistoryManager
          {...defaultProps}
          history={historyWithUnsaved}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
    });

    it('should not show unsaved changes when history is clean', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no history entries', () => {
      const emptyHistory: EditorHistoryState = {
        entries: [],
        currentIndex: -1,
        maxEntries: 50,
        hasUnsavedChanges: false,
      };

      render(
        <RedactionHistoryManager {...defaultProps} history={emptyHistory} />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/no history entries/i)).toBeInTheDocument();
      expect(
        screen.getByText(/start making changes to see history/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.getByRole('list', { name: /version history/i })
      ).toBeInTheDocument();

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      expect(restoreButtons[0]).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const historyEntries = screen.getAllByRole('listitem');

      historyEntries[0].focus();
      expect(historyEntries[0]).toHaveFocus();

      fireEvent.keyDown(historyEntries[0], { key: 'ArrowDown' });
      expect(historyEntries[1]).toHaveFocus();
    });

    it('should announce changes to screen readers', async () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      await userEvent.click(restoreButtons[0]);

      const confirmButton = screen.getByRole('button', {
        name: /confirm restore/i,
      });
      await userEvent.click(confirmButton);

      // Check for live region announcements
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          /version restored/i
        );
      });
    });
  });

  describe('Performance', () => {
    it('should handle large history efficiently', () => {
      const largeHistory: EditorHistoryState = {
        entries: Array.from({ length: 100 }, (_, i) => ({
          ...mockHistoryEntries[0],
          id: `history-${i}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          description: `Action ${i}`,
        })),
        currentIndex: 99,
        maxEntries: 100,
        hasUnsavedChanges: false,
      };

      render(
        <RedactionHistoryManager {...defaultProps} history={largeHistory} />,
        { wrapper: TestWrapper }
      );

      // Should render without performance issues
      expect(screen.getAllByRole('listitem')).toHaveLength(100);
    });

    it('should implement virtual scrolling for large histories', () => {
      const largeHistory: EditorHistoryState = {
        entries: Array.from({ length: 1000 }, (_, i) => ({
          ...mockHistoryEntries[0],
          id: `history-${i}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          description: `Action ${i}`,
        })),
        currentIndex: 999,
        maxEntries: 1000,
        hasUnsavedChanges: false,
      };

      render(
        <RedactionHistoryManager
          {...defaultProps}
          history={largeHistory}
          enableVirtualScrolling={true}
        />,
        { wrapper: TestWrapper }
      );

      // Should only render visible items
      const visibleItems = screen.getAllByRole('listitem');
      expect(visibleItems.length).toBeLessThan(1000);
      expect(visibleItems.length).toBeGreaterThan(10);
    });
  });
});
