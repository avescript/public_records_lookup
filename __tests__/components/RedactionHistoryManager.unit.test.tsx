/**
 * Redaction History Manager - Unit Tests
 * US-V2-031: Focused unit tests for history management functionality
 */

import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
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
      redactions: [],
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
      redactions: [],
      lastModified: '2024-01-15T11:00:00Z',
      version: 2,
    },
  },
];

const mockHistoryState: EditorHistoryState = {
  entries: mockHistoryEntries,
  currentIndex: 1, // Latest entry
  maxEntries: 50,
  hasUnsavedChanges: false,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RedactionHistoryManager Unit Tests', () => {
  const defaultProps = {
    history: mockHistoryState,
    onRestore: jest.fn(),
    onClearHistory: jest.fn(),
    onExportHistory: jest.fn(),
    currentSnapshot: mockHistoryEntries[1].snapshot,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with history entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Created SSN redaction')).toBeInTheDocument();
      expect(
        screen.getByText('Adjusted redaction dimensions')
      ).toBeInTheDocument();
    });

    it('should display correct number of history entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const historyEntries = screen.getAllByRole('listitem');
      expect(historyEntries).toHaveLength(2);
    });

    it('should handle empty history', () => {
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
    });
  });

  describe('History Entry Information', () => {
    beforeEach(() => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should display entry descriptions', () => {
      expect(screen.getByText('Created SSN redaction')).toBeInTheDocument();
      expect(
        screen.getByText('Adjusted redaction dimensions')
      ).toBeInTheDocument();
    });

    it('should display user names', () => {
      expect(screen.getAllByText('John Doe')).toHaveLength(2);
    });

    it('should display timestamps', () => {
      expect(screen.getByText(/Jan 15, 2024, 10:00 AM/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024, 11:00 AM/)).toBeInTheDocument();
    });

    it('should display quality scores', () => {
      expect(screen.getByText('Quality: 85%')).toBeInTheDocument();
      expect(screen.getByText('Quality: 90%')).toBeInTheDocument();
    });

    it('should show action type icons', () => {
      expect(screen.getByTestId('AddIcon')).toBeInTheDocument(); // CREATE action
      expect(screen.getByTestId('EditIcon')).toBeInTheDocument(); // MODIFY action
    });

    it('should indicate auto-saved vs manual saves', () => {
      const autoSaveIndicator = screen.getByTestId('AutoModeIcon');
      const manualSaveIndicator = screen.getByTestId('SaveIcon');

      expect(autoSaveIndicator).toBeInTheDocument();
      expect(manualSaveIndicator).toBeInTheDocument();
    });
  });

  describe('Current Entry Highlighting', () => {
    it('should highlight the current entry', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const historyEntries = screen.getAllByRole('listitem');
      expect(historyEntries[1]).toHaveClass('current'); // Latest entry should be current
    });

    it('should not highlight non-current entries', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const historyEntries = screen.getAllByRole('listitem');
      expect(historyEntries[0]).not.toHaveClass('current');
    });
  });

  describe('Restore Functionality', () => {
    beforeEach(() => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should show restore buttons for non-current entries', () => {
      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      expect(restoreButtons).toHaveLength(1); // Only one non-current entry
    });

    it('should not show restore button for current entry', () => {
      // Current entry (index 1) should not have a restore button visible in the UI
      const historyEntries = screen.getAllByRole('listitem');
      const currentEntry = historyEntries[1];

      // Should not have a restore button or it should be disabled/hidden
      const restoreButton = currentEntry.querySelector(
        'button[aria-label*="restore"]'
      );
      expect(restoreButton).toBeNull();
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
    });
  });

  describe('Version Comparison', () => {
    beforeEach(() => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should show compare buttons for all entries', () => {
      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      expect(compareButtons).toHaveLength(2);
    });

    it('should open comparison view when compare button is clicked', async () => {
      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      await userEvent.click(compareButtons[0]);

      expect(screen.getByText(/version comparison/i)).toBeInTheDocument();
    });

    it('should show changes in comparison view', async () => {
      const compareButtons = screen.getAllByRole('button', {
        name: /compare versions/i,
      });
      await userEvent.click(compareButtons[1]); // Compare second entry

      expect(screen.getByText(/changes made/i)).toBeInTheDocument();
      expect(screen.getByText(/modified: 1 redaction/i)).toBeInTheDocument();
    });

    it('should close comparison view', async () => {
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

  describe('History Management Actions', () => {
    beforeEach(() => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should show history actions menu', async () => {
      const menuButton = screen.getByRole('button', {
        name: /history actions/i,
      });
      await userEvent.click(menuButton);

      expect(screen.getByText(/clear history/i)).toBeInTheDocument();
      expect(screen.getByText(/export history/i)).toBeInTheDocument();
    });

    it('should confirm before clearing history', async () => {
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

    it('should not show warning when no unsaved changes', () => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should display history statistics when enabled', () => {
      render(<RedactionHistoryManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Total Entries: 2')).toBeInTheDocument();
      expect(screen.getByText(/Average Quality: /)).toBeInTheDocument();
      expect(screen.getByText('Auto-saved: 1')).toBeInTheDocument();
      expect(screen.getByText('Manual: 1')).toBeInTheDocument();
    });

    it('should show quality trend indicator', () => {
      render(<RedactionHistoryManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      // Should show trend up since quality improved from 85% to 90%
      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });

    it('should display action breakdown', () => {
      render(<RedactionHistoryManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Creates: 1')).toBeInTheDocument();
      expect(screen.getByText('Modifies: 1')).toBeInTheDocument();
      expect(screen.getByText('Deletes: 0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<RedactionHistoryManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should have proper ARIA labels', () => {
      expect(
        screen.getByRole('list', { name: /version history/i })
      ).toBeInTheDocument();
    });

    it('should have accessible restore buttons', () => {
      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });
      expect(restoreButtons[0]).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', () => {
      const historyEntries = screen.getAllByRole('listitem');

      historyEntries[0].focus();
      expect(historyEntries[0]).toHaveFocus();

      fireEvent.keyDown(historyEntries[0], { key: 'ArrowDown' });
      expect(historyEntries[1]).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid history entries gracefully', () => {
      const invalidHistory: EditorHistoryState = {
        entries: [
          {
            id: 'invalid',
            timestamp: 'invalid-date',
            action: 'UNKNOWN' as any,
            description: '',
            userId: '',
            userName: '',
          } as any,
        ],
        currentIndex: 0,
        maxEntries: 50,
        hasUnsavedChanges: false,
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <RedactionHistoryManager {...defaultProps} history={invalidHistory} />,
        { wrapper: TestWrapper }
      );

      // Should render without crashing
      expect(screen.getByRole('list')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle callback errors gracefully', async () => {
      const onRestore = jest.fn(() => {
        throw new Error('Restore error');
      });

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <RedactionHistoryManager {...defaultProps} onRestore={onRestore} />,
        { wrapper: TestWrapper }
      );

      const restoreButtons = screen.getAllByRole('button', {
        name: /restore to this version/i,
      });

      // Should not crash when callback throws
      await userEvent.click(restoreButtons[0]);

      // Confirm the restore
      const confirmButton = screen.getByRole('button', {
        name: /confirm restore/i,
      });
      await userEvent.click(confirmButton);

      consoleSpy.mockRestore();
    });
  });

  describe('Filtering and Search', () => {
    it('should filter by action type when filters are enabled', async () => {
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
    });

    it('should search by description when search is enabled', async () => {
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
});
