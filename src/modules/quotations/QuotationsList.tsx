/**
 * Quotations List Component
 * Displays all quotations with stats, filters, and actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Send, Eye, Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import { quotationsService } from '@/services/quotationsService';
import { db } from '@/services/database';
import type { Quotation, QuotationStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

interface QuotationWithDetails extends Omit<Quotation, 'leadId'> {
  customerName?: string;
  leadId?: string;
}

export function QuotationsList() {
  const [quotations, setQuotations] = useState<QuotationWithDetails[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'All'>('All');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; quotationId?: number }>({
    isOpen: false,
  });
  const [sendModal, setSendModal] = useState<{ isOpen: boolean; quotationId?: number }>({
    isOpen: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    totalValue: 0,
    acceptedValue: 0,
    acceptanceRate: 0,
  });

  const { success, error, info } = useToastStore();

  useEffect(() => {
    loadQuotations();
    loadStats();
    checkExpiredQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationsService.getQuotations();
      
      // Enrich with customer and lead data
      const enriched = await Promise.all(
        data.map(async (quotation) => {
          const customer = quotation.customerId 
            ? await db.customers.get(quotation.customerId)
            : null;
          const lead = await db.leads.get(quotation.leadId);
          
          return {
            ...quotation,
            customerName: customer?.name,
            leadId: lead?.leadId,
          };
        })
      );
      
      // Sort by date (newest first)
      enriched.sort((a, b) => 
        new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime()
      );
      
      setQuotations(enriched);
    } catch (err) {
      console.error('Error loading quotations:', err);
      error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await quotationsService.getQuotationStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const checkExpiredQuotations = async () => {
    try {
      const count = await quotationsService.checkExpiredQuotations();
      if (count > 0) {
        info(`${count} quotation(s) marked as expired`);
        loadQuotations();
        loadStats();
      }
    } catch (err) {
      console.error('Error checking expired quotations:', err);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.quotationNumber?.toLowerCase().includes(term) ||
          q.customerName?.toLowerCase().includes(term) ||
          q.leadId?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }
    
    setFilteredQuotations(filtered);
  };

  const handleDelete = async () => {
    if (!deleteModal.quotationId) return;
    
    try {
      await quotationsService.deleteQuotation(deleteModal.quotationId);
      success('Quotation deleted successfully');
      loadQuotations();
      loadStats();
      setDeleteModal({ isOpen: false });
    } catch (err) {
      console.error('Error deleting quotation:', err);
      error('Failed to delete quotation');
    }
  };

  const handleSend = async () => {
    if (!sendModal.quotationId) return;
    
    try {
      await quotationsService.sendQuotation(sendModal.quotationId);
      success('Quotation sent to customer');
      loadQuotations();
      loadStats();
      setSendModal({ isOpen: false });
    } catch (err) {
      console.error('Error sending quotation:', err);
      error('Failed to send quotation');
    }
  };

  const getStatusColor = (status: QuotationStatus): string => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Sent':
        return 'bg-blue-100 text-blue-700';
      case 'Accepted':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Expired':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpiringSoon = (validityDate: Date | string): boolean => {
    const validity = new Date(validityDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (validity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  const isExpired = (validityDate: Date | string, status: QuotationStatus): boolean => {
    if (status === 'Accepted' || status === 'Rejected' || status === 'Expired') {
      return false;
    }
    const validity = new Date(validityDate);
    const today = new Date();
    return validity < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading quotations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">Manage quotations and pricing proposals</p>
        </div>
        <Link to="/quotations/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quotations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">
              Draft: {stats.draft} | Sent: {stats.sent}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.accepted}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              Acceptance Rate: {stats.acceptanceRate}%
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">All quotations</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted Value</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.acceptedValue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Confirmed orders</span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by quotation number, customer, or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuotationStatus | 'All')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Quotations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'All'
                      ? 'No quotations found matching the filters'
                      : 'No quotations yet. Create your first quotation!'}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quotation) => (
                  <tr
                    key={quotation.id}
                    className={
                      quotation.validityDate && isExpired(quotation.validityDate, quotation.status)
                        ? 'bg-red-50'
                        : quotation.validityDate && isExpiringSoon(quotation.validityDate)
                        ? 'bg-yellow-50'
                        : 'hover:bg-gray-50'
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {quotation.quotationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quotation.customerName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quotation.leadId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(quotation.quotationDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quotation.validityDate ? formatDate(quotation.validityDate) : 'N/A'}
                      </div>
                      {quotation.validityDate && isExpiringSoon(quotation.validityDate) && (
                        <div className="text-xs text-orange-600 mt-1">Expiring soon</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          quotation.status
                        )}`}
                      >
                        {quotation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(quotation.grandTotal || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/quotations/${quotation.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {quotation.status === 'Draft' && (
                          <>
                            <Link
                              to={`/quotations/${quotation.id}/edit`}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setSendModal({ isOpen: true, quotationId: quotation.id })}
                              className="text-purple-600 hover:text-purple-900"
                              title="Send to Customer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, quotationId: quotation.id })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Send Confirmation Modal */}
      <ConfirmModal
        isOpen={sendModal.isOpen}
        onClose={() => setSendModal({ isOpen: false })}
        onConfirm={handleSend}
        title="Send Quotation"
        message="Are you sure you want to send this quotation to the customer? The quotation will be marked as 'Sent'."
        confirmText="Send"
        confirmVariant="primary"
      />
    </div>
  );
}
