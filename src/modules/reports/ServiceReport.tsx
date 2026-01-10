import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Wrench, CheckCircle, 
  Clock, Star, AlertCircle, Filter
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';

interface ServiceData {
  totalTickets: number;
  resolved: number;
  pending: number;
  avgResolutionTime: number;
  avgRating: number;
  ticketsByPriority: Record<string, number>;
  ticketsByIssueType: Record<string, number>;
  resolutionRate: number;
}

const ServiceReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
      const data = await reportsService.getServiceReport(startDate, endDate);
      setServiceData(data);
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    loadServiceData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setTimeout(() => loadServiceData(), 0);
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
        <div className="text-gray-500">Loading service data...</div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Service Report</h1>
            <p className="text-sm text-gray-500 mt-1">Service ticket analytics and performance metrics</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{serviceData.totalTickets}</div>
          <div className="text-blue-100 text-sm">Total Tickets</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{serviceData.resolved}</div>
          <div className="text-green-100 text-sm">Resolved</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{serviceData.pending}</div>
          <div className="text-orange-100 text-sm">Pending</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{serviceData.avgResolutionTime}h</div>
          <div className="text-purple-100 text-sm">Avg Resolution</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{serviceData.avgRating.toFixed(1)}</div>
          <div className="text-yellow-100 text-sm">Avg Rating</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resolution Rate */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-5xl font-bold text-green-700 mb-2">
              {serviceData.resolutionRate.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-green-800">Resolution Rate</div>
            <div className="mt-4 w-full bg-green-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${serviceData.resolutionRate}%` }}
              />
            </div>
          </div>

          {/* Average Rating */}
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="h-10 w-10 text-yellow-600 fill-yellow-600" />
              <div className="text-5xl font-bold text-yellow-700">
                {serviceData.avgRating.toFixed(1)}
              </div>
            </div>
            <div className="text-sm font-medium text-yellow-800">Customer Satisfaction</div>
            <div className="mt-2 flex items-center justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(serviceData.avgRating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Avg Resolution Time */}
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="h-10 w-10 text-purple-600" />
              <div className="text-5xl font-bold text-purple-700">
                {serviceData.avgResolutionTime}
              </div>
            </div>
            <div className="text-sm font-medium text-purple-800">Hours (Avg Resolution)</div>
            <div className="mt-2 text-xs text-purple-600">
              ≈ {(serviceData.avgResolutionTime / 24).toFixed(1)} days
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Priority */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tickets by Priority</h2>
          <div className="space-y-4">
            {Object.entries(serviceData.ticketsByPriority)
              .sort(([, a], [, b]) => b - a)
              .map(([priority, count]) => {
                const priorityConfig = {
                  'Critical': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', bar: 'bg-red-600', label: 'text-red-900' },
                  'High': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-600', label: 'text-orange-900' },
                  'Medium': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-600', label: 'text-yellow-900' },
                  'Low': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                };
                const config = priorityConfig[priority as keyof typeof priorityConfig] || 
                  { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', bar: 'bg-gray-600', label: 'text-gray-900' };

                return (
                  <div key={priority} className={`p-4 ${config.bg} rounded-lg border ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${config.text}`}>{priority}</span>
                      <span className={`text-lg font-bold ${config.label}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.bar} h-2 rounded-full`}
                        style={{ width: `${(count / serviceData.totalTickets) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((count / serviceData.totalTickets) * 100).toFixed(1)}% of total tickets
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tickets by Issue Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tickets by Issue Type</h2>
          <div className="space-y-4">
            {Object.entries(serviceData.ticketsByIssueType)
              .sort(([, a], [, b]) => b - a)
              .map(([issueType, count], index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', label: 'text-blue-900' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', bar: 'bg-purple-600', label: 'text-purple-900' },
                  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', bar: 'bg-pink-600', label: 'text-pink-900' },
                  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', bar: 'bg-indigo-600', label: 'text-indigo-900' },
                  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', bar: 'bg-cyan-600', label: 'text-cyan-900' },
                ];
                const config = colors[index % colors.length];

                return (
                  <div key={issueType} className={`p-4 ${config.bg} rounded-lg border ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${config.text}`}>{issueType}</span>
                      <span className={`text-lg font-bold ${config.label}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.bar} h-2 rounded-full`}
                        style={{ width: `${(count / serviceData.totalTickets) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((count / serviceData.totalTickets) * 100).toFixed(1)}% of total tickets
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Strong Performance</div>
              <div className="text-gray-600">{serviceData.resolutionRate.toFixed(0)}% of tickets are resolved</div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Star className="h-5 w-5 text-yellow-600 mt-0.5 fill-yellow-600" />
            <div>
              <div className="font-medium text-gray-900">Customer Satisfaction</div>
              <div className="text-gray-600">Average rating of {serviceData.avgRating.toFixed(1)}/5.0</div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Response Time</div>
              <div className="text-gray-600">Avg resolution in {serviceData.avgResolutionTime} hours</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceReport;
