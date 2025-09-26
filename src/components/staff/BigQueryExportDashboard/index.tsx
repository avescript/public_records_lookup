/**
 * BigQuery Export Dashboard Component
 * 
 * Provides UI for exporting audit data, events, deliveries, and errors
 * with BigQuery-compatible formats and schema documentation.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  SelectChangeEvent,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Storage as StorageIcon,
  TableChart as TableIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  DataObject as DataIcon,
} from '@mui/icons-material';
// DatePicker will be replaced with TextField for date input
import { bigQueryExportService, ExportSummary } from '@/services/bigQueryExportService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`export-tabpanel-${index}`}
    aria-labelledby={`export-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

interface SchemaViewerProps {
  schema: any;
  tableName: string;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema, tableName }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell><strong>Field Name</strong></TableCell>
          <TableCell><strong>Type</strong></TableCell>
          <TableCell><strong>Mode</strong></TableCell>
          <TableCell><strong>Description</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {schema.fields.map((field: any) => (
          <TableRow key={field.name}>
            <TableCell>
              <code>{field.name}</code>
            </TableCell>
            <TableCell>
              <Chip label={field.type} size="small" color="primary" variant="outlined" />
            </TableCell>
            <TableCell>
              <Chip 
                label={field.mode} 
                size="small" 
                color={field.mode === 'REQUIRED' ? 'error' : 'default'}
                variant="outlined"
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {getFieldDescription(field.name, tableName)}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const getFieldDescription = (fieldName: string, tableName: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    events: {
      event_id: 'Unique identifier for the audit event',
      timestamp: 'When the event occurred',
      service: 'Service that generated the event',
      action: 'Action that was performed',
      actor_id: 'Hashed identifier of the user who performed the action',
      actor_name: 'Sanitized name of the user',
      actor_role: 'Role of the user (citizen, records_officer, etc.)',
      subject_type: 'Type of entity the action was performed on',
      subject_id: 'Identifier of the entity',
      severity: 'Event severity level',
      category: 'Event category for grouping',
      date_partition: 'Date partition for BigQuery optimization',
    },
    deliveries: {
      delivery_id: 'Unique identifier for the delivery',
      request_id: 'Associated request identifier',
      package_id: 'Package that was delivered',
      delivery_method: 'How the package was delivered (email, portal, mail)',
      delivery_status: 'Current status of the delivery',
      file_count: 'Number of files in the package',
      total_size_bytes: 'Total size of the package in bytes',
    },
    errors: {
      error_id: 'Unique identifier for the error',
      error_type: 'Category of error (validation, processing, etc.)',
      error_message: 'Description of what went wrong',
      severity: 'Error severity level',
      resolved: 'Whether the error has been resolved',
      service: 'Service where the error occurred',
    },
    metrics: {
      metric_id: 'Unique identifier for the metric data point',
      metric_name: 'Name of the metric being measured',
      metric_value: 'Numeric value of the metric',
      metric_unit: 'Unit of measurement',
      dimensions: 'Additional context as JSON',
      service: 'Service that reported the metric',
    },
  };

  return descriptions[tableName]?.[fieldName] || 'No description available';
};

export const BigQueryExportDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportSummary[]>([]);
  
  // Export form state
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'newline_delimited_json'>('json');
  const [selectedTables, setSelectedTables] = useState<string[]>(['events']);
  
  // Schema and queries
  const [schemas] = useState(bigQueryExportService.getBigQuerySchemas());
  const [queries] = useState(bigQueryExportService.getLookerStudioQueries());
  
  // Dialog states
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<{ name: string; schema: any } | null>(null);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<{ name: string; query: string } | null>(null);

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      // In a real app, this would load from the backend
      const stored = localStorage.getItem('bigquery_exports');
      const history = stored ? JSON.parse(stored) : [];
      setExportHistory(history.slice(-10)); // Show last 10 exports
    } catch (err) {
      console.error('Failed to load export history:', err);
    }
  };

  const handleFullExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const summary = await bigQueryExportService.createFullExport({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        format: exportFormat,
      });

      // Refresh export history
      await loadExportHistory();

      setError(null);
      
      // Auto-download the export
      await bigQueryExportService.downloadExport(summary.export_id, exportFormat);
      
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableExport = async (tableName: string) => {
    try {
      setLoading(true);
      setError(null);

      let data: any[] = [];
      
      switch (tableName) {
        case 'events':
          data = await bigQueryExportService.exportEvents({
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          });
          break;
        case 'deliveries':
          data = await bigQueryExportService.exportDeliveries({
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          });
          break;
        case 'errors':
          data = await bigQueryExportService.exportErrors({
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          });
          break;
        case 'metrics':
          data = await bigQueryExportService.exportMetrics({
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          });
          break;
      }

      // Download the data
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tableName}-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Table export failed:', err);
      setError(`Failed to export ${tableName} table. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchema = (tableName: string, schema: any) => {
    setSelectedSchema({ name: tableName, schema });
    setSchemaDialogOpen(true);
  };

  const handleViewQuery = (queryName: string, query: string) => {
    setSelectedQuery({ name: queryName, query });
    setQueryDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        BigQuery Export Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Export audit data, events, deliveries, and errors for BigQuery analysis and dashboard creation.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Export Data" icon={<DownloadIcon />} />
        <Tab label="Schema Reference" icon={<TableIcon />} />
        <Tab label="SQL Queries" icon={<CodeIcon />} />
        <Tab label="Export History" icon={<StorageIcon />} />
      </Tabs>

      {/* Export Data Tab */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Configuration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Start Date"
                      type="date"
                      value={startDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="End Date"
                      type="date"
                      value={endDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Export Format</InputLabel>
                      <Select
                        value={exportFormat}
                        label="Export Format"
                        onChange={(e: SelectChangeEvent) => 
                          setExportFormat(e.target.value as typeof exportFormat)
                        }
                      >
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="newline_delimited_json">NDJSON</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={handleFullExport}
                      disabled={loading}
                      size="large"
                    >
                      Create Full Export
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Individual Table Exports
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(schemas).map(([tableName, schema]) => (
                    <Grid item xs={12} key={tableName}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1">{tableName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {schema.fields.length} fields
                            </Typography>
                          </Box>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Schema">
                              <IconButton
                                size="small"
                                onClick={() => handleViewSchema(tableName, schema)}
                              >
                                <InfoIcon />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleTableExport(tableName)}
                              disabled={loading}
                            >
                              Export
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Schema Reference Tab */}
      <TabPanel value={currentTab} index={1}>
        <Typography variant="h6" gutterBottom>
          BigQuery Table Schemas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Reference schemas for creating BigQuery tables and understanding data structure.
        </Typography>

        {Object.entries(schemas).map(([tableName, schema]) => (
          <Accordion key={tableName} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2}>
                <DataIcon color="primary" />
                <Typography variant="h6">{tableName}</Typography>
                <Chip label={`${schema.fields.length} fields`} size="small" />
                {schema.partitioning && (
                  <Chip 
                    label={`Partitioned by ${schema.partitioning.field}`} 
                    size="small" 
                    color="secondary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <SchemaViewer schema={schema} tableName={tableName} />
              
              {schema.clustering && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Clustering Fields:
                  </Typography>
                  <Box display="flex" gap={1}>
                    {schema.clustering.map((field: string) => (
                      <Chip key={field} label={field} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>

      {/* SQL Queries Tab */}
      <TabPanel value={currentTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Looker Studio SQL Examples
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Pre-built SQL queries for common KPIs and dashboard metrics.
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(queries).map(([queryName, query]) => (
            <Grid item xs={12} md={6} key={queryName}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {queryName.replace(/_/g, ' ')}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewQuery(queryName, query)}
                    >
                      View Query
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getQueryDescription(queryName)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Export History Tab */}
      <TabPanel value={currentTab} index={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Export History
          </Typography>
          <IconButton onClick={loadExportHistory}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {exportHistory.length === 0 ? (
          <Alert severity="info">
            No exports found. Create your first export in the Export Data tab.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Export ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Time Range</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportHistory.map((export_item) => (
                  <TableRow key={export_item.export_id}>
                    <TableCell>
                      <code>{export_item.export_id}</code>
                    </TableCell>
                    <TableCell>
                      {new Date(export_item.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={export_item.export_format} size="small" />
                    </TableCell>
                    <TableCell>
                      {export_item.events_count + export_item.deliveries_count + 
                       export_item.errors_count + export_item.metrics_count}
                    </TableCell>
                    <TableCell>
                      {(export_item.export_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(export_item.time_range.start).toLocaleDateString()} - {' '}
                        {new Date(export_item.time_range.end).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Schema Dialog */}
      <Dialog
        open={schemaDialogOpen}
        onClose={() => setSchemaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Schema: {selectedSchema?.name}
        </DialogTitle>
        <DialogContent>
          {selectedSchema && (
            <SchemaViewer schema={selectedSchema.schema} tableName={selectedSchema.name} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSchemaDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Query Dialog */}
      <Dialog
        open={queryDialogOpen}
        onClose={() => setQueryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          SQL Query: {selectedQuery?.name?.replace(/_/g, ' ')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative' }}>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '14px',
              fontFamily: 'Monaco, monospace',
            }}>
              {selectedQuery?.query}
            </pre>
            <Button
              size="small"
              variant="outlined"
              onClick={() => copyToClipboard(selectedQuery?.query || '')}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              Copy
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const getQueryDescription = (queryName: string): string => {
  const descriptions: Record<string, string> = {
    request_turnaround_time: 'Analyze average request processing time and track SLA performance',
    backlog_trend: 'Monitor service backlog trends and identify bottlenecks',
    sla_breaches: 'Track SLA breach rates and identify problem areas',
    delivery_success_rate: 'Monitor delivery success rates by method and identify issues',
    error_analysis: 'Analyze error patterns and resolution rates across services',
  };
  
  return descriptions[queryName] || 'SQL query for dashboard metrics';
};

export default BigQueryExportDashboard;