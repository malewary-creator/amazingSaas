import React, { useState, useEffect } from 'react';
import { db } from '@/services/database';
import type { AuditLog } from '@/types';
import { Shield, Filter, Download, Calendar } from 'lucide-react';

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ module: '', action: '', userId: '' });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    let query = db.auditLogs.orderBy('timestamp').reverse();
    let results = await query.toArray();

    if (filters.module) {
      results = results.filter(l => l.module.toLowerCase().includes(filters.module.toLowerCase()));
    }
    if (filters.action) {
      results = results.filter(l => l.action === filters.action);
    }
    if (filters.userId) {
      results = results.filter(l => l.userId === parseInt(filters.userId, 10));
    }

    setLogs(results.slice(0, 500)); // Limit to 500 most recent
    setLoading(false);
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Module', 'Action', 'User ID', 'Record ID', 'User Agent'].join(','),
      ...logs.map(l => [
        new Date(l.timestamp).toISOString(),
        l.module,
        l.action,
        l.userId || '',
        l.recordId || '',
        `"${(l.userAgent || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Error':
        return 'text-red-600 bg-red-50';
      case 'Delete':
        return 'text-orange-600 bg-orange-50';
      case 'Create':
        return 'text-green-600 bg-green-50';
      case 'Update':
        return 'text-blue-600 bg-blue-50';
      case 'Login':
        return 'text-purple-600 bg-purple-50';
      case 'Logout':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-700 bg-gray-100';
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
            <p className="text-sm text-gray-600">Audit trail and activity monitoring</p>
          </div>
        </div>
        <button
          onClick={exportLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search module..."
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Actions</option>
            <option value="Create">Create</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
            <option value="Login">Login</option>
            <option value="Logout">Logout</option>
            <option value="Error">Error</option>
            <option value="Export">Export</option>
            <option value="Approve">Approve</option>
            <option value="Reject">Reject</option>
          </select>
          <input
            type="text"
            placeholder="User ID..."
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setFilters({ module: '', action: '', userId: '' })}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Events</div>
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Errors</div>
          <div className="text-2xl font-bold text-red-600">{logs.filter(l => l.action === 'Error').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Data Changes</div>
          <div className="text-2xl font-bold text-blue-600">
            {logs.filter(l => ['Create', 'Update', 'Delete'].includes(l.action)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Auth Events</div>
          <div className="text-2xl font-bold text-purple-600">
            {logs.filter(l => ['Login', 'Logout'].includes(l.action)).length}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                    <p className="mt-1 text-sm text-gray-500">No activity recorded yet.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{log.module}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.userId || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.recordId || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.newValue ? JSON.parse(log.newValue).message || '—' : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logs.length >= 500 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
            Showing most recent 500 entries
          </div>
        )}
      </div>
    </div>
  );
};
