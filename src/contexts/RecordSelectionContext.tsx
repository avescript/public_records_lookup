import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { EnhancedMatchCandidate } from '../../../types/enhanced-search';

interface RecordSelectionState {
  selectedRecords: Map<string, EnhancedMatchCandidate>;
  selectionMode: 'none' | 'single' | 'multiple';
  lastSelected: string | null;
}

interface RecordSelectionContextValue extends RecordSelectionState {
  // Selection actions
  selectRecord: (record: EnhancedMatchCandidate) => void;
  deselectRecord: (recordId: string) => void;
  toggleRecord: (record: EnhancedMatchCandidate) => void;
  selectMultiple: (records: EnhancedMatchCandidate[]) => void;
  clearSelection: () => void;
  selectAll: (records: EnhancedMatchCandidate[]) => void;

  // Utility methods
  isSelected: (recordId: string) => boolean;
  getSelectionCount: () => number;
  getSelectedRecords: () => EnhancedMatchCandidate[];
  hasSelection: () => boolean;

  // Selection mode management
  setSelectionMode: (mode: 'none' | 'single' | 'multiple') => void;

  // Persistence
  saveSelection: () => void;
  loadSelection: () => void;
  clearPersistedSelection: () => void;
}

const RecordSelectionContext =
  createContext<RecordSelectionContextValue | null>(null);

export const useRecordSelection = () => {
  const context = useContext(RecordSelectionContext);
  if (!context) {
    throw new Error(
      'useRecordSelection must be used within a RecordSelectionProvider'
    );
  }
  return context;
};

interface RecordSelectionProviderProps {
  children: React.ReactNode;
  persistKey?: string;
  maxSelection?: number;
  initialMode?: 'none' | 'single' | 'multiple';
}

export const RecordSelectionProvider: React.FC<
  RecordSelectionProviderProps
> = ({
  children,
  persistKey = 'recordSelection',
  maxSelection = 100,
  initialMode = 'multiple',
}) => {
  const [state, setState] = useState<RecordSelectionState>({
    selectedRecords: new Map(),
    selectionMode: initialMode,
    lastSelected: null,
  });

  // Load persisted selection on mount
  useEffect(() => {
    loadSelection();
  }, [persistKey, loadSelection]);

  // Persist selection when state changes
  useEffect(() => {
    if (state.selectedRecords.size > 0) {
      saveSelection();
    }
  }, [state.selectedRecords, persistKey, saveSelection]);

  const selectRecord = useCallback(
    (record: EnhancedMatchCandidate) => {
      setState(prevState => {
        const newSelected = new Map(prevState.selectedRecords);

        // Handle single selection mode
        if (prevState.selectionMode === 'single') {
          newSelected.clear();
        }

        // Check max selection limit
        if (newSelected.size >= maxSelection && !newSelected.has(record.id)) {
          console.warn(`Maximum selection limit of ${maxSelection} reached`);
          return prevState;
        }

        newSelected.set(record.id, record);

        return {
          ...prevState,
          selectedRecords: newSelected,
          lastSelected: record.id,
        };
      });
    },
    [maxSelection]
  );

  const deselectRecord = useCallback((recordId: string) => {
    setState(prevState => {
      const newSelected = new Map(prevState.selectedRecords);
      newSelected.delete(recordId);

      return {
        ...prevState,
        selectedRecords: newSelected,
        lastSelected:
          newSelected.size > 0 ? Array.from(newSelected.keys())[0] : null,
      };
    });
  }, []);

  const toggleRecord = useCallback((record: EnhancedMatchCandidate) => {
    setState(prevState => {
      const isCurrentlySelected = prevState.selectedRecords.has(record.id);

      if (isCurrentlySelected) {
        const newSelected = new Map(prevState.selectedRecords);
        newSelected.delete(record.id);

        return {
          ...prevState,
          selectedRecords: newSelected,
          lastSelected:
            newSelected.size > 0 ? Array.from(newSelected.keys())[0] : null,
        };
      } else {
        return {
          ...prevState,
          selectedRecords: new Map(prevState.selectedRecords).set(
            record.id,
            record
          ),
          lastSelected: record.id,
        };
      }
    });
  }, []);

  const selectMultiple = useCallback(
    (records: EnhancedMatchCandidate[]) => {
      setState(prevState => {
        if (prevState.selectionMode === 'single') {
          // In single mode, only select the first record
          const firstRecord = records[0];
          return firstRecord
            ? {
                ...prevState,
                selectedRecords: new Map([[firstRecord.id, firstRecord]]),
                lastSelected: firstRecord.id,
              }
            : prevState;
        }

        const newSelected = new Map(prevState.selectedRecords);
        const recordsToAdd = records.slice(0, maxSelection - newSelected.size);

        recordsToAdd.forEach(record => {
          newSelected.set(record.id, record);
        });

        return {
          ...prevState,
          selectedRecords: newSelected,
          lastSelected:
            recordsToAdd.length > 0
              ? recordsToAdd[recordsToAdd.length - 1].id
              : prevState.lastSelected,
        };
      });
    },
    [maxSelection]
  );

  const clearSelection = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      selectedRecords: new Map(),
      lastSelected: null,
    }));
  }, []);

  const selectAll = useCallback(
    (records: EnhancedMatchCandidate[]) => {
      setState(prevState => {
        if (prevState.selectionMode === 'single') {
          const firstRecord = records[0];
          return firstRecord
            ? {
                ...prevState,
                selectedRecords: new Map([[firstRecord.id, firstRecord]]),
                lastSelected: firstRecord.id,
              }
            : prevState;
        }

        const recordsToSelect = records.slice(0, maxSelection);
        const newSelected = new Map(
          recordsToSelect.map(record => [record.id, record])
        );

        return {
          ...prevState,
          selectedRecords: newSelected,
          lastSelected:
            recordsToSelect.length > 0
              ? recordsToSelect[recordsToSelect.length - 1].id
              : null,
        };
      });
    },
    [maxSelection]
  );

  const isSelected = useCallback(
    (recordId: string) => {
      return state.selectedRecords.has(recordId);
    },
    [state.selectedRecords]
  );

  const getSelectionCount = useCallback(() => {
    return state.selectedRecords.size;
  }, [state.selectedRecords]);

  const getSelectedRecords = useCallback(() => {
    return Array.from(state.selectedRecords.values());
  }, [state.selectedRecords]);

  const hasSelection = useCallback(() => {
    return state.selectedRecords.size > 0;
  }, [state.selectedRecords]);

  const setSelectionMode = useCallback(
    (mode: 'none' | 'single' | 'multiple') => {
      setState(prevState => {
        let newSelected = prevState.selectedRecords;

        // Clear selection when switching to 'none' mode
        if (mode === 'none') {
          newSelected = new Map();
        }
        // Keep only first record when switching to 'single' mode
        else if (mode === 'single' && prevState.selectedRecords.size > 1) {
          const firstRecord = Array.from(prevState.selectedRecords.values())[0];
          newSelected = new Map([[firstRecord.id, firstRecord]]);
        }

        return {
          ...prevState,
          selectionMode: mode,
          selectedRecords: newSelected,
          lastSelected:
            newSelected.size > 0 ? Array.from(newSelected.keys())[0] : null,
        };
      });
    },
    []
  );

  const saveSelection = useCallback(() => {
    try {
      const selectionData = {
        selectedRecords: Array.from(state.selectedRecords.entries()),
        selectionMode: state.selectionMode,
        lastSelected: state.lastSelected,
        timestamp: Date.now(),
      };

      localStorage.setItem(persistKey, JSON.stringify(selectionData));
    } catch (error) {
      console.error('Failed to save record selection:', error);
    }
  }, [state, persistKey]);

  const clearPersistedSelection = useCallback(() => {
    try {
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.error('Failed to clear persisted selection:', error);
    }
  }, [persistKey]);

  const loadSelection = useCallback(() => {
    try {
      const saved = localStorage.getItem(persistKey);
      if (!saved) return;

      const selectionData = JSON.parse(saved);

      // Check if selection is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - selectionData.timestamp > maxAge) {
        clearPersistedSelection();
        return;
      }

      setState(prevState => ({
        ...prevState,
        selectedRecords: new Map(selectionData.selectedRecords || []),
        selectionMode: selectionData.selectionMode || initialMode,
        lastSelected: selectionData.lastSelected || null,
      }));
    } catch (error) {
      console.error('Failed to load record selection:', error);
      clearPersistedSelection();
    }
  }, [persistKey, initialMode, clearPersistedSelection]);

  const contextValue: RecordSelectionContextValue = {
    ...state,
    selectRecord,
    deselectRecord,
    toggleRecord,
    selectMultiple,
    clearSelection,
    selectAll,
    isSelected,
    getSelectionCount,
    getSelectedRecords,
    hasSelection,
    setSelectionMode,
    saveSelection,
    loadSelection,
    clearPersistedSelection,
  };

  return (
    <RecordSelectionContext.Provider value={contextValue}>
      {children}
    </RecordSelectionContext.Provider>
  );
};

export default RecordSelectionProvider;
