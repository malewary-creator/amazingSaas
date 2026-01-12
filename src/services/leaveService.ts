/**
 * Leave Service
 * Manage employee leave applications and approvals
 */

import { db } from './database';
import type { Leave, LeaveBalance, LeaveType } from '@/types';
import { auditService } from './auditService';
import { hrGuards } from './hrGuards';

export const leaveService = {
  async applyLeave(data: Omit<Leave, 'id' | 'createdAt' | 'updatedAt' | 'appliedOn'>): Promise<number> {
    const leave: Omit<Leave, 'id'> = {
      ...data,
      appliedOn: new Date(),
      status: 'Applied',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = (await db.leaves.add(leave)) as number;
    await auditService.logEvent('hr.leave', 'Create', {
      entity: 'Leave',
      entityId: id,
      recordId: id,
      newValue: leave,
      branchId: (leave as any).branchId,
      userId: (leave as any).appliedBy,
    });
    return id;
  },

  async approveLeave(
    leaveId: number,
    approvedBy: number,
    approvalRemarks?: string
  ): Promise<void> {
    const existing = await db.leaves.get(leaveId);
    if (!existing) throw new Error('Leave record not found');
    hrGuards.assertLeaveStatusChangeAllowed(existing, 'Approved');

    await db.leaves.update(leaveId, {
      status: 'Approved',
      approvedBy,
      approvedOn: new Date(),
      approvalRemarks,
      updatedAt: new Date(),
    });

    const updated = await db.leaves.get(leaveId);
    await auditService.logEvent('hr.leave', 'Approve', {
      entity: 'Leave',
      entityId: leaveId,
      recordId: leaveId,
      oldValue: existing,
      newValue: updated,
      userId: approvedBy,
      branchId: existing.branchId,
    });
  },

  async rejectLeave(leaveId: number, rejectionReason?: string): Promise<void> {
    const existing = await db.leaves.get(leaveId);
    if (!existing) throw new Error('Leave record not found');
    hrGuards.assertLeaveStatusChangeAllowed(existing, 'Rejected');

    await db.leaves.update(leaveId, {
      status: 'Rejected',
      rejectionReason,
      updatedAt: new Date(),
    });

    const updated = await db.leaves.get(leaveId);
    await auditService.logEvent('hr.leave', 'Reject', {
      entity: 'Leave',
      entityId: leaveId,
      recordId: leaveId,
      oldValue: existing,
      newValue: updated,
      branchId: existing.branchId,
    });
  },

  async getLeaveBalance(
    employeeId: number,
    leaveType: LeaveType,
    year: number
  ): Promise<LeaveBalance> {
    const leaves = await db.leaves
      .where('employeeId')
      .equals(employeeId)
      .filter(
        l => l.leaveType === leaveType && new Date(l.fromDate).getFullYear() === year
      )
      .toArray();
    
    const approvedLeaves = leaves.filter(l => l.status === 'Approved');
    const usedDays = approvedLeaves.reduce((sum, l) => sum + l.numberOfDays, 0);

    // Policy-driven entitlement (effective: per-year entry)
    let totalDays = 0;
    try {
      const emp = await db.employees.get(employeeId);
      const branchId = emp?.branchId;
      const category = emp?.category;

      // Find an active entitlement for the year, most specific first.
      const entitlements = await db.leaveEntitlements
        .where('leaveType')
        .equals(leaveType)
        .filter((e) =>
          e.status === 'active' &&
          e.year === year &&
          (!branchId || !e.branchId || e.branchId === branchId) &&
          (!category || !e.employeeCategory || e.employeeCategory === category)
        )
        .toArray();

      const best = entitlements.sort((a, b) => {
        const aSpecific = (a.branchId ? 1 : 0) + (a.employeeCategory ? 1 : 0);
        const bSpecific = (b.branchId ? 1 : 0) + (b.employeeCategory ? 1 : 0);
        return bSpecific - aSpecific;
      })[0];

      if (best) totalDays = best.totalDays;
    } catch {
      // If policy tables are empty/unavailable, fall back to defaults.
    }

    // Default allocation (backward compatible)
    if (!totalDays) {
      const allocationMap: Record<LeaveType, number> = {
        Casual: 12,
        Sick: 6,
        Earned: 10,
        'Loss of Pay': 0,
      };
      totalDays = allocationMap[leaveType] || 0;
    }

    // Loss of Pay is unlimited unpaid; do not show negative balances.
    if (leaveType === 'Loss of Pay') {
      totalDays = 0;
    }
    
    return {
      employeeId,
      leaveType,
      year,
      totalDays,
      usedDays,
      availableDays: leaveType === 'Loss of Pay' ? 0 : Math.max(0, totalDays - usedDays),
    };
  },

  async getPendingLeaves(): Promise<Leave[]> {
    const leaves = await db.leaves.where('status').equals('Applied').toArray();
    return leaves.sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
  },

  async getEmployeeLeaves(employeeId: number, month?: number, year?: number): Promise<Leave[]> {
    let leaves = await db.leaves.where('employeeId').equals(employeeId).toArray();
    
    if (month && year) {
      leaves = leaves.filter(l => {
        const fromDate = new Date(l.fromDate);
        const toDate = new Date(l.toDate);
        
        return (
          (fromDate.getMonth() === month - 1 && fromDate.getFullYear() === year) ||
          (toDate.getMonth() === month - 1 && toDate.getFullYear() === year)
        );
      });
    }
    
    return leaves.sort((a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime());
  },

  async getLeaveHistory(employeeId: number, limit: number = 10): Promise<Leave[]> {
    const leaves = await db.leaves
      .where('employeeId')
      .equals(employeeId)
      .filter(l => l.status !== 'Applied')
      .toArray();
    
    return leaves
      .sort((a, b) => new Date(b.approvedOn || b.appliedOn).getTime() - new Date(a.approvedOn || a.appliedOn).getTime())
      .slice(0, limit);
  },

  async getOnLeaveEmployees(date: Date): Promise<number[]> {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const approvedLeaves = await db.leaves
      .where('status')
      .equals('Approved')
      .toArray();
    
    return approvedLeaves
      .filter(l => {
        const fromDate = new Date(l.fromDate);
        const toDate = new Date(l.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        
        return checkDate >= fromDate && checkDate <= toDate;
      })
      .map(l => l.employeeId);
  },

  async cancelLeave(leaveId: number): Promise<void> {
    const leave = await db.leaves.get(leaveId);
    if (!leave) throw new Error('Leave record not found');

    hrGuards.assertLeaveStatusChangeAllowed(leave, 'Cancelled');
    
    if (new Date(leave.fromDate) < new Date()) {
      throw new Error('Cannot cancel leave that has already started');
    }
    
    await db.leaves.update(leaveId, {
      status: 'Cancelled',
      updatedAt: new Date(),
    });

    const updated = await db.leaves.get(leaveId);
    await auditService.logEvent('hr.leave', 'Update', {
      entity: 'Leave',
      entityId: leaveId,
      recordId: leaveId,
      oldValue: leave,
      newValue: updated,
      branchId: leave.branchId,
      reason: 'Cancelled by user',
    });
  },
};
