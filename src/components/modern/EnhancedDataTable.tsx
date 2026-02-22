'use client';

import React from 'react';
import {
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { useResponsive } from '../../theme/responsive';
import { useAccessibleAnnouncements } from '../accessibility/AccessibilityProvider';

// Column definition type
export interface DataTableColumn<T = any> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  filterable?: boolean;
  format?: (value: any, row: T) => React.ReactNode;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
}

// Row data type
export interface DataTableRow {
  id: string | number;
  [key: string]: any;
}

// Data table props
export interface EnhancedDataTableProps<T extends DataTableRow> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  pagination?: boolean;
  dense?: boolean;
  stickyHeader?: boolean;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  selectedRows?: (string | number)[];
  searchValue?: string;
  onRowSelect?: (selectedIds: (string | number)[]) => void;
  onRowClick?: (row: T, index: number) => void;
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: (data: T[]) => void;
  onRefresh?: () => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  renderRowActions?: (row: T, index: number) => React.ReactNode;
  rowClassName?: (row: T, index: number) => string;
  'aria-label'?: string;
}

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  overflow: 'hidden',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,

  '&.MuiTableCell-head': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    fontWeight: 600,
    borderBottom: `2px solid ${theme.palette.divider}`,
    whiteSpace: 'nowrap',
  },

  '&.MuiTableCell-body': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.02),
  },

  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.08),
    cursor: 'pointer',
  },

  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),

    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
    },
  },
}));

// Table toolbar component
const TableToolbar: React.FC<{
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  selectedCount?: number;
}> = ({
  title,
  subtitle,
  searchable,
  filterable,
  exportable,
  refreshable,
  searchValue,
  onSearch,
  onFilter,
  onExport,
  onRefresh,
  selectedCount = 0,
}) => {
  const { isMobile } = useResponsive();

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Title and subtitle */}
      {(title || subtitle) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography variant='h6' component='h2' sx={{ fontWeight: 600 }}>
              {title}
              {selectedCount > 0 && (
                <Chip
                  label={`${selectedCount} selected`}
                  size='small'
                  color='primary'
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          )}
          {subtitle && (
            <Typography variant='body2' color='text.secondary'>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Toolbar actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        {/* Search */}
        {searchable && (
          <TextField
            size='small'
            placeholder='Search...'
            value={searchValue || ''}
            onChange={e => onSearch?.(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: isMobile ? '100%' : 250,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
              },
            }}
          />
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          {filterable && (
            <IconButton
              onClick={onFilter}
              size='small'
              aria-label='Filter table'
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <FilterIcon fontSize='small' />
            </IconButton>
          )}

          {exportable && (
            <IconButton
              onClick={onExport}
              size='small'
              aria-label='Export data'
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <ExportIcon fontSize='small' />
            </IconButton>
          )}

          {refreshable && (
            <IconButton
              onClick={onRefresh}
              size='small'
              aria-label='Refresh data'
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <RefreshIcon fontSize='small' />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Loading skeleton for table
const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <StyledTableCell key={i}>
              <Skeleton width='80%' />
            </StyledTableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <StyledTableCell key={colIndex}>
                <Skeleton width='60%' />
              </StyledTableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Enhanced Data Table component
export const EnhancedDataTable = <T extends DataTableRow>({
  columns,
  data,
  loading = false,
  selectable = false,
  searchable = false,
  filterable = false,
  exportable = false,
  refreshable = false,
  pagination = true,
  dense = false,
  stickyHeader = false,
  emptyMessage = 'No data available',
  title,
  subtitle,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  selectedRows = [],
  searchValue = '',
  onRowSelect,
  onRowClick,
  onSearch,
  onFilter,
  onExport,
  onRefresh,
  onSort,
  renderRowActions,
  rowClassName,
  'aria-label': ariaLabel = 'Data table',
}: EnhancedDataTableProps<T>) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const { announceAction } = useAccessibleAnnouncements();

  // Local state
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
    'asc'
  );
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Handle row selection
  const handleRowSelect = (id: string | number, checked: boolean) => {
    const newSelected = checked
      ? [...selectedRows, id]
      : selectedRows.filter(selectedId => selectedId !== id);

    onRowSelect?.(newSelected);
    announceAction(`Row ${checked ? 'selected' : 'deselected'}`);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? data.map(row => row.id) : [];
    onRowSelect?.(newSelected);
    announceAction(`${checked ? 'All rows selected' : 'All rows deselected'}`);
  };

  // Handle sort
  const handleSort = (column: keyof T) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';

    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
    announceAction(`Table sorted by ${String(column)} ${newDirection}ending`);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated data
  const paginatedData = pagination
    ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : data;

  // All selected check
  const isAllSelected = selectedRows.length === data.length && data.length > 0;
  const isIndeterminate =
    selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <TableToolbar
        title={title}
        subtitle={subtitle}
        searchable={searchable}
        filterable={filterable}
        exportable={exportable}
        refreshable={refreshable}
        searchValue={searchValue}
        onSearch={onSearch}
        onFilter={onFilter}
        onExport={onExport ? () => onExport(data) : undefined}
        onRefresh={onRefresh}
        selectedCount={selectedRows.length}
      />

      {/* Table */}
      <StyledTableContainer sx={{ maxHeight: isMobile ? 400 : 600 }}>
        <Table
          stickyHeader={stickyHeader}
          size={dense ? 'small' : 'medium'}
          aria-label={ariaLabel}
        >
          {/* Table Header */}
          <TableHead>
            <TableRow>
              {/* Select all checkbox */}
              {selectable && (
                <StyledTableCell padding='checkbox'>
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    inputProps={{ 'aria-label': 'select all rows' }}
                  />
                </StyledTableCell>
              )}

              {/* Column headers */}
              {columns.map(column => (
                <StyledTableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={
                    sortColumn === column.id ? sortDirection : false
                  }
                >
                  {column.headerRender ? (
                    column.headerRender()
                  ) : column.sortable ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={
                        sortColumn === column.id ? sortDirection : 'asc'
                      }
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </StyledTableCell>
              ))}

              {/* Actions column */}
              {renderRowActions && (
                <StyledTableCell align='right'>Actions</StyledTableCell>
              )}
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <StyledTableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (renderRowActions ? 1 : 0)
                  }
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  <Typography color='text.secondary'>{emptyMessage}</Typography>
                </StyledTableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <StyledTableRow
                  key={row.id}
                  selected={selectedRows.includes(row.id)}
                  onClick={() => onRowClick?.(row, index)}
                  className={rowClassName?.(row, index)}
                >
                  {/* Selection checkbox */}
                  {selectable && (
                    <StyledTableCell padding='checkbox'>
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onChange={e =>
                          handleRowSelect(row.id, e.target.checked)
                        }
                        inputProps={{ 'aria-label': `select row ${index + 1}` }}
                      />
                    </StyledTableCell>
                  )}

                  {/* Data cells */}
                  {columns.map(column => {
                    const value = row[column.id];
                    return (
                      <StyledTableCell
                        key={String(column.id)}
                        align={column.align}
                      >
                        {column.render
                          ? column.render(value, row, index)
                          : column.format
                            ? column.format(value, row)
                            : value}
                      </StyledTableCell>
                    );
                  })}

                  {/* Row actions */}
                  {renderRowActions && (
                    <StyledTableCell align='right'>
                      {renderRowActions(row, index)}
                    </StyledTableCell>
                  )}
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {/* Pagination */}
      {pagination && data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component='div'
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        />
      )}
    </Paper>
  );
};

export default EnhancedDataTable;
