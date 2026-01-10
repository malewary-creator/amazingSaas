/**
 * Leads List Component
 * Display and manage all leads
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2,
  Phone,
  Mail,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';
import { leadsService } from '@/services/leadsService';
import { db } from '@/services/database';
import type { Lead } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

interface LeadWithCustomer extends Lead {
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
}

export default function LeadsList() {
  const toast = useToastStore();
  const [leads, setLeads] = useState<LeadWithCustomer[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
  });

  // Load leads
  useEffect(() => {
    loadLeads();
    loadStats();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leadsData = await leadsService.getLeads();
      
      // Fetch customer details for each lead
      const leadsWithCustomers: LeadWithCustomer[] = await Promise.all(
        leadsData.map(async (lead) => {
          const customer = await db.customers.get(lead.customerId);
          return {
            ...lead,
            customerName: customer?.name || 'Unknown',
            customerMobile: customer?.mobile || '',
            customerEmail: customer?.email,
          };
        })
      );

      setLeads(leadsWithCustomers);
      setFilteredLeads(leadsWithCustomers);
    } catch (error) {
      console.error('Failed to load leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await leadsService.getLeadStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        lead =>
          lead.leadId.toLowerCase().includes(term) ||
          lead.customerName.toLowerCase().includes(term) ||
          lead.customerMobile.includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, sourceFilter, leads]);

  const handleDelete = async () => {
    if (!selectedLead) return;

    try {
      await leadsService.deleteLead(selectedLead);
      toast.success('Lead deleted successfully');
      setShowDeleteModal(false);
      setSelectedLead(null);
      loadLeads();
      loadStats();
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'In-progress': 'bg-yellow-100 text-yellow-800',
      'Converted': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'On-hold': 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="mt-2 text-gray-600">Track and manage your solar leads</p>
        </div>
        <Link to="/leads/new">
          <Button icon={<Plus className="h-4 w-4" />}>Add New Lead</Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.new}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">🆕</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.inProgress}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.converted}</p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Lead ID, Name, or Mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="In-progress">In Progress</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
                <option value="On-hold">On Hold</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Sources</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Social Media">Social Media</option>
                <option value="Website">Website</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Follow-up
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter || sourceFilter
                      ? 'No leads found matching your filters'
                      : 'No leads yet. Click "Add New Lead" to get started!'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.leadId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{lead.customerMobile}</span>
                        </div>
                        {lead.customerEmail && (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{lead.customerEmail}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {lead.requiredSystemSize ? `${lead.requiredSystemSize} kW` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.followUpDate ? (
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(lead.followUpDate)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/leads/${lead.id}`}>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link to={`/leads/${lead.id}/edit`}>
                          <button
                            className="text-orange-600 hover:text-orange-900"
                            title="Edit Lead"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedLead(lead.id!);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLead(null);
        }}
        onConfirm={handleDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
}
