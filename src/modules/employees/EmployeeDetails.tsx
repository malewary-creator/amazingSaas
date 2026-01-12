import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '@/services/employeeService';
import { salaryService } from '@/services/salaryService';
import { attendanceService } from '@/services/attendanceService';
import { leaveService } from '@/services/leaveService';
import type { Employee, SalarySetup, AttendanceSummary, LeaveBalance } from '@/types';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
  FileText,
  Edit,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salarySetup, setSalarySetup] = useState<SalarySetup | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEmployeeDetails(parseInt(id));
    }
  }, [id]);

  const loadEmployeeDetails = async (empId: number) => {
    try {
      setLoading(true);
      const emp = await employeeService.getEmployeeById(empId);
      setEmployee(emp || null);

      if (emp) {
        // Load salary setup
        const salary = await salaryService.getSalarySetup(empId);
        setSalarySetup(salary || null);

        // Load current month attendance
        const now = new Date();
        const summary = await attendanceService.getAttendanceSummary(
          empId,
          now.getMonth() + 1,
          now.getFullYear()
        );
        setAttendanceSummary(summary);

        // Load leave balances
        const casualBalance = await leaveService.getLeaveBalance(empId, 'Casual', now.getFullYear());
        const sickBalance = await leaveService.getLeaveBalance(empId, 'Sick', now.getFullYear());
        const earnedBalance = await leaveService.getLeaveBalance(empId, 'Earned', now.getFullYear());
        setLeaveBalances([casualBalance, sickBalance, earnedBalance]);
      }
    } catch (error) {
      console.error('Error loading employee details:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {employee.employeeId} • {employee.category}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/employees/${id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {employee.phone}
                </p>
              </div>
              {employee.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {employee.email}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-semibold text-gray-900 flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <span>
                    {employee.address.city}, {employee.address.state} - {employee.address.pincode}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Proof</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {employee.idProofType} - {employee.idProofNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(employee.joiningDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mt-1">
                  {employee.category}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                    employee.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {employee.status === 'active' ? '✓ Active' : 'Inactive'}
                </span>
              </div>
              {employee.assignedSite && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Current Site</p>
                  <p className="font-semibold text-gray-900 mt-1">{employee.assignedSite}</p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Contact Name</p>
                <p className="font-semibold text-gray-900 mt-1">{employee.emergencyContactName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Phone</p>
                <p className="font-semibold text-gray-900 mt-1">{employee.emergencyContactPhone}</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {employee.bankAccountNumber && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Bank Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-semibold text-gray-900 mt-1">{employee.bankAccountNumber}</p>
                </div>
                {employee.ifscCode && (
                  <div>
                    <p className="text-sm text-gray-500">IFSC Code</p>
                    <p className="font-semibold text-gray-900 mt-1">{employee.ifscCode}</p>
                  </div>
                )}
                {employee.bankName && (
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-semibold text-gray-900 mt-1">{employee.bankName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary Cards */}
        <div className="space-y-6">
          {/* Salary Info */}
          {salarySetup && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700">Monthly Salary</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{' '}
                    {salarySetup.salaryType === 'Monthly'
                      ? salarySetup.baseSalary?.toLocaleString('en-IN')
                      : `${salarySetup.dailyRate}/day`}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Type:</span>
                  <span className="font-semibold text-purple-900">{salarySetup.salaryType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Structure:</span>
                  <span className="font-semibold text-purple-900">{salarySetup.salaryStructure}</span>
                </div>
                <button
                  onClick={() => navigate(`/employees/${id}/salary`)}
                  className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
                >
                  View Salary Details
                </button>
              </div>
            </div>
          )}

          {/* Attendance This Month */}
          {attendanceSummary && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                This Month Attendance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Present Days</span>
                  <span className="font-bold text-emerald-600">{attendanceSummary.presentDays}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Absent Days</span>
                  <span className="font-bold text-red-600">{attendanceSummary.absentDays}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Half Days</span>
                  <span className="font-bold text-amber-600">{attendanceSummary.halfDayCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Leaves Taken</span>
                  <span className="font-bold text-blue-600">{attendanceSummary.totalLeaves}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm text-gray-600">Working Hours</span>
                  <span className="font-bold text-gray-900">
                    {(attendanceSummary.workingHours / 3600).toFixed(1)} hrs
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/employees/${id}/attendance`)}
                  className="w-full mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-semibold"
                >
                  View Full Attendance
                </button>
              </div>
            </div>
          )}

          {/* Leave Balances */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Leave Balance
            </h3>
            <div className="space-y-3">
              {leaveBalances.map(balance => (
                <div key={balance.leaveType} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{balance.leaveType}</span>
                  <span className="font-semibold text-gray-900">
                    {balance.availableDays} / {balance.totalDays}
                  </span>
                </div>
              ))}
              <button
                onClick={() => navigate(`/employees/${id}/leaves`)}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
              >
                View Leave History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
