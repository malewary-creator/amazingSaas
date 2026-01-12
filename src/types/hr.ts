/**
 * HR Module Type Definitions
 * Employee Management, Attendance, Leave, Salary, Expenses
 */

import type { BaseEntity, Status, Address } from './index';

// ==================== EMPLOYEE ====================

export type EmployeeCategory = 'Computer Operator' | 'Welder' | 'Labour' | 'Temporary Hiring' | 'Supervisor';

export interface Employee extends BaseEntity {
  employeeId: string; // Auto: EMP-2025-001
  name: string;
  category: EmployeeCategory;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: Address;
  
  // ID Proof
  idProofType?: 'Aadhaar' | 'PAN' | 'Driving License' | 'Passport' | 'Voter ID';
  idProofNumber?: string;
  
  // Employment
  joiningDate: Date;
  status: Status;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  
  // Current Site Assignment
  assignedProject?: number; // Project ID
  assignedSite?: string; // Site name/location
  
  // Contact for Emergencies
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  remarks?: string;
  branchId?: number;
}

// ==================== SALARY ====================

export type SalaryType = 'Monthly' | 'Daily';
export type SalaryStructure = 'Fixed' | 'Variable';

export interface SalarySetup extends BaseEntity {
  employeeId: number;
  salaryType: SalaryType; // Monthly or Daily
  salaryStructure: SalaryStructure; // Fixed or Variable
  
  baseSalary?: number; // Monthly salary (for Fixed-Monthly)
  dailyRate?: number; // Daily wage (for Daily)
  
  // Components (if needed)
  da?: number; // Dearness Allowance
  hra?: number; // House Rent Allowance
  conveyance?: number;
  otherAllowance?: number;
  
  effectiveDate: Date;
  status: Status;
}

// ==================== ATTENDANCE ====================

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave';
export type CheckInOutType = 'In' | 'Out';

export interface Attendance extends BaseEntity {
  employeeId: number;
  date: Date;
  status: AttendanceStatus;
  
  checkInTime?: Date;
  checkOutTime?: Date;
  workingHours?: number; // Calculated (checkOut - checkIn)
  
  siteId?: string; // Site/Project where worked
  remarks?: string;
  approvedBy?: number; // User ID (Supervisor)
  approvedAt?: Date;
  
  branchId?: number;
}

export interface AttendanceSummary {
  employeeId: number;
  month: number; // 1-12
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDayCount: number;
  totalLeaves: number;
  workingHours: number;
}

// ==================== LEAVE ====================

export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Loss of Pay';
export type LeaveStatus = 'Applied' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveEntitlement = 'Paid' | 'Unpaid';

export interface LeaveBalance {
  employeeId: number;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
}

export interface Leave extends BaseEntity {
  employeeId: number;
  leaveType: LeaveType;
  fromDate: Date;
  toDate: Date;
  numberOfDays: number;
  entitlement: LeaveEntitlement; // Paid or Unpaid
  
  reason?: string;
  status: LeaveStatus;
  
  appliedOn: Date;
  appliedBy?: number; // Employee ID (self-applied)
  
  approvedBy?: number; // Supervisor/Manager ID
  approvedOn?: Date;
  approvalRemarks?: string;
  
  rejectionReason?: string;
  
  branchId?: number;
}

// ==================== ADVANCE & DEDUCTIONS ====================

export type AdvanceDeductionType = 'Advance' | 'Loan' | 'Fine' | 'Damage' | 'Other';

export interface AdvanceDeduction extends BaseEntity {
  employeeId: number;
  type: AdvanceDeductionType;
  amount: number;
  
  description?: string;
  date: Date;
  
  approvedBy?: number;
  approvalRemarks?: string;
  
  // For installment repayment
  installments?: number; // How many months to repay
  installmentAmount?: number;
  repaidAmount?: number;
  outstandingAmount?: number;
  
  status: 'Pending' | 'Approved' | 'Rejected' | 'Closed';
  remarks?: string;
  
  branchId?: number;
}

// ==================== MONTHLY SALARY SHEET ====================

export interface SalarySheet extends BaseEntity {
  payrollRunId?: number; // Links this sheet to a PayrollRun (v4+)
  employeeId: number;
  month: number; // 1-12
  year: number;
  
  // Attendance-based calculation
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDayCount: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  
  // Earnings
  baseSalary: number;
  da?: number;
  hra?: number;
  conveyance?: number;
  otherAllowance?: number;

  // Extended earnings components (enterprise)
  overtimeAmount?: number;
  incentiveAmount?: number;
  bonusAmount?: number;
  arrearsAmount?: number;

  // Component breakdown (tamper-detected, policy-driven)
  earningsComponents?: Record<string, number>; // e.g. { baseSalary: 30000, hra: 5000, overtime: 1200 }
  deductionComponents?: Record<string, number>; // e.g. { advance: 1000, pf: 1800 }
  totalEarnings: number;
  
  // Deductions
  advance?: number;
  loan?: number;
  fine?: number;
  otherDeduction?: number;
  totalDeductions: number;
  
  // Net Salary
  netSalary: number; // totalEarnings - totalDeductions
  
  status: 'Draft' | 'Calculated' | 'Approved' | 'Paid';
  approvedBy?: number;
  approvedOn?: Date;
  paidOn?: Date;
  paymentMode?: 'Cash' | 'Bank Transfer' | 'Cheque';
  paymentRef?: string; // external reference/UTR/cheque no (optional)

  // Tamper detection
  hashAlgorithm?: 'SHA-256' | 'FNV-1A-32';
  integrityHash?: string; // hash over canonical payload
  
  remarks?: string;
  branchId?: number;
}

// ==================== PAYROLL RUN (ENTERPRISE) ====================

export type PayrollRunStatus = 'Draft' | 'Reviewed' | 'Locked' | 'Paid' | 'Archived';

export interface PayrollRun extends BaseEntity {
  branchId?: number;
  siteId?: string;

  month: number; // 1-12
  year: number;

  status: PayrollRunStatus;

  generatedBy?: number;
  generatedAt?: Date;
  reviewedBy?: number;
  reviewedAt?: Date;
  lockedBy?: number;
  lockedAt?: Date;
  paidBy?: number;
  paidAt?: Date;
  archivedAt?: Date;

  // Optional summary fields
  employeeCount?: number;
  totalNetPay?: number;

  remarks?: string;
}

// ==================== POLICY TABLES (EFFECTIVE-DATED) ====================

export interface WorkCalendar extends BaseEntity {
  branchId?: number;
  siteId?: string;
  name: string;
  effectiveFrom: Date;
  effectiveTo?: Date;

  // 0=Sun ... 6=Sat
  weekendDays: number[];
  timezone?: string; // e.g. 'Asia/Kolkata'
  status: Status;
}

export interface WorkCalendarHoliday extends BaseEntity {
  calendarId: number;
  date: Date; // date-only semantics
  name?: string;
  isWorkingDayOverride?: boolean; // true => treat as working day even if weekend
}

export interface ShiftTemplate extends BaseEntity {
  branchId?: number;
  siteId?: string;
  name: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  startTime: string; // '09:00'
  endTime: string; // '18:00'
  breakMinutes?: number;
  graceMinutes?: number;
  status: Status;
}

export interface LeavePolicy extends BaseEntity {
  branchId?: number;
  name: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: Status;

  // Rules
  approvalRequired: boolean;
  allowHalfDay: boolean;
  allowCarryForward: boolean;
  carryForwardCapDays?: number;
}

export interface LeavePolicyEntitlement extends BaseEntity {
  policyId: number;
  branchId?: number;
  employeeCategory?: EmployeeCategory;
  leaveType: LeaveType;

  year: number;
  totalDays: number;
  accrual?: 'Annual' | 'Monthly';
  status: Status;
}

// ==================== DAILY OPERATIONAL EXPENSES ====================

export type ExpenseCategory = 
  | 'Tea / Coffee'
  | 'Naasta / Food'
  | 'Water Can'
  | 'Travel / Fuel'
  | 'Misc Site Expenses'
  | 'Other';

export interface DailyExpense extends BaseEntity {
  expenseId: string; // Auto: EXP-2025-001
  
  date: Date;
  category: ExpenseCategory;
  amount: number;
  
  description?: string;
  site?: string; // Site/Project name
  projectId?: number; // Project ID
  
  approvedBy?: number; // User ID
  approvalRemarks?: string;
  
  status: 'Pending' | 'Approved' | 'Rejected';
  attachmentPath?: string; // Receipt image path
  
  branchId?: number;
}

export interface ExpenseSummary {
  date?: Date;
  period?: 'Daily' | 'Weekly' | 'Monthly';
  totalExpenses: number;
  byCategory: Record<ExpenseCategory, number>;
  count: number;
}

// ==================== WORK ASSIGNMENT ====================

export interface WorkAssignment extends BaseEntity {
  employeeId: number;
  projectId: number;
  
  assignedDate: Date;
  completionDate?: Date;
  
  role?: string; // Job role (Welder, Installer, etc.)
  status: 'Active' | 'Completed' | 'Cancelled';
  
  remarks?: string;
}

// ==================== EMPLOYEE NOTES ====================

export interface EmployeeNote extends BaseEntity {
  employeeId: number;
  
  title: string;
  content: string;
  noteType?: 'Performance' | 'Behavior' | 'Attendance' | 'General';
  
  createdBy: number; // User ID
  
  priority?: 'Low' | 'Medium' | 'High';
  branchId?: number;
}
