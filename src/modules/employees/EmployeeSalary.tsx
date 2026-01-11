import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '@/services/employeeService';
import { salaryService } from '@/services/salaryService';
import type { Employee, SalarySetup, SalarySheet } from '@/types';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const EmployeeSalary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salarySetup, setSalarySetup] = useState<SalarySetup | null>(null);
  const [salarySheets, setSalarySheets] = useState<SalarySheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadSalaryData(parseInt(id));
    }
  }, [id]);

  const loadSalaryData = async (empId: number) => {
    try {
      setLoading(true);
      const emp = await employeeService.getEmployeeById(empId);
      setEmployee(emp || null);

      if (emp) {
        const setup = await salaryService.getSalarySetup(empId);
        setSalarySetup(setup || null);

        // Load last 6 months salary sheets
        const sheets: SalarySheet[] = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
          const month = now.getMonth() - i + 1;
          const year = now.getFullYear();
          const sheet = await salaryService.getSalarySheet(empId, month, year);
          if (sheet) sheets.push(sheet);
        }
        setSalarySheets(sheets);
      }
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSalary = async () => {
    if (!id) return;

    setGenerating(true);
    try {
      const now = new Date();
      await salaryService.generateMonthlySalarySheet(
        parseInt(id),
        now.getMonth() + 1,
        now.getFullYear()
      );
      setMessage({ type: 'success', text: 'Salary sheet generated successfully' });
      await loadSalaryData(parseInt(id));
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error generating salary sheet' });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (sheetId: number) => {
    try {
      await salaryService.approveSalarySheet(sheetId, 1); // Replace with actual user ID
      setMessage({ type: 'success', text: 'Salary sheet approved' });
      await loadSalaryData(parseInt(id!));
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error approving salary' });
    }
  };

  const handleMarkPaid = async (sheetId: number) => {
    const mode = prompt('Payment mode (Cash/Bank Transfer/Cheque):');
    if (!mode) return;

    const validModes = ['Cash', 'Cheque', 'Bank Transfer'] as const;
    const typedMode = validModes.includes(mode as any) ? (mode as typeof validModes[number]) : 'Bank Transfer';

    try {
      await salaryService.markSalaryAsPaid(sheetId, typedMode);
      setMessage({ type: 'success', text: 'Salary marked as paid' });
      await loadSalaryData(parseInt(id!));
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error marking as paid' });
    }
  };

    const handleDownloadSalary = (sheet: SalarySheet) => {
      if (!employee) return;

      // Create CSV content
      const csvContent = [
        ['Salary Slip'],
        [''],
        ['Company', 'Shine Electrical'],
        ['Employee Name', employee.name],
        ['Employee ID', employee.employeeId],
        ['Month/Year', `${new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`],
        [''],
        ['Attendance Details'],
        ['Present Days', sheet.presentDays],
        ['Paid Leave Days', sheet.paidLeaveDays],
        ['Unpaid Leave Days', sheet.unpaidLeaveDays],
        [''],
        ['Salary Details'],
        ['Total Earnings', `₹ ${sheet.totalEarnings.toLocaleString('en-IN')}`],
        ['Deductions', `₹ ${(sheet.totalEarnings - sheet.netSalary).toLocaleString('en-IN')}`],
        ['Net Salary', `₹ ${sheet.netSalary.toLocaleString('en-IN')}`],
        ['Status', sheet.status],
        ...(sheet.paidOn ? [['Paid On', new Date(sheet.paidOn).toLocaleDateString('en-IN')]] : []),
        ...(sheet.paymentMode ? [['Payment Mode', sheet.paymentMode]] : []),
      ]
        .map(row => row.join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${employee.employeeId}_${sheet.month}_${sheet.year}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!employee || !salarySetup) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-800 font-semibold">Salary setup not configured</p>
        <p className="text-sm text-gray-500 mt-1">Please configure salary for this employee first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/employees/${id}/details`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              {employee.name} • {employee.employeeId}
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateSalary}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate This Month'}
        </button>
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

      {/* Salary Setup Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Salary Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-purple-700">Salary Type</p>
            <p className="font-bold text-purple-900 text-lg mt-1">{salarySetup.salaryType}</p>
          </div>
          <div>
            <p className="text-sm text-purple-700">Structure</p>
            <p className="font-bold text-purple-900 text-lg mt-1">{salarySetup.salaryStructure}</p>
          </div>
          <div>
            <p className="text-sm text-purple-700">
              {salarySetup.salaryType === 'Monthly' ? 'Base Salary' : 'Daily Rate'}
            </p>
            <p className="font-bold text-purple-900 text-lg mt-1">
              ₹{' '}
              {salarySetup.salaryType === 'Monthly'
                ? salarySetup.baseSalary?.toLocaleString('en-IN')
                : salarySetup.dailyRate}
            </p>
          </div>
          <div>
            <p className="text-sm text-purple-700">Effective From</p>
            <p className="font-bold text-purple-900 text-lg mt-1">
              {new Date(salarySetup.effectiveDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {salarySetup.salaryType === 'Monthly' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-purple-200">
            {salarySetup.da && (
              <div>
                <p className="text-xs text-purple-700">DA</p>
                <p className="font-semibold text-purple-900">₹ {salarySetup.da}</p>
              </div>
            )}
            {salarySetup.hra && (
              <div>
                <p className="text-xs text-purple-700">HRA</p>
                <p className="font-semibold text-purple-900">₹ {salarySetup.hra}</p>
              </div>
            )}
            {salarySetup.conveyance && (
              <div>
                <p className="text-xs text-purple-700">Conveyance</p>
                <p className="font-semibold text-purple-900">₹ {salarySetup.conveyance}</p>
              </div>
            )}
            {salarySetup.otherAllowance && (
              <div>
                <p className="text-xs text-purple-700">Other Allowance</p>
                <p className="font-semibold text-purple-900">₹ {salarySetup.otherAllowance}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Salary History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Salary History
          </h2>
        </div>

        {salarySheets.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-800 font-semibold">No salary records</p>
            <p className="text-sm text-gray-500 mt-1">Generate salary sheet for current month to start</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {salarySheets.map(sheet => (
              <div key={sheet.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sheet.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : sheet.status === 'Approved'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {sheet.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Present Days</p>
                        <p className="font-semibold text-gray-900">{sheet.presentDays}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Paid Leaves</p>
                        <p className="font-semibold text-gray-900">{sheet.paidLeaveDays}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unpaid Leaves</p>
                        <p className="font-semibold text-red-600">{sheet.unpaidLeaveDays}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Earnings</p>
                        <p className="font-semibold text-emerald-600">
                          ₹ {sheet.totalEarnings.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Net Salary</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹ {sheet.netSalary.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {sheet.status === 'Calculated' && (
                          <button
                            onClick={() => handleApprove(sheet.id!)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        {sheet.status === 'Approved' && (
                          <button
                            onClick={() => handleMarkPaid(sheet.id!)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold"
                          >
                            Mark as Paid
                          </button>
                        )}
                        {sheet.status === 'Paid' && sheet.paidOn && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Paid on</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(sheet.paidOn).toLocaleDateString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-600">{sheet.paymentMode}</p>
                          </div>
                        )}
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                          <button
                            onClick={() => handleDownloadSalary(sheet)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download as CSV"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
