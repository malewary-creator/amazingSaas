import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reportsService';
import { 
  TrendingUp, Package, Wrench, Briefcase, 
  DollarSign, AlertTriangle, Star, FileText, Shield 
} from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    sales: { total: number; paid: number; pending: number };
    inventory: { items: number; value: number; lowStock: number };
    service: { open: number; resolved: number; avgRating: number };
    projects: { total: number; active: number; capacity: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">Business insights and performance metrics</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Overview */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            ₹{((stats?.sales.total || 0) / 100000).toFixed(1)}L
          </p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs">
              <span>Collected: ₹{((stats?.sales.paid || 0) / 100000).toFixed(1)}L</span>
              <span>Pending: ₹{((stats?.sales.pending || 0) / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-10 h-10 opacity-80" />
            <AlertTriangle className={`w-6 h-6 ${(stats?.inventory.lowStock || 0) > 0 ? 'opacity-100' : 'opacity-30'}`} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Inventory Value</h3>
          <p className="text-3xl font-bold mt-2">
            ₹{((stats?.inventory.value || 0) / 100000).toFixed(1)}L
          </p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs">
              <span>{stats?.inventory.items || 0} Items</span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats?.inventory.lowStock || 0} Low Stock
              </span>
            </div>
          </div>
        </div>

        {/* Service Overview */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wrench className="w-10 h-10 opacity-80" />
            <Star className="w-6 h-6 opacity-60 fill-white" />
          </div>
          <h3 className="text-sm font-medium opacity-90">Service Tickets</h3>
          <p className="text-3xl font-bold mt-2">
            {(stats?.service.open || 0) + (stats?.service.resolved || 0)}
          </p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs">
              <span>Open: {stats?.service.open || 0}</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                {stats?.service.avgRating.toFixed(1) || 0}/5
              </span>
            </div>
          </div>
        </div>

        {/* Projects Overview */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-10 h-10 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Capacity</h3>
          <p className="text-3xl font-bold mt-2">
            {(stats?.projects.capacity || 0).toFixed(1)} kW
          </p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs">
              <span>Total: {stats?.projects.total || 0}</span>
              <span>Active: {stats?.projects.active || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/reports/sales')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sales & Revenue</h3>
                <p className="text-sm text-gray-600">Invoice and payment analytics</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports/payments')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payment Collection</h3>
                <p className="text-sm text-gray-600">Cash flow and collections</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports/inventory')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Inventory Reports</h3>
                <p className="text-sm text-gray-600">Stock levels and movement</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports/service')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Service Reports</h3>
                <p className="text-sm text-gray-600">Ticket analytics and ratings</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports/projects')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Project Reports</h3>
                <p className="text-sm text-gray-600">Pipeline and performance</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports/leads')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Lead Conversion</h3>
                <p className="text-sm text-gray-600">Source and conversion rates</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports/logs')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Logs</h3>
                <p className="text-sm text-gray-600">Audit trail and activity</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert('Custom reports coming soon')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Custom Reports</h3>
                <p className="text-sm text-gray-600">Build your own reports</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Collection Rate</span>
              <span className="text-sm font-semibold text-green-600">
                {stats ? ((stats.sales.paid / stats.sales.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Service Rating</span>
              <span className="text-sm font-semibold text-purple-600">
                {stats?.service.avgRating.toFixed(1)}/5.0
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Project Size</span>
              <span className="text-sm font-semibold text-orange-600">
                {stats?.projects.total ? (stats.projects.capacity / stats.projects.total).toFixed(1) : 0} kW
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Alerts</h3>
          <div className="space-y-3">
            {(stats?.inventory.lowStock || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{stats?.inventory.lowStock} items low on stock</span>
              </div>
            )}
            {(stats?.sales.pending || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span>₹{((stats?.sales.pending || 0) / 100000).toFixed(1)}L pending collection</span>
              </div>
            )}
            {(stats?.service.open || 0) > 5 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{stats?.service.open} open service tickets</span>
              </div>
            )}
            {!(stats?.inventory.lowStock || 0) && !(stats?.service.open || 0 > 5) && (
              <div className="text-sm text-gray-500">No critical alerts</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/reports/sales')}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded"
            >
              View Sales Report →
            </button>
            <button
              onClick={() => navigate('/reports/inventory')}
              className="w-full text-left text-sm text-green-600 hover:bg-green-50 px-3 py-2 rounded"
            >
              Check Inventory →
            </button>
            <button
              onClick={() => navigate('/reports/service')}
              className="w-full text-left text-sm text-purple-600 hover:bg-purple-50 px-3 py-2 rounded"
            >
              Service Analytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
