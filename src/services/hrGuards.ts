import type { Attendance, Leave, PayrollRun, SalarySheet } from '@/types';

export class HRInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HRInvariantError';
  }
}

export const hrGuards = {
  assertSalarySheetMutable(sheet: SalarySheet, action: string) {
    if (sheet.status === 'Approved' || sheet.status === 'Paid') {
      throw new HRInvariantError(`Cannot ${action}: salary sheet is ${sheet.status}`);
    }
  },

  assertSalarySheetPayable(sheet: SalarySheet) {
    if (sheet.status !== 'Approved') {
      throw new HRInvariantError('Salary sheet must be Approved before marking as Paid');
    }
  },

  assertPayrollRunMutable(run: PayrollRun, action: string) {
    if (run.status === 'Locked' || run.status === 'Paid' || run.status === 'Archived') {
      throw new HRInvariantError(`Cannot ${action}: payroll run is ${run.status}`);
    }
  },

  assertPayrollRunLockable(run: PayrollRun) {
    if (run.status === 'Paid' || run.status === 'Archived') {
      throw new HRInvariantError(`Cannot lock payroll run in status ${run.status}`);
    }
  },

  assertAttendanceMutable(record: Attendance, action: string) {
    if (record.approvedAt || record.approvedBy) {
      throw new HRInvariantError(`Cannot ${action}: attendance is approved/locked`);
    }
  },

  assertLeaveStatusChangeAllowed(leave: Leave, nextStatus: Leave['status']) {
    // Controlled flow: Applied -> Approved/Rejected/Cancelled, Approved/Rejected are terminal.
    if (leave.status === 'Approved' || leave.status === 'Rejected') {
      throw new HRInvariantError(`Cannot change leave status from ${leave.status} to ${nextStatus}`);
    }
    if (leave.status === 'Cancelled') {
      throw new HRInvariantError('Cannot change a Cancelled leave');
    }
  },
};
