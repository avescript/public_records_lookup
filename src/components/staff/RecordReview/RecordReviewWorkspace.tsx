import React, { useCallback, useMemo, useState } from 'react';
import {
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  BatchPrediction as BatchIcon,
  Close as CloseIcon,
  Compare as CompareIcon,
  Dashboard as DashboardIcon,
  FilterList as FilterIcon,
  Reviews as ReviewIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Badge,
  Box,
  Container,
  Drawer,
  Fab,
  Paper,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { AdvancedSearchInterface } from '../../../components/staff/EnhancedSearch/AdvancedSearchInterface';
import { useRecordSelection } from '../../../contexts/RecordSelectionContext';
import { EnhancedMatchCandidate } from '../../../types/enhanced-search';

import { BatchProcessingSystem } from './BatchProcessingSystem';
import { RecordComparisonView } from './RecordComparisonView';
import { RecordSelectionToolbar } from './RecordSelectionToolbar';
import { SelectableSearchResultCard } from './SelectableSearchResultCard';

interface ReviewWorkspaceProps {
  searchQuery?: string;
  searchResults?: EnhancedMatchCandidate[];
  onSearchUpdate?: (query: string, results: EnhancedMatchCandidate[]) => void;
  showSearch?: boolean;
  maxHeight?: string;
}

type WorkspaceView = 'search' | 'comparison' | 'batch' | 'analytics';

interface WorkspaceState {
  activeView: WorkspaceView;
  showComparison: boolean;
  showBatchProcessing: boolean;
  showAnalytics: boolean;
  drawerOpen: boolean;
  searchResults: EnhancedMatchCandidate[];
  searchQuery: string;
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}

export const RecordReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  searchQuery: initialQuery = '',
  searchResults: initialResults = [],
  onSearchUpdate,
  showSearch = true,
  maxHeight = 'calc(100vh - 120px)',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    selectedRecords,
    selectionCount,
    clearSelection,
    selectionMode,
    toggleSelectionMode,
  } = useRecordSelection();

  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    activeView: 'search',
    showComparison: false,
    showBatchProcessing: false,
    showAnalytics: false,
    drawerOpen: false,
    searchResults: initialResults,
    searchQuery: initialQuery,
    notification: {
      open: false,
      message: '',
      severity: 'info',
    },
  });

  // Update workspace state from props
  React.useEffect(() => {
    setWorkspaceState(prev => ({
      ...prev,
      searchResults: initialResults,
      searchQuery: initialQuery,
    }));
  }, [initialResults, initialQuery]);

  const showNotification = useCallback(
    (
      message: string,
      severity: WorkspaceState['notification']['severity'] = 'info'
    ) => {
      setWorkspaceState(prev => ({
        ...prev,
        notification: { open: true, message, severity },
      }));
    },
    []
  );

  const handleSearchResults = useCallback(
    (query: string, results: EnhancedMatchCandidate[]) => {
      setWorkspaceState(prev => ({
        ...prev,
        searchQuery: query,
        searchResults: results,
      }));
      onSearchUpdate?.(query, results);

      if (results.length > 0) {
        showNotification(`Found ${results.length} matching records`, 'success');
      }
    },
    [onSearchUpdate, showNotification]
  );

  const handleCompareRecords = useCallback(() => {
    if (selectionCount < 2) {
      showNotification(
        'Please select at least 2 records to compare',
        'warning'
      );
      return;
    }
    if (selectionCount > 5) {
      showNotification('Maximum 5 records can be compared at once', 'warning');
      return;
    }

    setWorkspaceState(prev => ({
      ...prev,
      showComparison: true,
      activeView: 'comparison',
    }));
  }, [selectionCount, showNotification]);

  const handleBatchProcessing = useCallback(() => {
    if (selectionCount === 0) {
      showNotification('Please select records to process', 'warning');
      return;
    }

    setWorkspaceState(prev => ({
      ...prev,
      showBatchProcessing: true,
      activeView: 'batch',
    }));
  }, [selectionCount, showNotification]);

  const handleRecordAction = useCallback(
    (action: string, record: EnhancedMatchCandidate) => {
      switch (action) {
        case 'view':
          // Handle record view
          console.log('View record:', record.id);
          break;
        case 'edit':
          // Handle record edit
          console.log('Edit record:', record.id);
          break;
        case 'approve':
          showNotification(`Record ${record.id} approved`, 'success');
          break;
        case 'reject':
          showNotification(`Record ${record.id} rejected`, 'info');
          break;
        case 'flag':
          showNotification(`Record ${record.id} flagged for review`, 'warning');
          break;
        default:
          console.log(`Unknown action: ${action} for record:`, record.id);
      }
    },
    [showNotification]
  );

  const speedDialActions = useMemo(
    () => [
      {
        icon: <CompareIcon />,
        name: `Compare Records (${selectionCount})`,
        action: handleCompareRecords,
        disabled: selectionCount < 2,
      },
      {
        icon: <BatchIcon />,
        name: `Batch Process (${selectionCount})`,
        action: handleBatchProcessing,
        disabled: selectionCount === 0,
      },
      {
        icon: <FilterIcon />,
        name: 'Advanced Filters',
        action: () =>
          setWorkspaceState(prev => ({ ...prev, drawerOpen: true })),
      },
      {
        icon: <AnalyticsIcon />,
        name: 'View Analytics',
        action: () =>
          setWorkspaceState(prev => ({ ...prev, showAnalytics: true })),
      },
      {
        icon: <DashboardIcon />,
        name: 'Workflow Dashboard',
        action: () => console.log('Open dashboard'),
      },
    ],
    [selectionCount, handleCompareRecords, handleBatchProcessing]
  );

  const renderSearchResults = () => (
    <Box>
      {workspaceState.searchResults.length > 0 && (
        <Stack spacing={2}>
          {workspaceState.searchResults.map((result, index) => (
            <SelectableSearchResultCard
              key={result.id}
              record={result}
              searchQuery={workspaceState.searchQuery}
              onAction={handleRecordAction}
              position={index + 1}
            />
          ))}
        </Stack>
      )}

      {workspaceState.searchResults.length === 0 &&
        workspaceState.searchQuery && (
          <Alert severity='info' sx={{ mt: 2 }}>
            No records found matching &quot;{workspaceState.searchQuery}&quot;.
            Try adjusting your search criteria.
          </Alert>
        )}
    </Box>
  );

  const renderWorkspaceContent = () => {
    switch (workspaceState.activeView) {
      case 'search':
        return renderSearchResults();
      case 'comparison':
        return null; // Handled by dialog
      case 'batch':
        return null; // Handled by dialog
      case 'analytics':
        return (
          <Alert severity='info'>
            Analytics dashboard will be implemented here
          </Alert>
        );
      default:
        return renderSearchResults();
    }
  };

  return (
    <Box sx={{ position: 'relative', height: maxHeight }}>
      {/* Main Content */}
      <Container maxWidth='xl' sx={{ py: 2, height: '100%' }}>
        <Stack spacing={2} sx={{ height: '100%' }}>
          {/* Header */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack
              direction={isMobile ? 'column' : 'row'}
              alignItems={isMobile ? 'stretch' : 'center'}
              justifyContent='space-between'
              spacing={2}
            >
              <Box>
                <Typography variant='h4' gutterBottom>
                  Record Review Workspace
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Search, compare, and process public records efficiently
                </Typography>
              </Box>

              {selectionCount > 0 && (
                <Badge badgeContent={selectionCount} color='primary'>
                  <ReviewIcon sx={{ fontSize: 40 }} />
                </Badge>
              )}
            </Stack>
          </Paper>

          {/* Selection Toolbar */}
          {(selectionCount > 0 || selectionMode) && (
            <RecordSelectionToolbar
              onCompare={handleCompareRecords}
              onBatchProcess={handleBatchProcessing}
              onClearSelection={clearSelection}
              searchQuery={workspaceState.searchQuery}
            />
          )}

          {/* Search Interface */}
          {showSearch && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <AdvancedSearchInterface
                onSearch={options => {
                  // Execute search with options and update results
                  // For now, just update the query in the workspace state
                  setWorkspaceState(prev => ({
                    ...prev,
                    searchQuery: options.query,
                  }));
                }}
              />
            </Paper>
          )}

          {/* Main Workspace */}
          <Paper
            elevation={1}
            sx={{
              flex: 1,
              p: 2,
              overflow: 'auto',
              minHeight: '400px',
            }}
          >
            {renderWorkspaceContent()}
          </Paper>
        </Stack>
      </Container>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel='Record actions'
        sx={{
          position: 'fixed',
          bottom: isMobile ? 16 : 32,
          right: isMobile ? 16 : 32,
          zIndex: 1300,
        }}
        icon={<SpeedDialIcon />}
        FabProps={{
          color: 'primary',
          size: isMobile ? 'medium' : 'large',
        }}
      >
        {speedDialActions.map(action => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
            FabProps={{
              disabled: action.disabled,
            }}
          />
        ))}
      </SpeedDial>

      {/* Record Comparison Dialog */}
      {workspaceState.showComparison && (
        <>
          <Backdrop
            open={true}
            sx={{ zIndex: 1200, bgcolor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() =>
              setWorkspaceState(prev => ({
                ...prev,
                showComparison: false,
                activeView: 'search',
              }))
            }
          />
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              p: 2,
            }}
          >
            <RecordComparisonView
              records={Array.from(selectedRecords.values())}
              searchQuery={workspaceState.searchQuery}
              onClose={() =>
                setWorkspaceState(prev => ({
                  ...prev,
                  showComparison: false,
                  activeView: 'search',
                }))
              }
              onRecordAction={handleRecordAction}
            />
          </Box>
        </>
      )}

      {/* Batch Processing Dialog */}
      <BatchProcessingSystem
        open={workspaceState.showBatchProcessing}
        selectedRecords={Array.from(selectedRecords.values())}
        onClose={() =>
          setWorkspaceState(prev => ({
            ...prev,
            showBatchProcessing: false,
            activeView: 'search',
          }))
        }
        onJobCreated={job => {
          showNotification(
            `Batch job "${job.config.operation.name}" started`,
            'success'
          );
        }}
      />

      {/* Filters Drawer */}
      <Drawer
        anchor='right'
        open={workspaceState.drawerOpen}
        onClose={() =>
          setWorkspaceState(prev => ({ ...prev, drawerOpen: false }))
        }
        PaperProps={{
          sx: { width: isMobile ? '100%' : 400, p: 2 },
        }}
      >
        <Typography variant='h6' gutterBottom>
          Advanced Filters
        </Typography>
        <Alert severity='info'>
          Advanced filtering options will be implemented here
        </Alert>
      </Drawer>

      {/* Notifications */}
      <Snackbar
        open={workspaceState.notification.open}
        autoHideDuration={6000}
        onClose={() =>
          setWorkspaceState(prev => ({
            ...prev,
            notification: { ...prev.notification, open: false },
          }))
        }
      >
        <Alert
          onClose={() =>
            setWorkspaceState(prev => ({
              ...prev,
              notification: { ...prev.notification, open: false },
            }))
          }
          severity={workspaceState.notification.severity}
          variant='filled'
        >
          {workspaceState.notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecordReviewWorkspace;
