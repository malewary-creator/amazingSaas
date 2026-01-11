import React, { useState, useEffect } from 'react';
import { attendanceService } from '@/services/attendanceService';
import { employeeService } from '@/services/employeeService';
import type { Employee, Attendance } from '@/types';
import { Clock, CheckCircle2, XCircle, MapPin, AlertCircle } from 'lucide-react';

export const AttendanceCheckin: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [selectedSite, setSelectedSite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, attendance] = await Promise.all([
        employeeService.getActiveEmployees(),
        attendanceService.getTodayAttendance(),
      ]);
      setEmployees(emps);
      setTodayAttendance(attendance);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error loading attendance data' });
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeAttendance = (empId: number) => {
    return todayAttendance.find(a => a.employeeId === empId);
  };

  const handleCheckIn = async () => {
    if (!selectedEmployee || !selectedSite) {
      setMessage({ type: 'error', text: 'Please select employee and site' });
      return;
    }

    setSubmitting(true);
    try {
      const empId = typeof selectedEmployee === 'string' ? parseInt(selectedEmployee) : selectedEmployee;
      await attendanceService.checkIn(empId, selectedSite);
      setMessage({ type: 'success', text: 'Check-in recorded successfully' });
      await loadData();
      setSelectedEmployee('');
      setSelectedSite('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error during check-in' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (empId: number) => {
    setSubmitting(true);
    try {
      await attendanceService.checkOut(empId);
      setMessage({ type: 'success', text: 'Check-out recorded successfully' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error during check-out' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAbsent = async (empId: number) => {
    if (!window.confirm('Mark this employee as absent for today?')) return;

    setSubmitting(true);
    try {
      await attendanceService.recordAttendance({
        employeeId: empId,
        date: new Date(),
        status: 'Absent',
      });
      setMessage({ type: 'success', text: 'Employee marked as absent' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error marking absent' });
    } finally {
      setSubmitting(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Check-in/Out</h1>
        <p className="text-sm text-gray-500 mt-1">Record daily employee attendance</p>
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

      {/* Check-in Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Record Check-In
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site/Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              placeholder="Enter site name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCheckIn}
              disabled={submitting || !selectedEmployee || !selectedSite}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Recording...' : 'Check In'}
            </button>
          </div>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Today's Attendance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Check-In
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Check-Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {todayAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No attendance records for today
                  </td>
                </tr>
              ) : (
                todayAttendance.map(att => {
                  const emp = employees.find(e => e.id === att.employeeId);
                  const hours = att.workingHours
                    ? (att.workingHours / 3600).toFixed(1)
                    : '-';

                  return (
                    <tr key={att.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {emp?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp?.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {att.checkInTime
                          ? new Date(att.checkInTime).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {att.checkOutTime
                          ? new Date(att.checkOutTime).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{hours} hrs</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {att.siteId}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {!att.checkOutTime ? (
                          <button
                            onClick={() => handleCheckOut(att.employeeId)}
                            disabled={submitting}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 disabled:opacity-50"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Absent */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600" />
          Mark Absent
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees
            .filter(emp => !getEmployeeAttendance(emp.id!))
            .map(emp => (
              <button
                key={emp.id}
                onClick={() => handleMarkAbsent(emp.id!)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors text-left"
              >
                <div className="font-semibold">{emp.name}</div>
                <div className="text-xs text-gray-500">{emp.employeeId}</div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
