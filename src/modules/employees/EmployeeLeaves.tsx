import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { leaveService } from '@/services/leaveService';
import type { Employee, Leave, LeaveBalance, LeaveType } from '@/types';

export const EmployeeLeaves: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = useMemo(
    () =>
      [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ] as const,
    []
  );

  const currentYear = new Date().getFullYear();
  const yearRange = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);

  useEffect(() => {
    const empId = Number(id);
    if (!empId || Number.isNaN(empId)) return;

    (async () => {
      try {
        setLoading(true);
        const emp = await employeeService.getEmployeeById(empId);
        setEmployee(emp || null);

        const records = await leaveService.getEmployeeLeaves(empId, selectedMonth, selectedYear);
        setLeaves(records);

        const leaveTypes: LeaveType[] = ['Casual', 'Sick', 'Earned', 'Loss of Pay'];
        const bal = await Promise.all(leaveTypes.map((t) => leaveService.getLeaveBalance(empId, t, selectedYear)));
        setBalances(bal);
      } catch (error) {
        console.error('Error loading employee leaves:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-800 font-semibold">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/employees/${employee.id}/details`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave History</h1>
            <p className="text-sm text-gray-500 mt-1">
              {employee.name} • {employee.employeeId}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {yearRange.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div key={b.leaveType} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{b.leaveType}</p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {b.availableDays} / {b.totalDays}
            </p>
            <p className="text-xs text-gray-500 mt-1">Used: {b.usedDays}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Records</h2>
        </div>

        {leaves.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-800 font-semibold">No leave records</p>
            <p className="text-sm text-gray-500">No leave records for selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entitlement</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{l.leaveType}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(l.fromDate).toLocaleDateString('en-IN')} –{' '}
                      {new Date(l.toDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{l.numberOfDays}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{l.entitlement}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          l.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : l.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : l.status === 'Cancelled'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
