import React, { useState, useEffect } from 'react';
import { leaveService } from '@/services/leaveService';
import { employeeService } from '@/services/employeeService';
import type { Employee, Leave } from '@/types';
import { Plus, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'LossOfPay'] as const;

export const LeaveManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'apply'>('pending');
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');

  const [formData, setFormData] = useState({
    leaveType: 'Casual' as const,
    fromDate: '',
    toDate: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, leaves] = await Promise.all([
        employeeService.getActiveEmployees(),
        leaveService.getPendingLeaves(),
      ]);
      setEmployees(emps);
      setPendingLeaves(leaves);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error loading leave data' });
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!formData.fromDate || !formData.toDate) return 0;
    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !formData.fromDate || !formData.toDate) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      setMessage({ type: 'error', text: 'Invalid date range' });
      return;
    }

    setSubmitting(true);
    try {
      const empId = typeof selectedEmployee === 'string' ? parseInt(selectedEmployee) : selectedEmployee;
      await leaveService.applyLeave({
        employeeId: empId,
        leaveType: formData.leaveType,
        fromDate: new Date(formData.fromDate),
        toDate: new Date(formData.toDate),
        numberOfDays: days,
        entitlement: 'Paid',
        reason: formData.reason,
        status: 'Applied',
      });

      setMessage({ type: 'success', text: 'Leave application submitted successfully' });
      setFormData({
        leaveType: 'Casual',
        fromDate: '',
        toDate: '',
        reason: '',
      });
      setSelectedEmployee('');
      setActiveTab('pending');
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error applying leave' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    if (!window.confirm('Approve this leave request?')) return;

    try {
        const { user } = useAuthStore.getState();
        const approverUserId = user?.id || 1;
      await leaveService.approveLeave(leaveId, approverUserId);
      setMessage({ type: 'success', text: 'Leave approved successfully' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error approving leave' });
    }
  };

  const handleRejectLeave = async (leaveId: number) => {
    if (!window.confirm('Reject this leave request?')) return;

    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await leaveService.rejectLeave(leaveId, reason);
      setMessage({ type: 'success', text: 'Leave rejected' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error rejecting leave' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee leave requests and approvals</p>
        </div>
        {activeTab === 'pending' && (
          <button
            onClick={() => setActiveTab('apply')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        )}
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'apply'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Apply for Leave
        </button>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {pendingLeaves.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-800 font-semibold">No pending leave requests</p>
              <p className="text-sm text-gray-500 mt-1">All leave requests have been processed</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingLeaves.map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId);
                const days = Math.ceil(
                  (new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1;

                return (
                  <div key={leave.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Employee</p>
                        <p className="font-semibold text-gray-900">{emp?.name}</p>
                        <p className="text-xs text-gray-500">{emp?.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Leave Type</p>
                        <p className="font-semibold text-gray-900">{leave.leaveType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Dates</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(leave.fromDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-600">
                          to {new Date(leave.toDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Days</p>
                        <p className="font-semibold text-gray-900">{days} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Entitlement</p>
                        <p className="font-semibold text-gray-900">{leave.entitlement}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Reason</p>
                        <p className="font-semibold text-gray-900">{leave.reason || '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveLeave(leave.id!)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-semibold text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave.id!)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Tab */}
      {activeTab === 'apply' && (
        <form onSubmit={handleApplyLeave} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Submit Leave Request</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveType}
                onChange={e => setFormData({ ...formData, leaveType: e.target.value as typeof formData.leaveType })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {LEAVE_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fromDate}
                onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.toDate}
                onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {formData.fromDate && formData.toDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900">
                Total Days: <span className="text-lg">{calculateDays()} days</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Provide a reason for leave..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
