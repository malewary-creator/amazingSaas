/**
 * Leave Service
 * Manage employee leave applications and approvals
 */

import { db } from './database';
import type { Leave, LeaveBalance, LeaveType } from '@/types';

export const leaveService = {
  async applyLeave(data: Omit<Leave, 'id' | 'createdAt' | 'updatedAt' | 'appliedOn'>): Promise<number> {
    const leave: Omit<Leave, 'id'> = {
      ...data,
      appliedOn: new Date(),
      status: 'Applied',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return (await db.leaves.add(leave)) as number;
  },

  async approveLeave(
    leaveId: number,
    approvedBy: number,
    approvalRemarks?: string
  ): Promise<void> {
    await db.leaves.update(leaveId, {
      status: 'Approved',
      approvedBy,
      approvedOn: new Date(),
      approvalRemarks,
      updatedAt: new Date(),
    });
  },

  async rejectLeave(leaveId: number, rejectionReason?: string): Promise<void> {
    await db.leaves.update(leaveId, {
      status: 'Rejected',
      rejectionReason,
      updatedAt: new Date(),
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
    
    // Default allocation (can be customized per leave type)
    const allocationMap: Record<LeaveType, number> = {
      'Casual': 12,
      'Sick': 6,
      'Earned': 10,
      'Loss of Pay': 0,
    };
    
    const totalDays = allocationMap[leaveType] || 0;
    
    return {
      employeeId,
      leaveType,
      year,
      totalDays,
      usedDays,
      availableDays: totalDays - usedDays,
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
    
    if (new Date(leave.fromDate) < new Date()) {
      throw new Error('Cannot cancel leave that has already started');
    }
    
    await db.leaves.update(leaveId, {
      status: 'Cancelled',
      updatedAt: new Date(),
    });
  },
};
