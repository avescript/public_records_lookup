'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CloudDownload as CloudDownloadIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AdminLayout } from '../../../components/layouts/AdminLayout';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AuditPanel } from '../../../components/staff/AuditPanel';
import { BigQueryExportDashboard } from '../../../components/staff/BigQueryExportDashboard';
import { seedTestData } from '../../../utils/seedTestData';
import { 
  setupCompleteTestScenario, 
  seedExistingRequests,
  createSampleRequest,
  DEMO_SCRIPT,
  TestTrackingIds 
} from '../../../utils/testScenarios';
import { saveRequest } from '../../../services/requestService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tools-tabpanel-${index}`}
      aria-labelledby={`tools-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AdminToolsContent() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testData, setTestData] = useState<{
    existingRequests?: TestTrackingIds;
    sampleRequest?: string;
  } | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAction = async (actionType: string, actionFn: () => Promise<any>, successMsg: string) => {
    setLoading(actionType);
    setMessage(null);

    try {
      const result = await actionFn();
      if (result) {
        if (typeof result === 'string') {
          setTestData(prev => ({ ...prev, sampleRequest: result }));
        } else if (result.existingRequests || result.sampleRequest) {
          setTestData(result);
        }
      }
      setMessage({ type: 'success', text: successMsg });
    } catch (error) {
      console.error(`Error with ${actionType}:`, error);
      setMessage({
        type: 'error',
        text: `Failed to ${actionType}. Check console for details.`,
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSeedData = () => handleAction(
    'seedData', 
    seedTestData,
    'Basic test data seeded successfully!'
  );

  const handleSeedExisting = () => handleAction(
    'seedExisting',
    seedExistingRequests,
    '10 existing unfulfilled requests created successfully!'
  );

  const handleCreateSample = () => handleAction(
    'createSample',
    createSampleRequest,
    'Sample request created for requester testing!'
  );

  const handleCompleteSetup = () => handleAction(
    'completeSetup',
    setupCompleteTestScenario,
    'Complete test scenario setup finished! Check console for tracking IDs.'
  );

  const handleDirectTest = async () => {
    console.log('🧪 [Admin Tools] Creating direct test request...');
    
    const testRequestData = {
      title: 'Direct Test Request',
      department: 'police',
      description: 'This is a direct test request created from admin tools to debug the form submission flow.',
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        preset: 'year'
      },
      contactEmail: 'test@example.com',
      files: []
    };

    const result = await saveRequest(testRequestData);
    console.log('✅ [Admin Tools] Direct test request created:', result);
    return result.trackingId;
  };

  const handleTestDirect = () => handleAction(
    'testDirect',
    handleDirectTest,
    'Direct test request created successfully!'
  );

  const handleClearData = async () => {
    console.log('🧹 [Admin Tools] Clearing all mock data...');
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockFirebaseRequests');
      localStorage.removeItem('mockFirebaseCounter');
    }
    
    console.log('✅ [Admin Tools] Mock data cleared successfully');
    
    // Return a success message
    return 'cleared';
  };

  const handleClearMockData = () => handleAction(
    'clearData',
    handleClearData,
    'All mock data cleared successfully!'
  );

  const handleCreateMatchableRequests = async () => {
    console.log('🎯 [Admin Tools] Creating requests with guaranteed AI matches...');
    
    // Requests specifically designed to match the AI records
    const matchableRequests = [
      {
        title: 'Traffic Citations - Highway 99 Speeding',
        department: 'police',
        description: 'Request for traffic citation records for speeding violations on Highway 99 between Main Street and Oak Avenue in August 2025.',
        dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
        contactEmail: 'test@example.com',
        files: []
      },
      {
        title: 'Use of Force Reports - July 2025',
        department: 'police', 
        description: 'Requesting use of force incident reports and body camera footage logs for July 2025.',
        dateRange: { startDate: '2025-07-01', endDate: '2025-07-31' },
        contactEmail: 'journalist@example.com',
        files: []
      },
      {
        title: 'Fire Department Response Times',
        department: 'fire',
        description: 'Need emergency response time data including call volumes and incident types for research.',
        dateRange: { startDate: '2024-01-01', endDate: '2025-08-31' },
        contactEmail: 'researcher@example.com', 
        files: []
      }
    ];

    const trackingIds = [];
    for (const request of matchableRequests) {
      const result = await saveRequest(request);
      trackingIds.push(result.trackingId);
      console.log('✅ Created matchable request:', result.trackingId);
    }

    return trackingIds.join(', ');
  };

  const handleCreateMatchable = () => handleAction(
    'createMatchable',
    handleCreateMatchableRequests,
    'Created requests with guaranteed AI matches!'
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <Box sx={{ p: 4, maxWidth: '100%', mx: 'auto' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Tools & System Management
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Audit logging, data export, system observability, and development utilities.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 4 }}>
              {message.text}
            </Alert>
          )}

          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="admin tools tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<SecurityIcon />}
                label="Audit Log"
                id="tools-tab-0"
                aria-controls="tools-tabpanel-0"
              />
              <Tab
                icon={<CloudDownloadIcon />}
                label="BigQuery Export" 
                id="tools-tab-1"
                aria-controls="tools-tabpanel-1"
              />
              <Tab
                icon={<BuildIcon />}
                label="Development Tools"
                id="tools-tab-2"
                aria-controls="tools-tabpanel-2"
              />
              <Tab
                icon={<AssessmentIcon />}
                label="System Analytics"
                id="tools-tab-3"
                aria-controls="tools-tabpanel-3"
              />
            </Tabs>

            <TabPanel value={currentTab} index={0}>
              <Box sx={{ p: 3 }}>
                <AuditPanel
                  title="System Audit Log"
                  maxHeight={700}
                />
              </Box>
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <Box sx={{ p: 3 }}>
                <BigQueryExportDashboard />
              </Box>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Development Tools & Test Scenarios
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Development utilities for testing, demos, and data management.
                </Typography>

          <Grid container spacing={3}>
            {/* Basic Test Data */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Test Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Creates 7 simple sample requests for basic testing.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleSeedData}
                    disabled={!!loading}
                    startIcon={loading === 'seedData' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'seedData' ? 'Seeding...' : 'Seed Basic Data'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Existing Unfulfilled Requests */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Existing Requests (Admin Queue)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Creates 10 realistic unfulfilled requests that need admin processing.
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSeedExisting}
                    disabled={!!loading}
                    startIcon={loading === 'seedExisting' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'seedExisting' ? 'Creating...' : 'Create Existing Requests'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Sample Request for Testing */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sample Request (Requester Test)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Creates a single request perfect for testing the requester experience.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleCreateSample}
                    disabled={!!loading}
                    startIcon={loading === 'createSample' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'createSample' ? 'Creating...' : 'Create Sample Request'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Complete Test Scenario */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Complete Test Scenario
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sets up everything: existing requests + sample request for full demo.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCompleteSetup}
                    disabled={!!loading}
                    startIcon={loading === 'completeSetup' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'completeSetup' ? 'Setting up...' : 'Complete Setup'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Direct Test Request */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Direct Test Request
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Creates a single test request directly via saveRequest() to debug the flow.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleTestDirect}
                    disabled={!!loading}
                    startIcon={loading === 'testDirect' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'testDirect' ? 'Creating...' : 'Create Direct Test'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Clear Mock Data */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clear Mock Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Clears all mock data from localStorage. Useful if you have corrupted data.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearMockData}
                    disabled={!!loading}
                    startIcon={loading === 'clearData' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'clearData' ? 'Clearing...' : 'Clear All Data'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Matchable Requests */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI-Matchable Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Creates requests that are guaranteed to have AI matches for testing the record search workflow.
                  </Typography>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={handleCreateMatchable}
                    disabled={!!loading}
                    startIcon={loading === 'createMatchable' ? <CircularProgress size={20} /> : null}
                    fullWidth
                  >
                    {loading === 'createMatchable' ? 'Creating...' : 'Create Matchable Requests'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Demo Script */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Demo Script
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Follow these steps for a complete demo of the public records system:
                </Typography>
                {DEMO_SCRIPT.steps.map((step, index) => (
                  <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: '3px solid #1976d2' }}>
                    <Typography variant="subtitle2" color="primary">
                      Step {step.step}: {step.role}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Action:</strong> {step.action}
                    </Typography>
                    <Typography variant="body2">
                      <strong>URL:</strong> {step.url}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Data:</strong> {typeof step.data === 'string' ? step.data : 'Sample request data'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Expected:</strong> {step.expectedOutcome}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Test Data Display */}
            {testData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Created Test Data
                  </Typography>
                  {testData.sampleRequest && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        Sample Request Tracking ID:
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {testData.sampleRequest}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Use this ID to test status lookup at localhost:3000/status
                      </Typography>
                    </Box>
                  )}
                  {testData.existingRequests && (
                    <Box>
                      <Typography variant="subtitle2" color="secondary" gutterBottom>
                        Existing Requests Created (for admin processing):
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Check localhost:3000/admin/staff to process these requests
                      </Typography>
                      {Object.entries(testData.existingRequests).map(([key, trackingId]) => (
                        <Typography key={key} variant="body2" fontFamily="monospace" sx={{ mb: 0.5 }}>
                          {trackingId}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
              </Box>
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  System Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  System performance metrics, usage analytics, and operational insights.
                  This feature will be implemented in future releases.
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 3, mt: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Planned Analytics Features:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1 }}>
                    <li>Request processing time trends</li>
                    <li>AI matching accuracy metrics</li>
                    <li>User activity patterns</li>
                    <li>System performance monitoring</li>
                    <li>SLA compliance tracking</li>
                    <li>Error rate analysis</li>
                  </Box>
                </Paper>
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default function AdminToolsPage() {
  return (
    <AuthProvider>
      <AdminToolsContent />
    </AuthProvider>
  );
}
