import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, TrendingUp, DollarSign, 
  ShoppingCart, Package, Filter, Calendar 
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';

interface SalesData {
  totalInvoices: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  avgInvoiceValue: number;
  invoicesByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

const SalesRevenueReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(0);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
      const data = await reportsService.getSalesReport(startDate, endDate);
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    loadSalesData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setTimeout(() => loadSalesData(), 0);
  };

  const exportToPDF = () => {
    alert('PDF export functionality will be implemented with a library like jsPDF');
  };

  const exportToExcel = () => {
    alert('Excel export functionality will be implemented with a library like xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading sales data...</div>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...salesData.revenueByMonth.map(m => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales & Revenue Report</h1>
            <p className="text-sm text-gray-500 mt-1">Comprehensive sales analysis and revenue insights</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Date Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={applyDateFilter}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">₹{salesData.totalRevenue.toLocaleString()}</div>
          <div className="text-green-100 text-sm">Total Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{salesData.totalInvoices}</div>
          <div className="text-blue-100 text-sm">Total Invoices</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">₹{salesData.avgInvoiceValue.toLocaleString()}</div>
          <div className="text-purple-100 text-sm">Average Invoice Value</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">₹{salesData.totalPending.toLocaleString()}</div>
          <div className="text-orange-100 text-sm">Pending Amount</div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend (Monthly)</h2>
        <div className="space-y-4">
          {salesData.revenueByMonth.map((month, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">₹{month.revenue.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Invoice Status Distribution</h2>
          <div className="space-y-4">
            {Object.entries(salesData.invoicesByStatus).map(([status, count], index) => {
              const colors = {
                'Paid': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                'Partially Paid': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-600', label: 'text-yellow-900' },
                'Unpaid': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', bar: 'bg-red-600', label: 'text-red-900' },
                'Overdue': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', bar: 'bg-red-600', label: 'text-red-900' },
              };
              const color = colors[status as keyof typeof colors] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', bar: 'bg-gray-600', label: 'text-gray-900' };

              return (
                <div key={index} className={`p-4 ${color.bg} rounded-lg border ${color.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${color.text}`}>{status}</span>
                    <span className={`text-lg font-bold ${color.label}`}>{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${color.bar} h-2 rounded-full`}
                      style={{ width: `${(count / salesData.totalInvoices) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Invoices</span>
              <span className="font-semibold text-gray-900">{salesData.totalInvoices}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Summary</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Total Paid</span>
                <span className="text-lg font-bold text-green-900">₹{salesData.totalPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">Pending Amount</span>
                <span className="text-lg font-bold text-yellow-900">₹{salesData.totalPending.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">Overdue Amount</span>
                <span className="text-lg font-bold text-red-900">₹{salesData.totalOverdue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-gray-900">₹{salesData.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Collection Rate</span>
              <span className="font-semibold text-gray-900">
                {((salesData.totalPaid / salesData.totalRevenue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesRevenueReport;
