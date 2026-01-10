/**
 * Invoices List Component
 * Displays all invoices with stats, filters, and payment tracking
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  IndianRupee,
  AlertCircle,
  Clock
} from 'lucide-react';
import { invoicesService } from '@/services/invoicesService';
import { db } from '@/services/database';
import type { Invoice, InvoiceStatus, InvoiceType } from '@/types/extended';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

interface InvoiceWithDetails extends Invoice {
  customerName?: string;
  projectId?: number;
}

export function InvoicesList() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'All'>('All');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; invoiceId?: number }>({
    isOpen: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    generated: 0,
    sent: 0,
    paid: 0,
    partiallyPaid: 0,
    overdue: 0,
    cancelled: 0,
    totalValue: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    collectionRate: 0,
  });

  const { success, error } = useToastStore();

  useEffect(() => {
    loadInvoices();
    loadStats();
    checkOverdueInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, typeFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesService.getInvoices();
      
      // Enrich with customer data
      const enriched = await Promise.all(
        data.map(async (invoice) => {
          const customer = await db.customers.get(invoice.customerId);
          
          return {
            ...invoice,
            customerName: customer?.name,
          };
        })
      );
      
      // Sort by date (newest first)
      enriched.sort((a, b) => 
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
      
      setInvoices(enriched);
    } catch (err) {
      console.error('Error loading invoices:', err);
      error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await invoicesService.getInvoiceStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const checkOverdueInvoices = async () => {
    try {
      const count = await invoicesService.checkOverdueInvoices();
      if (count > 0) {
        error(`${count} invoice(s) marked as overdue`);
        loadInvoices();
        loadStats();
      }
    } catch (err) {
      console.error('Error checking overdue invoices:', err);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(term) ||
          inv.customerName?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter((inv) => inv.invoiceType === typeFilter);
    }
    
    setFilteredInvoices(filtered);
  };

  const handleDelete = async () => {
    if (!deleteModal.invoiceId) return;
    
    try {
      await invoicesService.deleteInvoice(deleteModal.invoiceId);
      success('Invoice deleted successfully');
      loadInvoices();
      loadStats();
      setDeleteModal({ isOpen: false });
    } catch (err) {
      console.error('Error deleting invoice:', err);
      error('Failed to delete invoice');
    }
  };

  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Generated':
        return 'bg-blue-100 text-blue-700';
      case 'Sent':
        return 'bg-purple-100 text-purple-700';
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: InvoiceType): string => {
    switch (type) {
      case 'Tax Invoice':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Proforma':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Stage Payment':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  const isOverdue = (dueDate: Date | string | undefined, status: InvoiceStatus): boolean => {
    if (!dueDate || status === 'Paid' || status === 'Cancelled') {
      return false;
    }
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getPaymentProgress = (grandTotal: number, amountPaid: number = 0): number => {
    if (grandTotal === 0) return 0;
    return Math.round((amountPaid / grandTotal) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">GST-compliant invoice generation and tracking</p>
        </div>
        <Link to="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">
              Paid: {stats.paid} | Pending: {stats.sent + stats.generated}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              Partially Paid: {stats.partiallyPaid}
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
              <IndianRupee className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">All active invoices</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(stats.outstandingAmount)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              Collection: {stats.collectionRate}%
            </span>
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
              placeholder="Search by invoice number or customer..."
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
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'All')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Generated">Generated</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as InvoiceType | 'All')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All Types</option>
              <option value="Tax Invoice">Tax Invoice</option>
              <option value="Proforma">Proforma</option>
              <option value="Stage Payment">Stage Payment</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'All' || typeFilter !== 'All'
                      ? 'No invoices found matching the filters'
                      : 'No invoices yet. Create your first invoice!'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const paymentProgress = getPaymentProgress(
                    invoice.grandTotal,
                    invoice.amountPaid
                  );
                  
                  return (
                    <tr
                      key={invoice.id}
                      className={
                        isOverdue(invoice.dueDate, invoice.status)
                          ? 'bg-red-50'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.customerName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getTypeColor(
                            invoice.invoiceType
                          )}`}
                        >
                          {invoice.invoiceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                        </div>
                        {isOverdue(invoice.dueDate, invoice.status) && (
                          <div className="text-xs text-red-600 mt-1 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.grandTotal)}
                        </div>
                        {invoice.balanceAmount && invoice.balanceAmount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Balance: {formatCurrency(invoice.balanceAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>{paymentProgress}%</span>
                            <span className="text-xs">
                              {formatCurrency(invoice.amountPaid || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                paymentProgress === 100
                                  ? 'bg-green-500'
                                  : paymentProgress > 0
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-300'
                              }`}
                              style={{ width: `${paymentProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {invoice.status === 'Draft' && (
                            <Link
                              to={`/invoices/${invoice.id}/edit`}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            onClick={() =>
                              setDeleteModal({ isOpen: true, invoiceId: invoice.id })
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
