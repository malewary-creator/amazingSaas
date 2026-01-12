import type { AuditLog } from '@/types';

/**
 * migrateLegacySalarySheetsToRuns
 *
 * Financial-safety invariant:
 * - This migration must NOT change any monetary values or time-series facts.
 * - It is allowed to add linkage (`payrollRunId`) and integrity metadata.
 * - Salary sheet timestamps must be preserved (do not touch `createdAt`/`updatedAt`).
 *
 * The helper is written to work both:
 * - inside a Dexie `.upgrade(tx => ...)` callback (pass tx.table(...)), and
 * - at runtime via `db.transaction(...)` (pass db.<table>). 
 */
export async function migrateLegacySalarySheetsToRuns(args: {
  salarySheetsTable: any;
  payrollRunsTable: any;
  auditLogsTable?: any;
  sha256Hex?: (input: string) => Promise<{ alg: 'SHA-256' | 'FNV-1A-32'; hash: string }>;
  now?: Date;
}): Promise<{ migratedRunCount: number; attachedSheetCount: number }>{
  const now = args.now ?? new Date();

  const salarySheetsTable = args.salarySheetsTable;
  const payrollRunsTable = args.payrollRunsTable;
  const auditLogsTable = args.auditLogsTable;

  const allSheets: any[] = await salarySheetsTable.toArray();
  if (!allSheets.length) return { migratedRunCount: 0, attachedSheetCount: 0 };

  const allRuns: any[] = await payrollRunsTable.toArray();
  const runKey = (branchId: number, year: number, month: number) => `${branchId}|${year}|${month}`;

  const runByKey = new Map<string, any>();
  for (const run of allRuns) {
    const key = runKey(Number(run.branchId ?? 0), Number(run.year), Number(run.month));
    // If duplicates exist, keep the first; service-level invariants should prevent this.
    if (!runByKey.has(key)) runByKey.set(key, run);
  }

  const keyOfSheet = (s: any) => runKey(Number(s.branchId ?? 0), Number(s.year), Number(s.month));
  const sheetsByKey = new Map<string, any[]>();
  for (const sheet of allSheets) {
    const key = keyOfSheet(sheet);
    const list = sheetsByKey.get(key) ?? [];
    list.push(sheet);
    sheetsByKey.set(key, list);
  }

  let migratedRunCount = 0;
  let attachedSheetCount = 0;

  for (const [key, sheets] of sheetsByKey.entries()) {
    const [branchIdStr, yearStr, monthStr] = key.split('|');
    const branchId = Number(branchIdStr) || 0;
    const year = Number(yearStr);
    const month = Number(monthStr);

    const statuses = new Set(sheets.map(s => s.status));
    let inferredRunStatus: 'Draft' | 'Reviewed' | 'Locked' | 'Paid' | 'Archived' = 'Draft';
    if (statuses.has('Paid')) inferredRunStatus = 'Paid';
    else if (statuses.has('Approved')) inferredRunStatus = 'Locked';

    const earliestCreatedAt = sheets
      .map(s => new Date(s.createdAt))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    let run = runByKey.get(key);
    let runId: number | undefined = run?.id;
    let createdNewRun = false;

    if (!runId) {
      runId = await payrollRunsTable.add({
        branchId: branchId || undefined,
        month,
        year,
        status: inferredRunStatus,
        generatedAt: earliestCreatedAt,
        createdAt: earliestCreatedAt,
        updatedAt: earliestCreatedAt,
        employeeCount: sheets.length,
        totalNetPay: sheets.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0),
      });
      createdNewRun = true;

      run = await payrollRunsTable.get(runId);
      runByKey.set(key, run);
      migratedRunCount++;
    }

    // Attach legacy sheets to the run. Do not modify financial values or timestamps.
    const legacyToAttach = sheets.filter(s => !s.payrollRunId);
    for (const sheet of legacyToAttach) {
      const update: any = { payrollRunId: runId };

      // Optional integrity hash for tamper detection (metadata-only).
      if (args.sha256Hex) {
        const payload = {
          payrollRunId: runId,
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
        };

        const { alg, hash } = await args.sha256Hex(JSON.stringify(payload));
        update.hashAlgorithm = alg;
        update.integrityHash = hash;
      }

      await salarySheetsTable.update(sheet.id, update);
      attachedSheetCount++;
    }

    // Single audit event per run migration (not per-sheet).
    if (auditLogsTable && (createdNewRun || legacyToAttach.length > 0)) {
      const audit: AuditLog = {
        module: 'hr.payroll',
        action: 'Update',
        entity: 'PayrollRun',
        entityId: runId,
        recordId: runId,
        reason: 'Legacy salarySheets → PayrollRun linkage migration',
        oldValue: JSON.stringify({
          runKey: { branchId, year, month },
          createdNewRun,
          legacySheetsWithoutRun: legacyToAttach.map(s => s.id),
        }),
        newValue: JSON.stringify({
          runKey: { branchId, year, month },
          payrollRunId: runId,
          attachedSheetCount: legacyToAttach.length,
          inferredRunStatus,
        }),
        timestamp: now,
        branchId: branchId || undefined,
      };

      await auditLogsTable.add(audit as any);
    }
  }

  return { migratedRunCount, attachedSheetCount };
}
