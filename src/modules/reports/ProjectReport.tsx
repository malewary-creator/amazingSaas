import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Briefcase, CheckCircle, 
  Clock, Zap, Filter, DollarSign, TrendingUp 
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';

interface ProjectData {
  totalProjects: number;
  completed: number;
  ongoing: number;
  totalCapacity: number;
  projectsByStatus: Record<string, number>;
  projectsByType: Record<string, number>;
  avgProjectValue: number;
}

const ProjectReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
      const data = await reportsService.getProjectReport(startDate, endDate);
      setProjectData(data);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    loadProjectData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setTimeout(() => loadProjectData(), 0);
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
        <div className="text-gray-500">Loading project data...</div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const completionRate = projectData.totalProjects > 0 
    ? (projectData.completed / projectData.totalProjects) * 100 
    : 0;

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
            <h1 className="text-2xl font-bold text-gray-900">Project Report</h1>
            <p className="text-sm text-gray-500 mt-1">Project portfolio analysis and performance tracking</p>
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
            <Briefcase className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{projectData.totalProjects}</div>
          <div className="text-blue-100 text-sm">Total Projects</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{projectData.completed}</div>
          <div className="text-green-100 text-sm">Completed</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{projectData.ongoing}</div>
          <div className="text-orange-100 text-sm">Ongoing</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{projectData.totalCapacity.toFixed(1)}</div>
          <div className="text-yellow-100 text-sm">kW Capacity</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{completionRate.toFixed(0)}%</div>
          <div className="text-purple-100 text-sm">Completion Rate</div>
        </div>
      </div>

      {/* Project Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Performance Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Completion Rate */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-5xl font-bold text-green-700 mb-2">
              {completionRate.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-green-800 mb-4">Project Completion Rate</div>
            <div className="w-full bg-green-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-green-600">
              {projectData.completed} out of {projectData.totalProjects} completed
            </div>
          </div>

          {/* Total Capacity */}
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="h-10 w-10 text-yellow-600" />
              <div className="text-5xl font-bold text-yellow-700">
                {projectData.totalCapacity.toFixed(1)}
              </div>
            </div>
            <div className="text-sm font-medium text-yellow-800 mb-2">Total System Capacity (kW)</div>
            <div className="text-xs text-yellow-600">
              Avg: {(projectData.totalCapacity / (projectData.totalProjects || 1)).toFixed(2)} kW per project
            </div>
          </div>

          {/* Average Project Value */}
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="h-10 w-10 text-purple-600" />
              <div className="text-4xl font-bold text-purple-700">
                ₹{(projectData.avgProjectValue / 100000).toFixed(1)}L
              </div>
            </div>
            <div className="text-sm font-medium text-purple-800 mb-2">Average Project Value</div>
            <div className="text-xs text-purple-600">
              Total Portfolio: ₹{((projectData.avgProjectValue * projectData.totalProjects) / 10000000).toFixed(2)}Cr
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Projects by Status</h2>
          <div className="space-y-4">
            {Object.entries(projectData.projectsByStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const statusConfig = {
                  'Planning': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', label: 'text-blue-900' },
                  'In Progress': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-600', label: 'text-yellow-900' },
                  'Installation': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-600', label: 'text-orange-900' },
                  'Testing': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', bar: 'bg-purple-600', label: 'text-purple-900' },
                  'Completed': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                  'On Hold': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', bar: 'bg-gray-600', label: 'text-gray-900' },
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
                        style={{ width: `${(count / projectData.totalProjects) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((count / projectData.totalProjects) * 100).toFixed(1)}% of total projects
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Projects by Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Projects by System Type</h2>
          <div className="space-y-4">
            {Object.entries(projectData.projectsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count], index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', label: 'text-blue-900' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-600', label: 'text-green-900' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', bar: 'bg-purple-600', label: 'text-purple-900' },
                  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-600', label: 'text-orange-900' },
                ];
                const config = colors[index % colors.length];

                return (
                  <div key={type} className={`p-4 ${config.bg} rounded-lg border ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${config.text}`}>{type}</span>
                      <span className={`text-lg font-bold ${config.label}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.bar} h-2 rounded-full`}
                        style={{ width: `${(count / projectData.totalProjects) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {((count / projectData.totalProjects) * 100).toFixed(1)}% of total projects
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total System Types</span>
              <span className="font-semibold text-gray-900">
                {Object.keys(projectData.projectsByType).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Capacity</span>
              <span className="font-semibold text-gray-900">
                {projectData.totalCapacity.toFixed(2)} kW
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Portfolio Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Success Rate</div>
              <div className="text-gray-600">{completionRate.toFixed(0)}% projects completed successfully</div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Installed Capacity</div>
              <div className="text-gray-600">{projectData.totalCapacity.toFixed(1)} kW total solar power</div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Portfolio Value</div>
              <div className="text-gray-600">₹{((projectData.avgProjectValue * projectData.totalProjects) / 10000000).toFixed(2)}Cr in projects</div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Active Projects</div>
              <div className="text-gray-600">{projectData.ongoing} projects in progress</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;
