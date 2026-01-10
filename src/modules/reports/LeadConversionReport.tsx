import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Users, TrendingUp, 
  CheckCircle, XCircle, Filter, Target, DollarSign 
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';

interface LeadData {
  totalLeads: number;
  qualified: number;
  converted: number;
  lost: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  leadsByStatus: Record<string, number>;
  avgLeadValue: number;
}

const LeadConversionReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLeadData();
  }, []);

  const loadLeadData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
      const data = await reportsService.getLeadConversionReport(startDate, endDate);
      setLeadData(data);
    } catch (error) {
      console.error('Error loading lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    loadLeadData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setTimeout(() => loadLeadData(), 0);
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
        <div className="text-gray-500">Loading lead data...</div>
      </div>
    );
  }

  if (!leadData) {
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
            <h1 className="text-2xl font-bold text-gray-900">Lead Conversion Report</h1>
            <p className="text-sm text-gray-500 mt-1">Lead pipeline analysis and conversion metrics</p>
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
            <Users className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{leadData.totalLeads}</div>
          <div className="text-blue-100 text-sm">Total Leads</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{leadData.qualified}</div>
          <div className="text-yellow-100 text-sm">Qualified</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{leadData.converted}</div>
          <div className="text-green-100 text-sm">Converted</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{leadData.lost}</div>
          <div className="text-red-100 text-sm">Lost</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{leadData.conversionRate.toFixed(1)}%</div>
          <div className="text-purple-100 text-sm">Conversion Rate</div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Lead Conversion Funnel</h2>
        
        <div className="space-y-4">
          {/* Total Leads */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Leads</span>
              <span className="text-lg font-bold text-gray-900">{leadData.totalLeads}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-lg h-16 flex items-center justify-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-16 rounded-lg w-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">100%</span>
              </div>
            </div>
          </div>

          {/* Qualified Leads */}
          <div className="relative pl-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Qualified Leads</span>
              <span className="text-lg font-bold text-gray-900">{leadData.qualified}</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-lg h-14">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-14 rounded-lg flex items-center justify-center transition-all duration-500"
                style={{ width: `${(leadData.qualified / leadData.totalLeads) * 100}%` }}
              >
                <span className="text-white font-semibold">
                  {((leadData.qualified / leadData.totalLeads) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Converted Leads */}
          <div className="relative pl-16">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Converted to Projects</span>
              <span className="text-lg font-bold text-gray-900">{leadData.converted}</span>
            </div>
            <div className="w-full bg-green-200 rounded-lg h-12">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-12 rounded-lg flex items-center justify-center transition-all duration-500"
                style={{ width: `${(leadData.converted / leadData.totalLeads) * 100}%` }}
              >
                <span className="text-white font-semibold">
                  {leadData.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Lost Leads */}
          <div className="relative pl-24">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Lost Leads</span>
              <span className="text-lg font-bold text-gray-900">{leadData.lost}</span>
            </div>
            <div className="w-full bg-red-200 rounded-lg h-10">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-10 rounded-lg flex items-center justify-center transition-all duration-500"
                style={{ width: `${(leadData.lost / leadData.totalLeads) * 100}%` }}
              >
                <span className="text-white font-semibold">
                  {((leadData.lost / leadData.totalLeads) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{leadData.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-green-600 mt-1">Conversion Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">₹{leadData.avgLeadValue.toLocaleString()}</div>
            <div className="text-xs text-purple-600 mt-1">Avg Lead Value</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {leadData.totalLeads > 0 ? ((leadData.qualified / leadData.totalLeads) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-blue-600 mt-1">Qualification Rate</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Leads by Source</h2>
          <div className="space-y-4">
            {Object.entries(leadData.leadsBySource)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count], index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', label: 'text-blue-900' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', bar: 'bg-purple-600', label: 'text-purple-900' },
                  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-600', label: 'text-orange-900' },
                  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', bar: 'bg-pink-600', label: 'text-pink-900' },
                ];
                const config = colors[index % colors.length];

                return (
                  <div key={source} className={`p-4 ${config.bg} rounded-lg border ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${config.text}`}>{source}</span>
                      <span className={`text-lg font-bold ${config.label}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.bar} h-2 rounded-full`}
                        style={{ width: `${(count / leadData.totalLeads) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((count / leadData.totalLeads) * 100).toFixed(1)}% of total leads
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Leads by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Leads by Status</h2>
          <div className="space-y-4">
            {Object.entries(leadData.leadsByStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const statusConfig = {
                  'New': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', label: 'text-blue-900' },
                  'In-progress': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-600', label: 'text-yellow-900' },
                  'Converted': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                  'Lost': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', bar: 'bg-red-600', label: 'text-red-900' },
                };
                const config = statusConfig[status as keyof typeof statusConfig] || 
                  { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', bar: 'bg-gray-600', label: 'text-gray-900' };

                return (
                  <div key={status} className={`p-4 ${config.bg} rounded-lg border ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${config.text}`}>{status}</span>
                      <span className={`text-lg font-bold ${config.label}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.bar} h-2 rounded-full`}
                        style={{ width: `${(count / leadData.totalLeads) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((count / leadData.totalLeads) * 100).toFixed(1)}% of total leads
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Lead Performance Summary</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• <span className="font-medium">Conversion Rate:</span> {leadData.conversionRate.toFixed(1)}% of leads converted to projects</p>
              <p>• <span className="font-medium">Average Lead Value:</span> ₹{leadData.avgLeadValue.toLocaleString()} per lead</p>
              <p>• <span className="font-medium">Total Pipeline Value:</span> ₹{(leadData.avgLeadValue * leadData.totalLeads).toLocaleString()}</p>
            </div>
          </div>
          <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center">
            <DollarSign className="h-12 w-12 text-green-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadConversionReport;
