import { Routes, Route, Navigate } from 'react-router-dom';
import { EmployeesList } from './EmployeesList';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDetails } from './EmployeeDetails';
import { EmployeeSalary } from './EmployeeSalary';
import { EmployeeAttendance } from './EmployeeAttendance';
import { EmployeeLeaves } from './EmployeeLeaves';
import { AttendanceCheckin } from './AttendanceCheckin';
import { LeaveManagement } from './LeaveManagement';

function EmployeesModule() {
  return (
    <Routes>
      <Route path="/" element={<EmployeesList />} />
      <Route path="/new" element={<EmployeeForm />} />
      <Route path="/attendance/checkin" element={<AttendanceCheckin />} />
      <Route path="/leaves" element={<LeaveManagement />} />
      <Route path="/:id/details" element={<EmployeeDetails />} />
      <Route path="/:id/salary" element={<EmployeeSalary />} />
      <Route path="/:id/attendance" element={<EmployeeAttendance />} />
      <Route path="/:id/leaves" element={<EmployeeLeaves />} />
      <Route path="/:id" element={<EmployeeForm />} />
      <Route path="*" element={<Navigate to="/employees" replace />} />
    </Routes>
  );
}

export default EmployeesModule;
