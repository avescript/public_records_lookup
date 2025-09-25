/**
 * Legal Review Dashboard (Epic 5)
 * Comprehensive dashboard for legal reviewers combining US-050 and US-051
 * Provides overview of comment threads, change requests, and package approvals
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Comment as CommentIcon,
  Inventory as PackageIcon,
  ChangeCircle as ChangeIcon,
  Schedule as TimeIcon,
  TrendingUp as TrendingIcon,
  Notifications as NotificationIcon,
  Assignment as TaskIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { 
  legalReviewService, 
  LegalReviewSummary,
  CommentThread,
  ChangeRequest,
  PackageApproval,
} from '../../../services/legalReviewService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`legal-review-tabpanel-${index}`}
      aria-labelledby={`legal-review-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingIcon 
                  fontSize="small" 
                  color={trend.direction === 'up' ? 'error' : 'success'}
                  sx={{ 
                    transform: trend.direction === 'down' ? 'rotate(180deg)' : 'none'
                  }}
                />
                <Typography 
                  variant="caption" 
                  color={trend.direction === 'up' ? 'error.main' : 'success.main'}
                  sx={{ ml: 0.5 }}
                >
                  {trend.percentage}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface RecentActivityItemProps {
  activity: {
    id: string;
    type: 'thread_created' | 'comment_added' | 'change_requested' | 'package_approved' | 'package_rejected';
    title: string;
    description: string;
    timestamp: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

const RecentActivityItem: React.FC<RecentActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'thread_created': return <CommentIcon color="primary" />;
      case 'comment_added': return <CommentIcon color="info" />;
      case 'change_requested': return <ChangeIcon color="warning" />;
      case 'package_approved': return <CompleteIcon color="success" />;
      case 'package_rejected': return <ErrorIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <ListItem>
      <ListItemIcon>
        {getActivityIcon(activity.type)}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2">
              {activity.title}
            </Typography>
            {activity.priority && (
              <Chip 
                label={activity.priority.toUpperCase()} 
                size="small"
                color={getPriorityColor(activity.priority) as any}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {activity.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(activity.timestamp).toLocaleString()}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

export const LegalReviewDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [summary, setSummary] = useState<LegalReviewSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const summaryData = await legalReviewService.getLegalReviewSummary();
      setSummary(summaryData);
      
      // Generate mock recent activity - in real app this would come from audit logs
      setRecentActivity([
        {
          id: '1',
          type: 'thread_created',
          title: 'New comment thread created',
          description: 'Change request for additional redactions in document ABC-123',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          priority: 'high',
        },
        {
          id: '2',
          type: 'package_approved',
          title: 'Package approved for delivery',
          description: 'Package PKG-456 containing 5 documents approved and locked',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          priority: 'medium',
        },
        {
          id: '3',
          type: 'change_requested',
          title: 'Changes requested',
          description: 'Document XYZ-789 requires additional redactions before approval',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          priority: 'urgent',
        },
      ]);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Box p={2}>
        <Typography>Loading legal review dashboard...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!summary) {
    return (
      <Alert severity="error">
        Failed to load dashboard data
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <DashboardIcon color="primary" />
        <Typography variant="h4" fontWeight="bold">
          Legal Review Dashboard
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Open Comment Threads"
            value={summary.openThreads}
            icon={<CommentIcon sx={{ fontSize: 40 }} />}
            color="warning"
            trend={{ direction: 'up', percentage: 12 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Pending Change Requests"
            value={summary.pendingChangeRequests}
            icon={<ChangeIcon sx={{ fontSize: 40 }} />}
            color="error"
            trend={{ direction: 'down', percentage: 5 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Packages Awaiting Approval"
            value={summary.packagesAwaitingApproval}
            icon={<PackageIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Approved Packages"
            value={summary.approvedPackages}
            icon={<CompleteIcon sx={{ fontSize: 40 }} />}
            color="success"
            trend={{ direction: 'up', percentage: 8 }}
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          aria-label="legal review dashboard tabs"
        >
          <Tab 
            label="Overview" 
            icon={<DashboardIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Comment Threads" 
            icon={<CommentIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Package Approvals" 
            icon={<PackageIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Change Requests" 
            icon={<ChangeIcon />} 
            iconPosition="start"
          />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Performance Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average Review Time
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {summary.averageReviewTime.toFixed(1)}h
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Resolution Rate
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {summary.totalThreads > 0 
                        ? Math.round((summary.resolvedThreads / summary.totalThreads) * 100)
                        : 0
                      }%
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {(summary.pendingChangeRequests + summary.completedChangeRequests) > 0
                        ? Math.round((summary.completedChangeRequests / (summary.pendingChangeRequests + summary.completedChangeRequests)) * 100)
                        : 0
                      }%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <List>
                    {recentActivity.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <RecentActivityItem activity={activity} />
                        {index < recentActivity.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TaskIcon />}
                        onClick={() => setCurrentTab(1)}
                      >
                        Review Comments
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<PackageIcon />}
                        onClick={() => setCurrentTab(2)}
                      >
                        Approve Packages
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ChangeIcon />}
                        onClick={() => setCurrentTab(3)}
                      >
                        Handle Changes
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<NotificationIcon />}
                      >
                        View Notifications
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Comment Threads Tab */}
        <TabPanel value={currentTab} index={1}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Comment threads for individual records are managed within the Request Details view. 
            Use this section to get an overview of all comment activity across requests.
          </Alert>
          <Typography variant="h6" gutterBottom>
            Comment Thread Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total Threads: {summary.totalThreads} | 
            Open: {summary.openThreads} | 
            Resolved: {summary.resolvedThreads}
          </Typography>
        </TabPanel>

        {/* Package Approvals Tab */}
        <TabPanel value={currentTab} index={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Package approvals are managed within individual request workflows. 
            Use this section to get an overview of all package approval activity.
          </Alert>
          <Typography variant="h6" gutterBottom>
            Package Approval Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Awaiting Approval: {summary.packagesAwaitingApproval} | 
            Approved: {summary.approvedPackages}
          </Typography>
        </TabPanel>

        {/* Change Requests Tab */}
        <TabPanel value={currentTab} index={3}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Change requests are created through comment threads and managed within individual record workflows.
          </Alert>
          <Typography variant="h6" gutterBottom>
            Change Request Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pending: {summary.pendingChangeRequests} | 
            Completed: {summary.completedChangeRequests}
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default LegalReviewDashboard;