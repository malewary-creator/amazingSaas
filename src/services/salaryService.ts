/**
 * Salary Service
 * Calculate and manage employee salaries
 */

import { db } from './database';
import type { PayrollRun, SalarySetup, SalarySheet } from '@/types';
import { attendanceService } from './attendanceService';
import { auditService } from './auditService';
import { hrGuards } from './hrGuards';
import { migrateLegacySalarySheetsToRuns } from './payrollMigration';

const startOfMonth = (month: number, year: number) => new Date(year, month - 1, 1, 0, 0, 0, 0);
const endOfMonth = (month: number, year: number) => new Date(year, month, 0, 23, 59, 59, 999);

const sha256Hex = async (input: string): Promise<{ alg: 'SHA-256' | 'FNV-1A-32'; hash: string }> => {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const bytes = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hex = Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return { alg: 'SHA-256', hash: hex };
    }
  } catch {
    // fall through
  }

  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return { alg: 'FNV-1A-32', hash: hash.toString(16).padStart(8, '0') };
};

const canonicalSheetPayload = (sheet: SalarySheet) => ({
  payrollRunId: sheet.payrollRunId,
  employeeId: sheet.employeeId,
  month: sheet.month,
  year: sheet.year,
  totalWorkingDays: sheet.totalWorkingDays,
  presentDays: sheet.presentDays,
  absentDays: sheet.absentDays,
  halfDayCount: sheet.halfDayCount,
  paidLeaveDays: sheet.paidLeaveDays,
  unpaidLeaveDays: sheet.unpaidLeaveDays,
  baseSalary: sheet.baseSalary,
  da: sheet.da,
  hra: sheet.hra,
  conveyance: sheet.conveyance,
  otherAllowance: sheet.otherAllowance,
  overtimeAmount: sheet.overtimeAmount,
  incentiveAmount: sheet.incentiveAmount,
  bonusAmount: sheet.bonusAmount,
  arrearsAmount: sheet.arrearsAmount,
  earningsComponents: sheet.earningsComponents,
  deductionComponents: sheet.deductionComponents,
  totalEarnings: sheet.totalEarnings,
  advance: sheet.advance,
  loan: sheet.loan,
  fine: sheet.fine,
  otherDeduction: sheet.otherDeduction,
  totalDeductions: sheet.totalDeductions,
  netSalary: sheet.netSalary,
  status: sheet.status,
  branchId: sheet.branchId,
});

const overlapDaysInMonth = (from: Date, to: Date, month: number, year: number) => {
  const start = startOfMonth(month, year).getTime();
  const end = endOfMonth(month, year).getTime();
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const s = Math.max(a.getTime(), start);
  const e = Math.min(b.getTime(), end);
  if (e < s) return 0;
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
};

const normalizeBranchIdKey = (branchId?: number) => branchId ?? 0;

const isRunFinal = (status: PayrollRun['status']) =>
  status === 'Locked' || status === 'Paid' || status === 'Archived';

const assertNonEmptyReason = (reason: string | undefined, action: string) => {
  if (!reason || !reason.trim()) {
    throw new Error(`Reason is required to ${action} (financial override)`);
  }
};

/**
 * Invariant helpers (financial safety):
 * - Runs are unique by (branchId, year, month) at the service layer.
 * - Locked/Paid runs block recalculation and all amount-changing edits.
 * - SalarySheet lifecycle is strictly: Calculated -> Approved -> Paid.
 */
async function getUniqueRunByKey(month: number, year: number, branchId?: number): Promise<PayrollRun | undefined> {
  const branchIdKey = normalizeBranchIdKey(branchId);
  const runs = await db.payrollRuns
    .where('[branchId+year+month]')
    .equals([branchIdKey, year, month])
    .toArray();

  if (runs.length > 1) {
    // Safety-first: duplicates are a data integrity issue.
    throw new Error('PayrollRun uniqueness violated for this month/branch; contact admin');
  }
  return runs[0];
}

export async function assertCanGenerateRun(month: number, year: number, branchId?: number): Promise<PayrollRun | undefined> {
  const run = await getUniqueRunByKey(month, year, branchId);
  if (run && isRunFinal(run.status)) {
    throw new Error('Payroll run is locked/paid; salary sheets cannot be regenerated');
  }
  return run;
}

export async function assertCanModifyRun(runId: number): Promise<PayrollRun> {
  const run = await db.payrollRuns.get(runId);
  if (!run) throw new Error('Payroll run not found');
  if (isRunFinal(run.status)) throw new Error('Payroll run is locked/paid; modifications are not allowed');
  return run;
}

export async function assertRunUnlocked(runId: number): Promise<PayrollRun> {
  // Alias for clarity at call sites.
  return assertCanModifyRun(runId);
}

export async function assertCanApproveSheet(sheetId: number): Promise<{ sheet: SalarySheet; run?: PayrollRun }> {
  const sheet = await db.salarySheets.get(sheetId);
  if (!sheet) throw new Error('Salary sheet not found');
  if (sheet.status !== 'Calculated') {
    throw new Error('Only Calculated salary sheets can be approved');
  }

  const run = sheet.payrollRunId ? await db.payrollRuns.get(sheet.payrollRunId) : undefined;
  if (run && isRunFinal(run.status)) {
    throw new Error('Payroll run is locked/paid; approvals are not allowed');
  }

  return { sheet, run };
}

export async function assertCanPaySheet(sheetId: number): Promise<{ sheet: SalarySheet; run?: PayrollRun }> {
  const sheet = await db.salarySheets.get(sheetId);
  if (!sheet) throw new Error('Salary sheet not found');
  if (sheet.status !== 'Approved') {
    throw new Error('Only Approved salary sheets can be marked as paid');
  }
  const run = sheet.payrollRunId ? await db.payrollRuns.get(sheet.payrollRunId) : undefined;
  if (run && (run.status === 'Paid' || run.status === 'Archived')) {
    throw new Error('Payroll run is already paid/archived; payments are not allowed');
  }
  return { sheet, run };
}

export const salaryService = {
  /**
   * One-time safety net (bootstrap): migrate legacy salarySheets into payrollRuns.
   * This should normally run during the Dexie v4 upgrade, but is exposed so that
   * an app bootstrap can ensure linkage if upgrade was skipped/interrupted.
   */
  async migrateLegacySalarySheetsToRuns(): Promise<{ migratedRunCount: number; attachedSheetCount: number }> {
    return db.transaction('rw', db.salarySheets, db.payrollRuns, db.auditLogs, async () => {
      return migrateLegacySalarySheetsToRuns({
        salarySheetsTable: db.salarySheets,
        payrollRunsTable: db.payrollRuns,
        auditLogsTable: db.auditLogs,
        sha256Hex,
      });
    });
  },

  async getPayrollRun(month: number, year: number, branchId?: number): Promise<PayrollRun | undefined> {
    return getUniqueRunByKey(month, year, branchId);
  },

  async getRunSheets(runId: number): Promise<SalarySheet[]> {
    return db.salarySheets.where('payrollRunId').equals(runId).toArray();
  },

  async getRunStatus(runId: number): Promise<PayrollRun['status']> {
    const run = await db.payrollRuns.get(runId);
    if (!run) throw new Error('Payroll run not found');
    return run.status;
  },

  async getOrCreatePayrollRun(params: {
    month: number;
    year: number;
    branchId?: number;
    siteId?: string;
    userId?: number;
  }): Promise<PayrollRun> {
    const branchIdKey = normalizeBranchIdKey(params.branchId);

    const existing = await getUniqueRunByKey(params.month, params.year, branchIdKey);
    if (existing) return existing;

    const run: Omit<PayrollRun, 'id'> = {
      branchId: branchIdKey || undefined,
      siteId: params.siteId,
      month: params.month,
      year: params.year,
      status: 'Draft',
      generatedBy: params.userId,
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = (await db.payrollRuns.add(run as any)) as number;
    const created = await db.payrollRuns.get(id);
    if (!created) throw new Error('Failed to create payroll run');

    await auditService.logEvent('hr.payroll', 'Create', {
      entity: 'PayrollRun',
      entityId: id,
      recordId: id,
      newValue: created,
      userId: params.userId,
      branchId: created.branchId,
      reason: 'Create payroll run',
    });

    return created;
  },

  /**
   * Explicit transition: create a new PayrollRun.
   * Invariant: must not already exist for (branchId, year, month).
   */
  async createPayrollRun(params: {
    month: number;
    year: number;
    branchId?: number;
    siteId?: string;
    userId?: number;
    reason?: string;
  }): Promise<PayrollRun> {
    const existing = await getUniqueRunByKey(params.month, params.year, params.branchId);
    if (existing) throw new Error('Payroll run already exists for this month and branch');

    // getOrCreatePayrollRun already emits the Create audit event.
    return this.getOrCreatePayrollRun(params);
  },

  async setupSalary(data: Omit<SalarySetup, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const setup: Omit<SalarySetup, 'id'> = {
      ...data,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = (await db.salarySetups.add(setup)) as number;
    await auditService.logEvent('hr.salarySetup', 'Create', {
      entity: 'SalarySetup',
      entityId: id,
      recordId: id,
      newValue: setup,
      branchId: (setup as any).branchId,
    });
    return id;
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
    
    // Get approved leaves overlapping the month (handles leaves spanning months)
    const leaves = await db.leaves
      .where('employeeId')
      .equals(employeeId)
      .filter(l => l.status === 'Approved')
      .toArray();

    const paidLeaveDays = leaves
      .filter(l => l.entitlement === 'Paid')
      .reduce((sum, l) => sum + overlapDaysInMonth(new Date(l.fromDate), new Date(l.toDate), month, year), 0);
    const unpaidLeaveDays = leaves
      .filter(l => l.entitlement === 'Unpaid')
      .reduce((sum, l) => sum + overlapDaysInMonth(new Date(l.fromDate), new Date(l.toDate), month, year), 0);
    
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
        const workingDays = attendance.totalWorkingDays > 0 ? attendance.totalWorkingDays : 30;
        const dailyRate = baseSalary / workingDays;
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
      payrollRunId: undefined,
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
      overtimeAmount: 0,
      incentiveAmount: 0,
      bonusAmount: 0,
      arrearsAmount: 0,
      earningsComponents: {
        baseSalary,
        da: setup.da || 0,
        hra: setup.hra || 0,
        conveyance: setup.conveyance || 0,
        otherAllowance: setup.otherAllowance || 0,
      },
      deductionComponents: {
        advance,
        loan,
        fine,
        otherDeduction,
      },
      totalEarnings,
      advance,
      loan,
      fine,
      otherDeduction,
      totalDeductions,
      netSalary: Math.round(Math.max(0, netSalary) * 100) / 100,
      status: 'Calculated',
      remarks: '',
      branchId: employee.branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return sheet;
  },

  async generateMonthlySalarySheet(employeeId: number, month: number, year: number): Promise<number> {
    const calculated = await this.calculateMonthlySalary(employeeId, month, year);
    const existing = await this.getSalarySheet(employeeId, month, year);

    const employee = await db.employees.get(employeeId);
    const branchIdKey = employee?.branchId ?? 0;
    const run = await this.getOrCreatePayrollRun({ month, year, branchId: branchIdKey, siteId: employee?.assignedSite });
    // Invariant: locked/paid runs block recalculation/regeneration.
    if (run.id && isRunFinal(run.status)) {
      throw new Error('Payroll run is locked/paid; salary sheet cannot be regenerated');
    }
    calculated.payrollRunId = run.id;

    // Compute integrity hash for calculated sheet
    const { alg, hash } = await sha256Hex(JSON.stringify(canonicalSheetPayload(calculated as any)));
    (calculated as any).hashAlgorithm = alg;
    (calculated as any).integrityHash = hash;

    if (existing?.id) {
      if (existing.status === 'Approved' || existing.status === 'Paid') {
        throw new Error('Salary sheet already approved/paid for this month');
      }

      // Ensure linkage to payroll run (idempotent upgrade)
      const targetRunId = run.id;
      if (typeof targetRunId === 'number') {
        const dup = await db.salarySheets
          .where('payrollRunId')
          .equals(targetRunId)
          .filter(s => s.employeeId === employeeId)
          .first();
        if (dup && dup.id !== existing.id) {
          throw new Error('Duplicate salary sheet exists for this payroll run and employee');
        }
      }

      await db.salarySheets.update(existing.id, {
        ...calculated,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        status: 'Calculated',
      });

      const updated = await db.salarySheets.get(existing.id);
      await auditService.logEvent('hr.salary', 'Update', {
        entity: 'SalarySheet',
        entityId: existing.id,
        recordId: existing.id,
        oldValue: existing,
        newValue: updated,
        branchId: branchIdKey || undefined,
      });
      return existing.id;
    }

    // Enforce uniqueness (payrollRunId + employeeId)
    if (run.id) {
      const dup = await db.salarySheets
        .where('payrollRunId')
        .equals(run.id)
        .filter(s => s.employeeId === employeeId)
        .first();
      if (dup?.id) throw new Error('Salary sheet already exists for this payroll run and employee');
    }

    const id = (await db.salarySheets.add(calculated)) as number;
    await auditService.logEvent('hr.salary', 'Create', {
      entity: 'SalarySheet',
      entityId: id,
      recordId: id,
      newValue: calculated,
      branchId: branchIdKey || undefined,
    });
    return id;
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
    await this.markSheetApproved(salarySheetId, approvedBy, 'Approve salary sheet');
  },

  async markSalaryAsPaid(
    salarySheetId: number,
    paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque'
  ): Promise<void> {
    // Backward-compatible wrapper.
    await this.markSheetPaid(salarySheetId, paymentMode, undefined, 'Mark sheet paid');
  },

  /**
   * Explicit transition: approve a salary sheet.
   * Invariant: Calculated -> Approved, and Approved sheets cannot be recalculated.
   */
  async markSheetApproved(sheetId: number, userId?: number, reason?: string): Promise<void> {
    const { sheet } = await assertCanApproveSheet(sheetId);
    hrGuards.assertSalarySheetMutable(sheet, 'approve salary sheet');

    // Ensure linkage exists (legacy sheets may not be attached).
    let payrollRunId = sheet.payrollRunId;
    if (!payrollRunId) {
      const run = await this.getOrCreatePayrollRun({
        month: sheet.month,
        year: sheet.year,
        branchId: normalizeBranchIdKey(sheet.branchId),
      });
      payrollRunId = run.id;
      if (payrollRunId) {
        await db.salarySheets.update(sheetId, { payrollRunId });
      }
    }

    const oldValue = await db.salarySheets.get(sheetId);
    await db.salarySheets.update(sheetId, {
      status: 'Approved',
      approvedBy: userId,
      approvedOn: new Date(),
      updatedAt: new Date(),
    });

    // Update integrity hash after approval (metadata-only, locks in the canonical payload).
    const updated = await db.salarySheets.get(sheetId);
    if (updated) {
      const { alg, hash } = await sha256Hex(JSON.stringify(canonicalSheetPayload(updated)));
      await db.salarySheets.update(sheetId, { hashAlgorithm: alg, integrityHash: hash });
    }

    const finalSheet = await db.salarySheets.get(sheetId);
    await auditService.logEvent('hr.salary', 'Approve', {
      entity: 'SalarySheet',
      entityId: sheetId,
      recordId: sheetId,
      oldValue,
      newValue: finalSheet,
      userId,
      branchId: sheet.branchId,
      reason: reason || 'Approve salary sheet',
    });

    // Optional run lifecycle: promote Draft -> Reviewed on first approval.
    if (payrollRunId) {
      const run = await db.payrollRuns.get(payrollRunId);
      if (run && run.status === 'Draft') {
        const oldRun = run;
        await db.payrollRuns.update(payrollRunId, { status: 'Reviewed', updatedAt: new Date() });
        const newRun = await db.payrollRuns.get(payrollRunId);
        await auditService.logEvent('hr.payroll', 'Update', {
          entity: 'PayrollRun',
          entityId: payrollRunId,
          recordId: payrollRunId,
          oldValue: oldRun,
          newValue: newRun,
          userId,
          branchId: oldRun.branchId,
          reason: 'Auto-review on sheet approval',
        });
      }
    }
  },

  /**
   * Explicit transition: mark a salary sheet as paid.
   * Invariant: Approved -> Paid; Paid sheets are fully immutable.
   */
  async markSheetPaid(sheetId: number, paymentRef: string, userId?: number, reason?: string): Promise<void> {
    const { sheet, run } = await assertCanPaySheet(sheetId);
    hrGuards.assertSalarySheetPayable(sheet);

    // Safety: once any payment happens, the run must be Locked to block recalculation.
    if (sheet.payrollRunId) {
      const currentRun = run || (await db.payrollRuns.get(sheet.payrollRunId));
      if (currentRun && currentRun.status !== 'Locked') {
        const oldRun = currentRun;
        await db.payrollRuns.update(currentRun.id!, {
          status: 'Locked',
          lockedBy: userId,
          lockedAt: new Date(),
          updatedAt: new Date(),
        });
        const newRun = await db.payrollRuns.get(currentRun.id!);
        await auditService.logEvent('hr.payroll', 'Update', {
          entity: 'PayrollRun',
          entityId: currentRun.id,
          recordId: currentRun.id,
          oldValue: oldRun,
          newValue: newRun,
          userId,
          branchId: oldRun.branchId,
          reason: 'Auto-lock on first payment',
        });
      }
    }

    const oldValue = await db.salarySheets.get(sheetId);

    const validModes = ['Cash', 'Cheque', 'Bank Transfer'] as const;
    const mode = validModes.includes(paymentRef as any) ? (paymentRef as typeof validModes[number]) : undefined;

    await db.salarySheets.update(sheetId, {
      status: 'Paid',
      paymentMode: mode,
      paymentRef,
      paidOn: new Date(),
      updatedAt: new Date(),
    });

    const updated = await db.salarySheets.get(sheetId);
    await auditService.logEvent('hr.salary', 'Update', {
      entity: 'SalarySheet',
      entityId: sheetId,
      recordId: sheetId,
      oldValue,
      newValue: updated,
      branchId: sheet.branchId,
      userId,
      reason: reason || 'Mark salary sheet paid',
    });

    // If all sheets in the run are paid, mark the run as Paid.
    if (sheet.payrollRunId) {
      const runId = sheet.payrollRunId;
      const runSheets = await db.salarySheets.where('payrollRunId').equals(runId).toArray();
      const allPaid = runSheets.length > 0 && runSheets.every(s => s.status === 'Paid');
      if (allPaid) {
        const oldRun = await db.payrollRuns.get(runId);
        if (oldRun && oldRun.status !== 'Paid') {
          await db.payrollRuns.update(runId, {
            status: 'Paid',
            paidBy: userId,
            paidAt: new Date(),
            updatedAt: new Date(),
          });
          const newRun = await db.payrollRuns.get(runId);
          await auditService.logEvent('hr.payroll', 'Update', {
            entity: 'PayrollRun',
            entityId: runId,
            recordId: runId,
            oldValue: oldRun,
            newValue: newRun,
            userId,
            branchId: oldRun.branchId,
            reason: 'All run sheets paid',
          });
        }
      }
    }
  },

  async generatePayrollRun(params: {
    month: number;
    year: number;
    branchId?: number;
    siteId?: string;
    userId?: number;
  }): Promise<PayrollRun> {
    // Backward-compatible wrapper (explicitly guarded).
    return this.generatePayrollRunItems({ ...params, reason: 'Generate payroll run items' });
  },

  /**
   * Explicit transition: generate (or regenerate) payroll run items for all employees.
   * Invariant: not allowed once the run is Locked/Paid.
   */
  async generatePayrollRunItems(params: {
    month: number;
    year: number;
    branchId?: number;
    siteId?: string;
    userId?: number;
    reason?: string;
  }): Promise<PayrollRun> {
    const branchIdKey = normalizeBranchIdKey(params.branchId);
    const existingRun = await assertCanGenerateRun(params.month, params.year, branchIdKey);
    const run = existingRun || (await this.getOrCreatePayrollRun(params));

    hrGuards.assertPayrollRunMutable(run, 'generate payroll');

    // Generate salary sheets for all active employees in branch/site.
    let employees = await db.employees.where('status').equals('active').toArray();
    employees = employees.filter((e) => (e.branchId ?? 0) === branchIdKey);
    if (params.siteId) employees = employees.filter((e) => e.assignedSite === params.siteId);

    const oldRun = await db.payrollRuns.get(run.id!);

    for (const emp of employees) {
      await this.generateMonthlySalarySheet(emp.id!, params.month, params.year);
    }

    const sheets = await db.salarySheets.where('payrollRunId').equals(run.id!).toArray();
    const totalNetPay = sheets.reduce((sum, s) => sum + (s.netSalary || 0), 0);
    await db.payrollRuns.update(run.id!, {
      employeeCount: sheets.length,
      totalNetPay,
      updatedAt: new Date(),
    });

    const updatedRun = (await db.payrollRuns.get(run.id!)) || run;
    await auditService.logEvent('hr.payroll', 'Update', {
      entity: 'PayrollRun',
      entityId: updatedRun.id,
      recordId: updatedRun.id,
      oldValue: oldRun,
      newValue: updatedRun,
      userId: params.userId,
      branchId: updatedRun.branchId,
      reason: params.reason || 'Generate payroll run items',
    });

    return updatedRun;
  },

  async lockPayrollRun(runId: number, lockedByOrReason: number | string, reasonMaybe?: string): Promise<void> {
    const run = await db.payrollRuns.get(runId);
    if (!run) throw new Error('Payroll run not found');
    hrGuards.assertPayrollRunLockable(run);

    const lockedBy = typeof lockedByOrReason === 'number' ? lockedByOrReason : undefined;
    const reason = typeof lockedByOrReason === 'string' ? lockedByOrReason : reasonMaybe;

    // Invariant: locking implies the run is finalized for calculation; no Calculated sheets should remain.
    const sheets = await db.salarySheets.where('payrollRunId').equals(runId).toArray();
    const hasUnapproved = sheets.some(s => s.status === 'Calculated' || s.status === 'Draft');
    if (hasUnapproved) {
      throw new Error('Cannot lock payroll run while there are unapproved salary sheets');
    }

    await db.payrollRuns.update(runId, {
      status: 'Locked',
      lockedBy,
      lockedAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await db.payrollRuns.get(runId);
    await auditService.logEvent('hr.payroll', 'Approve', {
      entity: 'PayrollRun',
      entityId: runId,
      recordId: runId,
      oldValue: run,
      newValue: updated,
      userId: lockedBy,
      branchId: run.branchId,
      reason: reason || 'Lock payroll run',
    });
  },

  /**
   * Explicit transition: unlock a payroll run.
   * Financial-safety: this is a high-risk override and MUST carry a reason.
   */
  async unlockPayrollRun(runId: number, unlockedBy: number, reason: string): Promise<void> {
    assertNonEmptyReason(reason, 'unlock payroll run');
    const run = await db.payrollRuns.get(runId);
    if (!run) throw new Error('Payroll run not found');
    if (run.status !== 'Locked') throw new Error('Only Locked payroll runs can be unlocked');

    const oldRun = run;
    await db.payrollRuns.update(runId, {
      status: 'Reviewed',
      updatedAt: new Date(),
    });

    const updated = await db.payrollRuns.get(runId);
    await auditService.logEvent('hr.payroll', 'Update', {
      entity: 'PayrollRun',
      entityId: runId,
      recordId: runId,
      oldValue: oldRun,
      newValue: updated,
      userId: unlockedBy,
      branchId: oldRun.branchId,
      reason,
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
