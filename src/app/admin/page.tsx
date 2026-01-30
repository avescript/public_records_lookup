/**
 * Admin Dashboard Page
 * Epic 9 Task 6: Agency Dashboard & Analytics
 *
 * Main admin interface that provides access to all agency management,
 * analytics, and monitoring features
 */

'use client';

import React, { useEffect, useState } from 'react';

import AgencyDashboard from '../../components/admin/AgencyDashboard';
import AgencyManagement from '../../components/admin/AgencyManagement';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('overview');
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has admin permissions
    if (!loading && (!user || user.role !== 'admin')) {
      // In a real app, redirect to unauthorized page
      console.warn('Unauthorized access attempt to admin dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 text-6xl mb-4'>🚫</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Access Denied
          </h1>
          <p className='text-gray-600'>
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return <SystemOverview />;
      case 'agencies':
        return <AgencyManagement />;
      case 'analytics':
        if (selectedAgency) {
          return <AgencyDashboard agencyId={selectedAgency} />;
        }
        return <AnalyticsOverview onSelectAgency={setSelectedAgency} />;
      case 'monitoring':
        return <SystemMonitoring />;
      default:
        return <SystemOverview />;
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Admin Dashboard
              </h1>
              <p className='text-gray-600'>
                System administration and agency management
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-600'>
                Welcome, {user.name || user.email}
              </span>
              <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium'>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* Sidebar */}
        <nav className='w-64 bg-white shadow-sm min-h-screen border-r'>
          <div className='p-4'>
            <ul className='space-y-2'>
              <NavItem
                icon='📊'
                label='System Overview'
                active={currentView === 'overview'}
                onClick={() => {
                  setCurrentView('overview');
                  setSelectedAgency(null);
                }}
              />
              <NavItem
                icon='🏢'
                label='Agency Management'
                active={currentView === 'agencies'}
                onClick={() => {
                  setCurrentView('agencies');
                  setSelectedAgency(null);
                }}
              />
              <NavItem
                icon='📈'
                label='Analytics & Reports'
                active={currentView === 'analytics'}
                onClick={() => {
                  setCurrentView('analytics');
                  setSelectedAgency(null);
                }}
              />
              <NavItem
                icon='🔍'
                label='System Monitoring'
                active={currentView === 'monitoring'}
                onClick={() => {
                  setCurrentView('monitoring');
                  setSelectedAgency(null);
                }}
              />
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className='flex-1'>{renderContent()}</main>
      </div>
    </div>
  );
}

// Supporting Components
const NavItem: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 border-blue-200'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className='text-lg mr-3'>{icon}</span>
      <span className='font-medium'>{label}</span>
    </button>
  </li>
);

const SystemOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalAgencies: 5,
    activeRequests: 124,
    systemHealth: 98.5,
    totalCosts: 12450,
    recentActivity: [
      { time: '2 min ago', event: 'New document processed for Police Dept' },
      { time: '5 min ago', event: 'Budget alert triggered for Health Dept' },
      { time: '12 min ago', event: 'User approved redaction for Fire Dept' },
      { time: '18 min ago', event: 'OCR processing completed for Finance' },
    ],
  });

  return (
    <div className='p-6'>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          System Overview
        </h2>
        <p className='text-gray-600'>Real-time system status and key metrics</p>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <MetricCard
          title='Total Agencies'
          value={stats.totalAgencies}
          subtitle='All active agencies'
          icon='🏢'
          color='blue'
        />
        <MetricCard
          title='Active Requests'
          value={stats.activeRequests}
          subtitle='Currently processing'
          icon='📄'
          color='green'
        />
        <MetricCard
          title='System Health'
          value={`${stats.systemHealth}%`}
          subtitle='Uptime & performance'
          icon='💚'
          color='green'
        />
        <MetricCard
          title='Monthly Costs'
          value={`$${stats.totalCosts.toLocaleString()}`}
          subtitle='Current billing period'
          icon='💰'
          color='orange'
        />
      </div>

      {/* Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Recent Activity
          </h3>
          <div className='space-y-3'>
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className='flex items-start space-x-3'>
                <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0'></div>
                <div>
                  <p className='text-sm text-gray-900'>{activity.event}</p>
                  <p className='text-xs text-gray-500'>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            System Status
          </h3>
          <div className='space-y-4'>
            <StatusItem label='API Services' status='operational' />
            <StatusItem label='Database' status='operational' />
            <StatusItem label='OCR Processing' status='operational' />
            <StatusItem label='File Storage' status='degraded' />
            <StatusItem label='Notifications' status='operational' />
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsOverview: React.FC<{
  onSelectAgency: (agencyId: string) => void;
}> = ({ onSelectAgency }) => {
  const agencies = [
    { id: 'police', name: 'Police Department', requests: 1250, cost: 3200 },
    { id: 'fire', name: 'Fire Department', requests: 850, cost: 2100 },
    { id: 'finance', name: 'Finance Department', requests: 420, cost: 980 },
    { id: 'parks', name: 'Parks & Recreation', requests: 180, cost: 420 },
    { id: 'health', name: 'Health Department', requests: 75, cost: 1800 },
  ];

  return (
    <div className='p-6'>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Analytics Overview
        </h2>
        <p className='text-gray-600'>
          Select an agency to view detailed analytics
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {agencies.map(agency => (
          <div
            key={agency.id}
            onClick={() => onSelectAgency(agency.id)}
            className='bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow'
          >
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              {agency.name}
            </h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Requests</span>
                <span className='font-medium'>
                  {agency.requests.toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Monthly Cost</span>
                <span className='font-medium'>
                  ${agency.cost.toLocaleString()}
                </span>
              </div>
            </div>
            <div className='mt-4'>
              <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                View Dashboard →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemMonitoring: React.FC = () => {
  return (
    <div className='p-6'>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          System Monitoring
        </h2>
        <p className='text-gray-600'>Real-time system monitoring and alerts</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Performance Metrics */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Performance Metrics
          </h3>
          <div className='space-y-4'>
            <MetricBar label='CPU Usage' value={45} unit='%' color='blue' />
            <MetricBar label='Memory Usage' value={62} unit='%' color='green' />
            <MetricBar label='Disk Usage' value={78} unit='%' color='orange' />
            <MetricBar label='Network I/O' value={32} unit='%' color='purple' />
          </div>
        </div>

        {/* Active Alerts */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Active Alerts
          </h3>
          <div className='space-y-3'>
            <AlertItem
              type='warning'
              message='High storage usage detected'
              time='5 min ago'
            />
            <AlertItem
              type='info'
              message='Scheduled maintenance in 2 hours'
              time='1 hour ago'
            />
            <AlertItem
              type='success'
              message='All systems operational'
              time='2 hours ago'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} shadow-sm`}>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='text-sm font-medium text-gray-600'>{title}</h3>
        <span className='text-2xl'>{icon}</span>
      </div>
      <div className='text-3xl font-bold text-gray-900 mb-1'>{value}</div>
      <div className='text-sm text-gray-500'>{subtitle}</div>
    </div>
  );
};

const StatusItem: React.FC<{
  label: string;
  status: 'operational' | 'degraded' | 'outage';
}> = ({ label, status }) => {
  const statusConfig = {
    operational: {
      color: 'text-green-600',
      bg: 'bg-green-100',
      text: 'Operational',
    },
    degraded: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      text: 'Degraded',
    },
    outage: { color: 'text-red-600', bg: 'bg-red-100', text: 'Outage' },
  };

  const config = statusConfig[status];

  return (
    <div className='flex items-center justify-between'>
      <span className='text-gray-700'>{label}</span>
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}
      >
        {config.text}
      </span>
    </div>
  );
};

const MetricBar: React.FC<{
  label: string;
  value: number;
  unit: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}> = ({ label, value, unit, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className='flex justify-between mb-1'>
        <span className='text-sm text-gray-700'>{label}</span>
        <span className='text-sm text-gray-900'>
          {value}
          {unit}
        </span>
      </div>
      <div className='w-full bg-gray-200 rounded-full h-2'>
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
};

const AlertItem: React.FC<{
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
  time: string;
}> = ({ type, message, time }) => {
  const typeConfig = {
    success: { icon: '✅', color: 'text-green-600' },
    warning: { icon: '⚠️', color: 'text-yellow-600' },
    info: { icon: 'ℹ️', color: 'text-blue-600' },
    error: { icon: '❌', color: 'text-red-600' },
  };

  const config = typeConfig[type];

  return (
    <div className='flex items-start space-x-3'>
      <span className='text-lg'>{config.icon}</span>
      <div className='flex-1'>
        <p className='text-sm text-gray-900'>{message}</p>
        <p className='text-xs text-gray-500'>{time}</p>
      </div>
    </div>
  );
};
