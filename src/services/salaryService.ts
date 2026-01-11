/**
 * Salary Service
 * Calculate and manage employee salaries
 */

import { db } from './database';
import type { SalarySetup, SalarySheet } from '@/types';
import { attendanceService } from './attendanceService';

export const salaryService = {
  async setupSalary(data: Omit<SalarySetup, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const setup: Omit<SalarySetup, 'id'> = {
      ...data,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return (await db.salarySetups.add(setup)) as number;
  },

  async getSalarySetup(employeeId: number): Promise<SalarySetup | undefined> {
    const setups = await db.salarySetups.where('employeeId').equals(employeeId).toArray();
    // Return the latest active setup
    return setups.filter(s => s.status === 'active').sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    )[0];
  },

  async calculateMonthlySalary(employeeId: number, month: number, year: number): Promise<SalarySheet> {
    const employee = await db.employees.get(employeeId);
    if (!employee) throw new Error('Employee not found');
    
    const setup = await this.getSalarySetup(employeeId);
    if (!setup) throw new Error('Salary setup not configured for this employee');
    
    // Get attendance summary
    const attendance = await attendanceService.getAttendanceSummary(employeeId, month, year);
    
    // Get approved leaves
    const leaves = await db.leaves
      .where('employeeId')
      .equals(employeeId)
      .filter(l => {
        const fromDate = new Date(l.fromDate);
        return (
          l.status === 'Approved' &&
          fromDate.getMonth() === month - 1 &&
          fromDate.getFullYear() === year
        );
      })
      .toArray();
    
    const paidLeaveDays = leaves.filter(l => l.entitlement === 'Paid').reduce((sum, l) => sum + l.numberOfDays, 0);
    const unpaidLeaveDays = leaves.filter(l => l.entitlement === 'Unpaid').reduce((sum, l) => sum + l.numberOfDays, 0);
    
    // Get advances and deductions
    const deductions = await db.advanceDeductions
      .where('employeeId')
      .equals(employeeId)
      .filter(d => {
        const dDate = new Date(d.date);
        return d.status === 'Approved' && dDate.getMonth() === month - 1 && dDate.getFullYear() === year;
      })
      .toArray();
    
    // Calculate earnings based on salary type
    let totalEarnings = 0;
    let baseSalary = 0;
    
    if (setup.salaryType === 'Monthly' && setup.baseSalary) {
      baseSalary = setup.baseSalary;
      totalEarnings = baseSalary;
      
      // Deduct unpaid leave days
      if (unpaidLeaveDays > 0) {
        const dailyRate = baseSalary / attendance.totalWorkingDays;
        totalEarnings -= unpaidLeaveDays * dailyRate;
      }
    } else if (setup.salaryType === 'Daily' && setup.dailyRate) {
      const workingDaysInMonth = attendance.presentDays + paidLeaveDays;
      baseSalary = workingDaysInMonth * setup.dailyRate;
      totalEarnings = baseSalary;
    }
    
    // Add allowances
    const allowances = (setup.da || 0) + (setup.hra || 0) + (setup.conveyance || 0) + (setup.otherAllowance || 0);
    totalEarnings += allowances;
    
    // Calculate deductions
    let totalDeductions = 0;
    let advance = 0;
    let loan = 0;
    let fine = 0;
    let otherDeduction = 0;
    
    deductions.forEach(d => {
      if (d.type === 'Advance') advance += d.amount;
      else if (d.type === 'Loan') loan += d.amount;
      else if (d.type === 'Fine') fine += d.amount;
      else otherDeduction += d.amount;
    });
    
    totalDeductions = advance + loan + fine + otherDeduction;
    
    const netSalary = totalEarnings - totalDeductions;
    
    const sheet: Omit<SalarySheet, 'id'> = {
      employeeId,
      month,
      year,
      totalWorkingDays: attendance.totalWorkingDays,
      presentDays: attendance.presentDays,
      absentDays: attendance.absentDays,
      halfDayCount: attendance.halfDayCount,
      paidLeaveDays,
      unpaidLeaveDays,
      baseSalary,
      da: setup.da,
      hra: setup.hra,
      conveyance: setup.conveyance,
      otherAllowance: setup.otherAllowance,
      totalEarnings,
      advance,
      loan,
      fine,
      otherDeduction,
      totalDeductions,
      netSalary: Math.round(netSalary * 100) / 100,
      status: 'Calculated',
      remarks: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return sheet;
  },

  async generateMonthlySalarySheet(employeeId: number, month: number, year: number): Promise<number> {
    const sheet = await this.calculateMonthlySalary(employeeId, month, year);
    return (await db.salarySheets.add(sheet)) as number;
  },

  async getSalarySheet(employeeId: number, month: number, year: number): Promise<SalarySheet | undefined> {
    const sheets = await db.salarySheets
      .where('employeeId')
      .equals(employeeId)
      .filter(s => s.month === month && s.year === year)
      .toArray();
    
    return sheets[0];
  },

  async approveSalarySheet(
    salarySheetId: number,
    approvedBy: number
  ): Promise<void> {
    await db.salarySheets.update(salarySheetId, {
      status: 'Approved',
      approvedBy,
      approvedOn: new Date(),
      updatedAt: new Date(),
    });
  },

  async markSalaryAsPaid(
    salarySheetId: number,
    paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque'
  ): Promise<void> {
    await db.salarySheets.update(salarySheetId, {
      status: 'Paid',
      paymentMode,
      paidOn: new Date(),
      updatedAt: new Date(),
    });
  },

  async getPendingApprovals(): Promise<SalarySheet[]> {
    const sheets = await db.salarySheets.where('status').equals('Calculated').toArray();
    return sheets.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getMonthlySalarySheets(month: number, year: number): Promise<SalarySheet[]> {
    const sheets = await db.salarySheets.toArray();
    return sheets.filter(s => s.month === month && s.year === year);
  },

  async getTotalMonthlyPayroll(month: number, year: number): Promise<number> {
    const sheets = await this.getMonthlySalarySheets(month, year);
    return sheets.reduce((sum, s) => sum + s.netSalary, 0);
  },
};
