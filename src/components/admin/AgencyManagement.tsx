/**
 * Agency Management Interface
 * Epic 9 Task 6: Agency Dashboard & Analytics
 *
 * Comprehensive admin interface for agency management, monitoring, and configuration
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { agencyAnalyticsService } from '../../services/agencyAnalyticsService';

import AgencyDashboard from './AgencyDashboard';

interface Agency {
  id: string;
  name: string;
  tier: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  requestCount: number;
  lastActivity: string;
  monthlyBudget: number;
  currentUsage: number;
  contactEmail: string;
  department: string;
  setupDate: string;
}

interface AgencyConfig {
  maxRequests: number;
  maxStorage: number; // MB
  maxDocuments: number;
  ocrEnabled: boolean;
  autoApproval: boolean;
  redactionRules: string[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    webhooks: boolean;
  };
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
}

const AgencyManagement: React.FC = () => {
  // State Management
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig | null>(null);

  // Load agencies data
  const loadAgencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock agencies data (in production, this would come from API)
      const mockAgencies: Agency[] = [
        {
          id: 'police',
          name: 'Police Department',
          tier: 'enterprise',
          status: 'active',
          requestCount: 1250,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          monthlyBudget: 5000,
          currentUsage: 3200,
          contactEmail: 'admin@police.gov',
          department: 'Public Safety',
          setupDate: '2024-01-15T00:00:00Z',
        },
        {
          id: 'fire',
          name: 'Fire Department',
          tier: 'enterprise',
          status: 'active',
          requestCount: 850,
          lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          monthlyBudget: 3500,
          currentUsage: 2100,
          contactEmail: 'admin@fire.gov',
          department: 'Public Safety',
          setupDate: '2024-02-01T00:00:00Z',
        },
        {
          id: 'finance',
          name: 'Finance Department',
          tier: 'premium',
          status: 'active',
          requestCount: 420,
          lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          monthlyBudget: 2000,
          currentUsage: 980,
          contactEmail: 'admin@finance.gov',
          department: 'Administration',
          setupDate: '2024-03-10T00:00:00Z',
        },
        {
          id: 'parks',
          name: 'Parks & Recreation',
          tier: 'basic',
          status: 'active',
          requestCount: 180,
          lastActivity: new Date(
            Date.now() - 12 * 60 * 60 * 1000
          ).toISOString(),
          monthlyBudget: 800,
          currentUsage: 420,
          contactEmail: 'admin@parks.gov',
          department: 'Recreation',
          setupDate: '2024-04-20T00:00:00Z',
        },
        {
          id: 'health',
          name: 'Health Department',
          tier: 'premium',
          status: 'suspended',
          requestCount: 75,
          lastActivity: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          monthlyBudget: 1500,
          currentUsage: 1800, // Over budget
          contactEmail: 'admin@health.gov',
          department: 'Public Health',
          setupDate: '2024-05-05T00:00:00Z',
        },
      ];

      setAgencies(mockAgencies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  // Filtering
  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch =
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || agency.tier === filterTier;
    const matchesStatus =
      filterStatus === 'all' || agency.status === filterStatus;

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Agency Actions
  const handleViewDashboard = (agencyId: string) => {
    setSelectedAgency(agencyId);
    setShowDashboard(true);
  };

  const handleEditConfig = async (agencyId: string) => {
    // Mock config loading
    const mockConfig: AgencyConfig = {
      maxRequests: 1000,
      maxStorage: 10000,
      maxDocuments: 5000,
      ocrEnabled: true,
      autoApproval: agencies.find(a => a.id === agencyId)?.tier !== 'basic',
      redactionRules: ['PII', 'SSN', 'PHONE', 'EMAIL'],
      notificationSettings: {
        email: true,
        sms: false,
        webhooks: true,
      },
      reportingFrequency: 'weekly',
    };

    setAgencyConfig(mockConfig);
    setSelectedAgency(agencyId);
    setShowConfigModal(true);
  };

  const handleSuspendAgency = async (agencyId: string) => {
    if (confirm('Are you sure you want to suspend this agency?')) {
      setAgencies(prev =>
        prev.map(agency =>
          agency.id === agencyId
            ? { ...agency, status: 'suspended' as const }
            : agency
        )
      );
    }
  };

  const handleActivateAgency = async (agencyId: string) => {
    setAgencies(prev =>
      prev.map(agency =>
        agency.id === agencyId
          ? { ...agency, status: 'active' as const }
          : agency
      )
    );
  };

  const handleDeleteAgency = async (agencyId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this agency? This action cannot be undone.'
      )
    ) {
      setAgencies(prev => prev.filter(agency => agency.id !== agencyId));
    }
  };

  // Config Modal Handlers
  const handleSaveConfig = async () => {
    if (agencyConfig && selectedAgency) {
      console.log('Saving config for agency:', selectedAgency, agencyConfig);
      setShowConfigModal(false);
      setAgencyConfig(null);
      setSelectedAgency(null);
    }
  };

  const handleCloseConfig = () => {
    setShowConfigModal(false);
    setAgencyConfig(null);
    setSelectedAgency(null);
  };

  // Add Agency Form Handler
  const handleAddAgency = async (formData: Partial<Agency>) => {
    const newAgency: Agency = {
      id: formData.name!.toLowerCase().replace(/\s+/g, '-'),
      name: formData.name!,
      tier: formData.tier!,
      status: 'active',
      requestCount: 0,
      lastActivity: new Date().toISOString(),
      monthlyBudget: formData.monthlyBudget || 1000,
      currentUsage: 0,
      contactEmail: formData.contactEmail!,
      department: formData.department!,
      setupDate: new Date().toISOString(),
    };

    setAgencies(prev => [...prev, newAgency]);
    setShowAddForm(false);
  };

  // Summary Stats
  const summaryStats = {
    totalAgencies: agencies.length,
    activeAgencies: agencies.filter(a => a.status === 'active').length,
    suspendedAgencies: agencies.filter(a => a.status === 'suspended').length,
    totalRequests: agencies.reduce((sum, a) => sum + a.requestCount, 0),
    totalUsage: agencies.reduce((sum, a) => sum + a.currentUsage, 0),
    totalBudget: agencies.reduce((sum, a) => sum + a.monthlyBudget, 0),
  };

  if (showDashboard && selectedAgency) {
    return (
      <div>
        <div className='mb-4'>
          <button
            onClick={() => setShowDashboard(false)}
            className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
          >
            ← Back to Agency Management
          </button>
        </div>
        <AgencyDashboard agencyId={selectedAgency} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading agencies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 text-xl mb-4'>⚠️ Error</div>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={loadAgencies}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Agency Management
        </h1>
        <p className='text-gray-600'>
          Manage agencies, monitor usage, and configure settings
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <SummaryCard
          title='Total Agencies'
          value={summaryStats.totalAgencies}
          subtitle={`${summaryStats.activeAgencies} active`}
          icon='🏢'
        />
        <SummaryCard
          title='Total Requests'
          value={summaryStats.totalRequests.toLocaleString()}
          subtitle='This month'
          icon='📄'
        />
        <SummaryCard
          title='Usage Cost'
          value={`$${summaryStats.totalUsage.toLocaleString()}`}
          subtitle={`Budget: $${summaryStats.totalBudget.toLocaleString()}`}
          icon='💰'
        />
        <SummaryCard
          title='System Health'
          value='98.5%'
          subtitle='Uptime'
          icon='📊'
        />
      </div>

      {/* Controls */}
      <div className='mb-6 bg-white p-4 rounded-lg shadow-sm border'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          {/* Search and Filters */}
          <div className='flex items-center space-x-4'>
            <input
              type='text'
              placeholder='Search agencies...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />

            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Tiers</option>
              <option value='basic'>Basic</option>
              <option value='premium'>Premium</option>
              <option value='enterprise'>Enterprise</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='suspended'>Suspended</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowAddForm(true)}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Add Agency
            </button>
            <button
              onClick={loadAgencies}
              className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Agencies Table */}
      <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Agency
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Tier
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Requests
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Usage/Budget
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Last Activity
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredAgencies.map(agency => (
                <AgencyRow
                  key={agency.id}
                  agency={agency}
                  onViewDashboard={handleViewDashboard}
                  onEditConfig={handleEditConfig}
                  onSuspend={handleSuspendAgency}
                  onActivate={handleActivateAgency}
                  onDelete={handleDeleteAgency}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Agency Modal */}
      {showAddForm && (
        <AddAgencyModal
          onSave={handleAddAgency}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Config Modal */}
      {showConfigModal && agencyConfig && selectedAgency && (
        <ConfigModal
          agencyId={selectedAgency}
          config={agencyConfig}
          onConfigChange={setAgencyConfig}
          onSave={handleSaveConfig}
          onCancel={handleCloseConfig}
        />
      )}
    </div>
  );
};

// Supporting Components
const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
}> = ({ title, value, subtitle, icon }) => (
  <div className='bg-white p-6 rounded-lg shadow-sm border'>
    <div className='flex items-center justify-between mb-2'>
      <h3 className='text-sm font-medium text-gray-600'>{title}</h3>
      <span className='text-2xl'>{icon}</span>
    </div>
    <div className='text-3xl font-bold text-gray-900 mb-1'>{value}</div>
    <div className='text-sm text-gray-500'>{subtitle}</div>
  </div>
);

const AgencyRow: React.FC<{
  agency: Agency;
  onViewDashboard: (id: string) => void;
  onEditConfig: (id: string) => void;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({
  agency,
  onViewDashboard,
  onEditConfig,
  onSuspend,
  onActivate,
  onDelete,
}) => {
  const tierColors = {
    basic: 'bg-gray-100 text-gray-800',
    premium: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-purple-100 text-purple-800',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  const usagePercentage = (agency.currentUsage / agency.monthlyBudget) * 100;
  const isOverBudget = usagePercentage > 100;

  return (
    <tr className='hover:bg-gray-50'>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div>
          <div className='text-sm font-medium text-gray-900'>{agency.name}</div>
          <div className='text-sm text-gray-500'>{agency.department}</div>
          <div className='text-xs text-gray-400'>{agency.contactEmail}</div>
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${tierColors[agency.tier]}`}
        >
          {agency.tier}
        </span>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[agency.status]}`}
        >
          {agency.status}
        </span>
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
        {agency.requestCount.toLocaleString()}
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-sm text-gray-900'>
          <span className={isOverBudget ? 'text-red-600' : 'text-gray-900'}>
            ${agency.currentUsage.toLocaleString()}
          </span>
          <span className='text-gray-500'>
            /${agency.monthlyBudget.toLocaleString()}
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
          <div
            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
        {new Date(agency.lastActivity).toLocaleDateString()}
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
        <button
          onClick={() => onViewDashboard(agency.id)}
          className='text-blue-600 hover:text-blue-900'
        >
          Dashboard
        </button>
        <button
          onClick={() => onEditConfig(agency.id)}
          className='text-green-600 hover:text-green-900'
        >
          Config
        </button>
        {agency.status === 'active' ? (
          <button
            onClick={() => onSuspend(agency.id)}
            className='text-red-600 hover:text-red-900'
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() => onActivate(agency.id)}
            className='text-green-600 hover:text-green-900'
          >
            Activate
          </button>
        )}
        <button
          onClick={() => onDelete(agency.id)}
          className='text-red-600 hover:text-red-900'
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

const AddAgencyModal: React.FC<{
  onSave: (data: Partial<Agency>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    tier: 'basic' as Agency['tier'],
    department: '',
    contactEmail: '',
    monthlyBudget: 1000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4'>Add New Agency</h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Agency Name
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Department
            </label>
            <input
              type='text'
              value={formData.department}
              onChange={e =>
                setFormData(prev => ({ ...prev, department: e.target.value }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Contact Email
            </label>
            <input
              type='email'
              value={formData.contactEmail}
              onChange={e =>
                setFormData(prev => ({ ...prev, contactEmail: e.target.value }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tier
            </label>
            <select
              value={formData.tier}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  tier: e.target.value as Agency['tier'],
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
            >
              <option value='basic'>Basic</option>
              <option value='premium'>Premium</option>
              <option value='enterprise'>Enterprise</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Monthly Budget
            </label>
            <input
              type='number'
              value={formData.monthlyBudget}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  monthlyBudget: Number(e.target.value),
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              min='0'
              required
            />
          </div>

          <div className='flex space-x-4 pt-4'>
            <button
              type='submit'
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Add Agency
            </button>
            <button
              type='button'
              onClick={onCancel}
              className='flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfigModal: React.FC<{
  agencyId: string;
  config: AgencyConfig;
  onConfigChange: (config: AgencyConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ agencyId, config, onConfigChange, onSave, onCancel }) => {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto'>
        <h2 className='text-xl font-bold mb-4'>
          Agency Configuration: {agencyId}
        </h2>

        <div className='space-y-6'>
          {/* Limits */}
          <div>
            <h3 className='text-lg font-medium mb-3'>Usage Limits</h3>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Max Requests
                </label>
                <input
                  type='number'
                  value={config.maxRequests}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      maxRequests: Number(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Max Storage (MB)
                </label>
                <input
                  type='number'
                  value={config.maxStorage}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      maxStorage: Number(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Max Documents
                </label>
                <input
                  type='number'
                  value={config.maxDocuments}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      maxDocuments: Number(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className='text-lg font-medium mb-3'>Features</h3>
            <div className='space-y-2'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.ocrEnabled}
                  onChange={e =>
                    onConfigChange({ ...config, ocrEnabled: e.target.checked })
                  }
                  className='mr-2'
                />
                OCR Processing Enabled
              </label>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.autoApproval}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      autoApproval: e.target.checked,
                    })
                  }
                  className='mr-2'
                />
                Auto Approval for Low-Risk Redactions
              </label>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className='text-lg font-medium mb-3'>Notifications</h3>
            <div className='space-y-2'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.notificationSettings.email}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      notificationSettings: {
                        ...config.notificationSettings,
                        email: e.target.checked,
                      },
                    })
                  }
                  className='mr-2'
                />
                Email Notifications
              </label>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.notificationSettings.sms}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      notificationSettings: {
                        ...config.notificationSettings,
                        sms: e.target.checked,
                      },
                    })
                  }
                  className='mr-2'
                />
                SMS Notifications
              </label>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.notificationSettings.webhooks}
                  onChange={e =>
                    onConfigChange({
                      ...config,
                      notificationSettings: {
                        ...config.notificationSettings,
                        webhooks: e.target.checked,
                      },
                    })
                  }
                  className='mr-2'
                />
                Webhook Notifications
              </label>
            </div>
          </div>

          {/* Reporting */}
          <div>
            <h3 className='text-lg font-medium mb-3'>Reporting</h3>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Report Frequency
              </label>
              <select
                value={config.reportingFrequency}
                onChange={e =>
                  onConfigChange({
                    ...config,
                    reportingFrequency: e.target
                      .value as AgencyConfig['reportingFrequency'],
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
              >
                <option value='daily'>Daily</option>
                <option value='weekly'>Weekly</option>
                <option value='monthly'>Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <div className='flex space-x-4 pt-6'>
          <button
            onClick={onSave}
            className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Save Configuration
          </button>
          <button
            onClick={onCancel}
            className='flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgencyManagement;
