/**
 * Attendance Service
 * Manage employee attendance and check-in/out
 */

import { db } from './database';
import type { Attendance, AttendanceSummary } from '@/types';
import { auditService } from './auditService';
import { hrGuards } from './hrGuards';
import { workCalendarService } from './workCalendarService';

export const attendanceService = {
  async recordAttendance(data: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const attendance: Omit<Attendance, 'id'> = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = (await db.attendance.add(attendance)) as number;
    await auditService.logEvent('hr.attendance', 'Create', {
      entity: 'Attendance',
      entityId: id,
      recordId: id,
      newValue: attendance,
      branchId: attendance.branchId,
    });
    return id;
  },

  async checkIn(employeeId: number, siteId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    const existing = await db.attendance
      .where('employeeId')
      .equals(employeeId)
      .filter(a => {
        const aDate = new Date(a.date);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === today.getTime();
      })
      .first();
    
    if (existing) {
      throw new Error('Already checked in today');
    }
    
    return this.recordAttendance({
      employeeId,
      date: new Date(),
      status: 'Present',
      checkInTime: new Date(),
      siteId,
    });
  },

  async checkOut(employeeId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const record = await db.attendance
      .where('employeeId')
      .equals(employeeId)
      .filter(a => {
        const aDate = new Date(a.date);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === today.getTime() && !a.checkOutTime;
      })
      .first();
    
    if (!record || !record.id) {
      throw new Error('No check-in record found for today');
    }
    
    const checkOutTime = new Date();
    const checkInTime = record.checkInTime ? new Date(record.checkInTime) : new Date();
    const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    await db.attendance.update(record.id, {
      checkOutTime,
      workingHours: parseFloat(workingHours.toFixed(2)),
      updatedAt: new Date(),
    });

    await auditService.logEvent('hr.attendance', 'Update', {
      entity: 'Attendance',
      entityId: record.id,
      recordId: record.id,
      oldValue: record,
      newValue: { ...record, checkOutTime, workingHours: parseFloat(workingHours.toFixed(2)) },
      branchId: (record as any).branchId,
    });
  },

  async updateAttendance(id: number, data: Partial<Attendance>, meta?: { userId?: number; reason?: string }): Promise<void> {
    const existing = await db.attendance.get(id);
    if (!existing) throw new Error('Attendance record not found');
    hrGuards.assertAttendanceMutable(existing, 'edit attendance');

    await db.attendance.update(id, { ...data, updatedAt: new Date() });
    const updated = await db.attendance.get(id);
    await auditService.logEvent('hr.attendance', 'Update', {
      entity: 'Attendance',
      entityId: id,
      recordId: id,
      oldValue: existing,
      newValue: updated,
      userId: meta?.userId,
      reason: meta?.reason,
      branchId: existing.branchId,
    });
  },

  async getAttendance(employeeId: number, month: number, year: number): Promise<Attendance[]> {
    const attendance = await db.attendance.where('employeeId').equals(employeeId).toArray();
    
    return attendance.filter(a => {
      const aDate = new Date(a.date);
      return aDate.getMonth() === month - 1 && aDate.getFullYear() === year;
    });
  },

  async getAttendanceSummary(employeeId: number, month: number, year: number): Promise<AttendanceSummary> {
    const records = await this.getAttendance(employeeId, month, year);
    
    const summary: AttendanceSummary = {
      employeeId,
      month,
      year,
      totalWorkingDays: 0,
      presentDays: 0,
      absentDays: 0,
      halfDayCount: 0,
      totalLeaves: 0,
      workingHours: 0,
    };
    
    // Working days are driven by policy when configured; fallback is Mon–Fri.
    const employee = await db.employees.get(employeeId);
    const branchId = employee?.branchId ?? 0;
    const siteId = employee?.assignedSite;
    summary.totalWorkingDays = await workCalendarService.getWorkingDaysInMonth({
      branchId,
      siteId,
      month,
      year,
    });
    
    records.forEach(record => {
      if (record.status === 'Present') summary.presentDays++;
      if (record.status === 'Absent') summary.absentDays++;
      if (record.status === 'Half-day') summary.halfDayCount++;
      if (record.status === 'Leave') summary.totalLeaves++;
      
      if (record.workingHours) summary.workingHours += record.workingHours;
    });
    
    return summary;
  },

  async getTodayAttendance(): Promise<Attendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await db.attendance.toArray();
    return attendance.filter(a => {
      const aDate = new Date(a.date);
      aDate.setHours(0, 0, 0, 0);
      return aDate.getTime() === today.getTime();
    });
  },

  async getAbsentEmployees(date: Date): Promise<number[]> {
    const dayDate = new Date(date);
    dayDate.setHours(0, 0, 0, 0);
    
    const records = await db.attendance.toArray();
    const markedEmployees = records
      .filter(a => {
        const aDate = new Date(a.date);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === dayDate.getTime();
      })
      .map(a => a.employeeId);
    
    const allEmployees = await db.employees.where('status').equals('active').toArray();
    const allEmployeeIds = allEmployees.map(e => e.id!);
    
    return allEmployeeIds.filter(id => !markedEmployees.includes(id));
  },
};
