import React from 'react';
import {
  Archive as ArchiveIcon,
  Clear as ClearIcon,
  Compare as CompareIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Print as PrintIcon,
  SelectAll as SelectAllIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Slide,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';

import { EnhancedMatchCandidate } from '../../../types/enhanced-search';
import { useRecordSelection } from '../../contexts/RecordSelectionContext';

interface RecordSelectionToolbarProps {
  availableRecords?: EnhancedMatchCandidate[];
  onCompare?: (records: EnhancedMatchCandidate[]) => void;
  onBatchProcess?: () => void; // Add missing property
  onExport?: (
    records: EnhancedMatchCandidate[],
    format: 'csv' | 'json' | 'pdf'
  ) => void;
  onBulkAction?: (action: string, records: EnhancedMatchCandidate[]) => void;
  onClearSelection?: () => void; // Add missing property
  searchQuery?: string; // Add missing property
  maxSelectionForComparison?: number;
  showSelectionMode?: boolean;
  compact?: boolean;
}

export const RecordSelectionToolbar: React.FC<RecordSelectionToolbarProps> = ({
  availableRecords = [],
  onCompare,
  onExport,
  onBulkAction,
  maxSelectionForComparison = 5,
  showSelectionMode = true,
  compact = false,
}) => {
  const {
    selectedRecords,
    selectionMode,
    getSelectionCount,
    getSelectedRecords,
    hasSelection,
    clearSelection,
    selectAll,
    setSelectionMode,
  } = useRecordSelection();

  const [moreMenuAnchor, setMoreMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] =
    React.useState<null | HTMLElement>(null);

  const selectionCount = getSelectionCount();
  const selected = getSelectedRecords();
  const canCompare =
    selectionCount >= 2 && selectionCount <= maxSelectionForComparison;

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleSelectAll = () => {
    selectAll(availableRecords);
  };

  const handleCompare = () => {
    if (canCompare && onCompare) {
      onCompare(selected);
    }
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (onExport && hasSelection()) {
      onExport(selected, format);
    }
    handleExportClose();
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && hasSelection()) {
      onBulkAction(action, selected);
    }
    handleMoreClose();
  };

  const handleSelectionModeChange = (mode: 'none' | 'single' | 'multiple') => {
    setSelectionMode(mode);
  };

  // Don't render if no selection capability
  if (selectionMode === 'none' && !hasSelection()) {
    return null;
  }

  return (
    <Slide direction='up' in={hasSelection() || selectionMode !== 'none'}>
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          bottom: 0,
          zIndex: 1100,
        }}
      >
        <Toolbar
          variant={compact ? 'dense' : 'regular'}
          sx={{
            minHeight: compact ? 48 : 64,
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack
            direction='row'
            alignItems='center'
            spacing={2}
            sx={{ width: '100%' }}
          >
            {/* Selection Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${selectionCount} selected`}
                color='primary'
                size={compact ? 'small' : 'medium'}
                variant={selectionCount > 0 ? 'filled' : 'outlined'}
              />

              {selectionCount > 0 && (
                <Tooltip title='Clear selection'>
                  <IconButton
                    size='small'
                    onClick={clearSelection}
                    aria-label='Clear selection'
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Selection Mode Toggle */}
            {showSelectionMode && (
              <>
                <Divider orientation='vertical' flexItem />
                <Stack direction='row' spacing={1}>
                  <Button
                    size='small'
                    variant={
                      selectionMode === 'single' ? 'contained' : 'outlined'
                    }
                    onClick={() => handleSelectionModeChange('single')}
                  >
                    Single
                  </Button>
                  <Button
                    size='small'
                    variant={
                      selectionMode === 'multiple' ? 'contained' : 'outlined'
                    }
                    onClick={() => handleSelectionModeChange('multiple')}
                  >
                    Multiple
                  </Button>
                </Stack>
              </>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {/* Quick Actions */}
            <Stack direction='row' spacing={1}>
              {availableRecords.length > 0 && (
                <Tooltip title='Select all visible records'>
                  <Button
                    startIcon={<SelectAllIcon />}
                    onClick={handleSelectAll}
                    disabled={selectionCount === availableRecords.length}
                    size={compact ? 'small' : 'medium'}
                  >
                    Select All
                  </Button>
                </Tooltip>
              )}

              {canCompare && onCompare && (
                <Tooltip title={`Compare ${selectionCount} records`}>
                  <Button
                    startIcon={<CompareIcon />}
                    onClick={handleCompare}
                    color='secondary'
                    size={compact ? 'small' : 'medium'}
                  >
                    Compare
                  </Button>
                </Tooltip>
              )}

              {hasSelection() && onExport && (
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={handleExportClick}
                  size={compact ? 'small' : 'medium'}
                >
                  Export
                </Button>
              )}

              {hasSelection() && (onBulkAction || onExport) && (
                <IconButton onClick={handleMoreClick} aria-label='More actions'>
                  <MoreIcon />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Toolbar>

        {/* Selection Limits Warning */}
        {selectionCount > maxSelectionForComparison && onCompare && (
          <Alert severity='info' sx={{ mx: 2, mb: 1 }} variant='outlined'>
            <Typography variant='body2'>
              Comparison is limited to {maxSelectionForComparison} records.
              Select fewer records to enable comparison.
            </Typography>
          </Alert>
        )}

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MenuItem onClick={() => handleExport('csv')}>
            <ListItemIcon>
              <DownloadIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Export as CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('json')}>
            <ListItemIcon>
              <DownloadIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Export as JSON</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('pdf')}>
            <ListItemIcon>
              <PrintIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Export as PDF</ListItemText>
          </MenuItem>
        </Menu>

        {/* More Actions Menu */}
        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={handleMoreClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MenuItem onClick={() => handleBulkAction('view')}>
            <ListItemIcon>
              <ViewIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>View Selected</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleBulkAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Edit Selected</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleBulkAction('share')}>
            <ListItemIcon>
              <ShareIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Share Selected</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleBulkAction('archive')}>
            <ListItemIcon>
              <ArchiveIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Archive Selected</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => handleBulkAction('delete')}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize='small' color='error' />
            </ListItemIcon>
            <ListItemText>Delete Selected</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Slide>
  );
};

export default RecordSelectionToolbar;
