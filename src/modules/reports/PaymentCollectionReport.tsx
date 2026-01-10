import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CreditCard, TrendingUp, 
  Wallet, Calendar, Filter, DollarSign 
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';

interface PaymentData {
  totalCollected: number;
  collectionByMode: Record<string, number>;
  collectionByMonth: Array<{ month: string; amount: number }>;
  avgPaymentValue: number;
}

const PaymentCollectionReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
      const data = await reportsService.getPaymentCollectionReport(startDate, endDate);
      setPaymentData(data);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    loadPaymentData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setTimeout(() => loadPaymentData(), 0);
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
        <div className="text-gray-500">Loading payment data...</div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const maxCollection = Math.max(...paymentData.collectionByMonth.map(m => m.amount), 1);

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
            <h1 className="text-2xl font-bold text-gray-900">Payment Collection Report</h1>
            <p className="text-sm text-gray-500 mt-1">Track payment collections and cash flow</p>
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
          <div className="text-3xl font-bold mb-1">₹{paymentData.totalCollected.toLocaleString()}</div>
          <div className="text-green-100 text-sm">Total Collected</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{Object.keys(paymentData.collectionByMode).length}</div>
          <div className="text-blue-100 text-sm">Payment Modes</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">₹{paymentData.avgPaymentValue.toLocaleString()}</div>
          <div className="text-purple-100 text-sm">Average Payment</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{paymentData.collectionByMonth.length}</div>
          <div className="text-orange-100 text-sm">Active Months</div>
        </div>
      </div>

      {/* Collection Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Collection Trend (Monthly)</h2>
        <div className="space-y-4">
          {paymentData.collectionByMonth.map((month, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">₹{month.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(month.amount / maxCollection) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Mode Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Mode Distribution</h2>
          <div className="space-y-4">
            {Object.entries(paymentData.collectionByMode)
              .sort(([, a], [, b]) => b - a)
              .map(([mode, amount], index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', label: 'text-blue-900' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', bar: 'bg-purple-600', label: 'text-purple-900' },
                  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-600', label: 'text-orange-900' },
                  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', bar: 'bg-pink-600', label: 'text-pink-900' },
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={mode} className={`p-4 ${color.bg} rounded-lg border ${color.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${color.text}`}>{mode}</span>
                      <span className={`text-lg font-bold ${color.label}`}>₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${color.bar} h-2 rounded-full`}
                        style={{ width: `${(amount / paymentData.totalCollected) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((amount / paymentData.totalCollected) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Collection Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Collection Summary</h2>
          
          <div className="space-y-6">
            {/* Total Collection */}
            <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 mb-1">Total Collections</div>
                  <div className="text-2xl font-bold text-green-900">
                    ₹{paymentData.totalCollected.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </div>

            {/* Average Payment */}
            <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 mb-1">Average Payment Value</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₹{paymentData.avgPaymentValue.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>

            {/* Time Period */}
            <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-700 mb-1">Reporting Period</div>
                  <div className="text-xl font-bold text-purple-900">
                    {dateRange.start && dateRange.end 
                      ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
                      : 'Current Year'
                    }
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </div>

            {/* Payment Modes Count */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Payment Modes</span>
                <span className="font-semibold text-gray-900">
                  {Object.keys(paymentData.collectionByMode).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCollectionReport;
