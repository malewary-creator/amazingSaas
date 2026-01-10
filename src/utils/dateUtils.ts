/**
 * Date formatting and manipulation utilities
 */

import { format, parseISO, isValid, differenceInDays, addDays, addMonths, addYears } from 'date-fns';

/**
 * Format date to Indian format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '-';
  
  return format(dateObj, 'dd/MM/yyyy');
}

/**
 * Format date and time (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '-';
  
  return format(dateObj, 'dd/MM/yyyy HH:mm');
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | undefined | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Format time (HH:mm AM/PM)
 */
export function formatTime(date: Date | string | undefined | null): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '-';
  
  return format(dateObj, 'hh:mm a');
}

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffDays = differenceInDays(now, dateObj);
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays < -1) return `in ${Math.abs(diffDays)} days`;
  
  return formatDate(dateObj);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return differenceInDays(end, start);
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Add months to a date
 */
export function addMonthsToDate(date: Date | string, months: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(dateObj, months);
}

/**
 * Add years to a date
 */
export function addYearsToDate(date: Date | string, years: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addYears(dateObj, years);
}

/**
 * Check if date is in past
 */
export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Check if date is in future
 */
export function isDateInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > new Date();
}

/**
 * Get financial year from date (Apr-Mar)
 */
export function getFinancialYear(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  
  // Financial year starts from April (month 3)
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get month name
 */
export function getMonthName(date: Date | string, short: boolean = false): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, short ? 'MMM' : 'MMMM');
}

/**
 * Get current date-time for database
 */
export function getCurrentDateTime(): Date {
  return new Date();
}

/**
 * Parse date string safely
 */
export function parseDateSafe(dateString: string): Date | null {
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
