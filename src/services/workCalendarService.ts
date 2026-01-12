import { db } from './database';
import type { WorkCalendar } from '@/types';

const dateOnly = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (month: number, year: number) => new Date(year, month - 1, 1, 0, 0, 0, 0);
const endOfMonth = (month: number, year: number) => new Date(year, month, 0, 23, 59, 59, 999);

export const workCalendarService = {
  async getEffectiveCalendar(params: {
    branchId: number;
    siteId?: string;
    asOf: Date;
  }): Promise<WorkCalendar | undefined> {
    const asOf = params.asOf;
    const branchId = params.branchId ?? 0;
    const siteId = params.siteId;

    const calendars = await db.workCalendars
      .where('branchId')
      .equals(branchId)
      .filter((c) => {
        if (c.status !== 'active') return false;
        if (siteId && c.siteId && c.siteId !== siteId) return false;
        const from = new Date(c.effectiveFrom);
        const to = c.effectiveTo ? new Date(c.effectiveTo) : undefined;
        return from <= asOf && (!to || asOf <= to);
      })
      .toArray();

    // Prefer site-specific over branch-level; then latest effectiveFrom.
    return calendars
      .sort((a, b) => {
        const aSpecific = a.siteId ? 1 : 0;
        const bSpecific = b.siteId ? 1 : 0;
        if (aSpecific !== bSpecific) return bSpecific - aSpecific;
        return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
      })[0];
  },

  async getWorkingDaysInMonth(params: {
    branchId: number;
    siteId?: string;
    month: number;
    year: number;
  }): Promise<number> {
    const { month, year } = params;
    const first = startOfMonth(month, year);
    const last = endOfMonth(month, year);

    const calendar = await this.getEffectiveCalendar({
      branchId: params.branchId ?? 0,
      siteId: params.siteId,
      asOf: first,
    });

    // Backward-compatible fallback: Mon–Fri working days.
    const weekendDays = calendar?.weekendDays?.length
      ? new Set(calendar.weekendDays)
      : new Set<number>([0, 6]); // Sun, Sat as non-working

    const holidaySet = new Set<number>();
    const workingOverrideSet = new Set<number>();
    if (calendar?.id) {
      const holidays = await db.workCalendarHolidays
        .where('calendarId')
        .equals(calendar.id)
        .filter((h) => {
          const d = dateOnly(new Date(h.date));
          return d >= dateOnly(first) && d <= dateOnly(last);
        })
        .toArray();

      for (const h of holidays) {
        const t = dateOnly(new Date(h.date)).getTime();
        if (h.isWorkingDayOverride) workingOverrideSet.add(t);
        else holidaySet.add(t);
      }
    }

    let workingDays = 0;
    const cursor = new Date(first);
    while (cursor <= last) {
      const dayOfWeek = cursor.getDay();
      const t = dateOnly(cursor).getTime();

      const isWeekend = weekendDays.has(dayOfWeek);
      const isHoliday = holidaySet.has(t);
      const isWorkingOverride = workingOverrideSet.has(t);

      const isWorking = (isWorkingOverride || (!isWeekend && !isHoliday));
      if (isWorking) workingDays++;

      cursor.setDate(cursor.getDate() + 1);
    }

    return workingDays;
  },
};
