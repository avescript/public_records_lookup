/**
 * Audit Panel Component
 * 
 * Displays audit events with comprehensive filtering and search capabilities
 * for the Public Records AI Assistant application.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SelectChangeEvent,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { auditService, AuditEvent, AuditFilter, AuditSummary } from '@/services/auditService';

interface AuditPanelProps {
  requestId?: string;
  recordId?: string;
  packageId?: string;
  title?: string;
  maxHeight?: number;
}

interface EventDetailsDialogProps {
  event: AuditEvent | null;
  open: boolean;
  onClose: () => void;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ event, open, onClose }) => {
  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {getSeverityIcon(event.severity)}
          <Typography variant="h6">
            Audit Event Details
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="primary">
                  Event Information
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>ID:</strong> {event.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Timestamp:</strong> {new Date(event.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Service:</strong> {event.service}
                </Typography>
                <Typography variant="body2">
                  <strong>Action:</strong> {event.action}
                </Typography>
                <Typography variant="body2">
                  <strong>Category:</strong> {event.category}
                </Typography>
                <Typography variant="body2">
                  <strong>Severity:</strong> {event.severity}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="primary">
                  Actor Information
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Name:</strong> {event.actor.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Role:</strong> {event.actor.role}
                </Typography>
                <Typography variant="body2">
                  <strong>Session:</strong> {event.actor.sessionId || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="primary">
                  Subject Information
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Type:</strong> {event.subject.type}
                </Typography>
                <Typography variant="body2">
                  <strong>ID:</strong> {event.subject.id}
                </Typography>
                {event.subject.metadata && (
                  <Typography variant="body2" component="div">
                    <strong>Metadata:</strong>
                    <pre style={{ fontSize: '12px', marginTop: '4px' }}>
                      {JSON.stringify(event.subject.metadata, null, 2)}
                    </pre>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="primary">
                  Context Information
                </Typography>
                {event.context.requestId && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Request ID:</strong> {event.context.requestId}
                  </Typography>
                )}
                {event.context.recordId && (
                  <Typography variant="body2">
                    <strong>Record ID:</strong> {event.context.recordId}
                  </Typography>
                )}
                {event.context.packageId && (
                  <Typography variant="body2">
                    <strong>Package ID:</strong> {event.context.packageId}
                  </Typography>
                )}
                {event.context.fileName && (
                  <Typography variant="body2">
                    <strong>File Name:</strong> {event.context.fileName}
                  </Typography>
                )}
                {event.context.clientInfo && (
                  <Typography variant="body2">
                    <strong>Browser:</strong> {event.context.clientInfo.browser}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="primary">
                  Event Details
                </Typography>
                <pre style={{ 
                  fontSize: '12px', 
                  marginTop: '8px', 
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflow: 'auto',
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const getSeverityIcon = (severity: AuditEvent['severity']) => {
  switch (severity) {
    case 'critical':
      return <ErrorIcon color="error" />;
    case 'error':
      return <ErrorIcon color="error" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'info':
    default:
      return <InfoIcon color="info" />;
  }
};

const getSeverityColor = (severity: AuditEvent['severity']) => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
};

const getCategoryColor = (category: AuditEvent['category']) => {
  switch (category) {
    case 'security':
      return 'error';
    case 'compliance':
      return 'warning';
    case 'error':
      return 'error';
    case 'user_action':
      return 'primary';
    case 'system_event':
      return 'secondary';
    default:
      return 'default';
  }
};

export const AuditPanel: React.FC<AuditPanelProps> = ({
  requestId,
  recordId,
  packageId,
  title = "Audit Log",
  maxHeight = 600,
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AuditFilter>({
    requestId,
    recordId,
    packageId,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Load data
  useEffect(() => {
    loadAuditData();
  }, [filters]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsData, summaryData] = await Promise.all([
        auditService.getEvents({
          ...filters,
          limit: 1000, // Load more for local filtering
        }),
        auditService.getSummary(filters),
      ]);

      setEvents(eventsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load audit data:', err);
      setError('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on local search
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.action.toLowerCase().includes(term) ||
        event.service.toLowerCase().includes(term) ||
        event.actor.name.toLowerCase().includes(term) ||
        JSON.stringify(event.details).toLowerCase().includes(term)
      );
    }

    if (serviceFilter) {
      filtered = filtered.filter(event => event.service === serviceFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    if (severityFilter) {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    return filtered;
  }, [events, searchTerm, serviceFilter, categoryFilter, severityFilter]);

  // Get unique values for filters
  const availableServices = useMemo(() => 
    Array.from(new Set(events.map(e => e.service))).sort(), [events]
  );
  const availableCategories = useMemo(() => 
    Array.from(new Set(events.map(e => e.category))).sort(), [events]
  );
  const availableSeverities = useMemo(() => 
    Array.from(new Set(events.map(e => e.severity))).sort(), [events]
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (event: AuditEvent) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const handleExport = async () => {
    try {
      const exportData = await auditService.exportForBigQuery(filters);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={loadAuditData} size="small" sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h6">{title}</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadAuditData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={handleExport} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6">{summary.totalEvents}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" color="error">
                  {summary.eventsBySeverity.error + summary.eventsBySeverity.critical}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Errors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" color="warning.main">
                  {summary.eventsBySeverity.warning}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Warnings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6">{summary.eventsByCategory.security}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Security Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="filters-content"
          id="filters-header"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <FilterIcon />
            <Typography>Filters</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search actions, services, details..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Service</InputLabel>
                <Select
                  value={serviceFilter}
                  label="Service"
                  onChange={(e: SelectChangeEvent) => setServiceFilter(e.target.value)}
                >
                  <MenuItem value="">All Services</MenuItem>
                  {availableServices.map(service => (
                    <MenuItem key={service} value={service}>{service}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e: SelectChangeEvent) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {availableCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={(e: SelectChangeEvent) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  {availableSeverities.map(severity => (
                    <MenuItem key={severity} value={severity}>{severity}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Events Table */}
      <TableContainer component={Paper} sx={{ maxHeight }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(event.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{event.service}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {event.action}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{event.actor.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.actor.role}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{event.subject.type}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.subject.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={event.severity}
                      color={getSeverityColor(event.severity) as any}
                      icon={getSeverityIcon(event.severity)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={event.category}
                      color={getCategoryColor(event.category) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(event)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredEvents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </Box>
  );
};

export default AuditPanel;