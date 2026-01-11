/**
 * Attendance Service
 * Manage employee attendance and check-in/out
 */

import { db } from './database';
import type { Attendance, AttendanceSummary } from '@/types';

export const attendanceService = {
  async recordAttendance(data: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const attendance: Omit<Attendance, 'id'> = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return (await db.attendance.add(attendance)) as number;
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
  },

  async updateAttendance(id: number, data: Partial<Attendance>): Promise<void> {
    await db.attendance.update(id, { ...data, updatedAt: new Date() });
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
    
    // Count working days (Mon-Fri, excluding holidays)
    const lastDay = new Date(year, month, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month - 1, i);
      const dayOfWeek = date.getDay();
      
      // Count weekdays (1-5 = Mon-Fri)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        summary.totalWorkingDays++;
      }
    }
    
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
