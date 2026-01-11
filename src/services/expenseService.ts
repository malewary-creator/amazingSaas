/**
 * Expense Service
 * Manage daily operational expenses
 */

import { db } from './database';
import type { DailyExpense, ExpenseCategory, ExpenseSummary } from '@/types';

export const expenseService = {
  async generateExpenseId(): Promise<string> {
    const existing = await db.dailyExpenses.toArray();
    const max = existing.reduce((m, exp) => {
      const match = exp.expenseId?.match(/EXP-(\d{4})-(\d+)/);
      return match ? Math.max(m, parseInt(match[2], 10)) : m;
    }, 0);
    const year = new Date().getFullYear();
    return `EXP-${year}-${String(max + 1).padStart(4, '0')}`;
  },

  async addExpense(
    data: Omit<DailyExpense, 'id' | 'expenseId' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const expenseId = await this.generateExpenseId();
    const expense: Omit<DailyExpense, 'id'> = {
      ...data,
      expenseId,
      status: data.status || 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return (await db.dailyExpenses.add(expense)) as number;
  },

  async updateExpense(id: number, data: Partial<DailyExpense>): Promise<void> {
    await db.dailyExpenses.update(id, { ...data, updatedAt: new Date() });
  },

  async approveExpense(expenseId: number, approvedBy: number, remarks?: string): Promise<void> {
    await db.dailyExpenses.update(expenseId, {
      status: 'Approved',
      approvedBy,
      approvalRemarks: remarks,
      updatedAt: new Date(),
    });
  },

  async rejectExpense(expenseId: number, remarks?: string): Promise<void> {
    await db.dailyExpenses.update(expenseId, {
      status: 'Rejected',
      approvalRemarks: remarks,
      updatedAt: new Date(),
    });
  },

  async getDailyExpenses(date: Date): Promise<DailyExpense[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const expenses = await db.dailyExpenses.toArray();
    return expenses.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= startDate && eDate <= endDate;
    });
  },

  async getWeeklyExpenses(startDate: Date): Promise<DailyExpense[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const expenses = await db.dailyExpenses.toArray();
    return expenses.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= startDate && eDate <= endDate;
    });
  },

  async getMonthlyExpenses(month: number, year: number): Promise<DailyExpense[]> {
    const expenses = await db.dailyExpenses.toArray();
    return expenses.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === month - 1 && eDate.getFullYear() === year;
    });
  },

  async getDailySummary(date: Date): Promise<ExpenseSummary> {
    const expenses = await this.getDailyExpenses(date);
    const approvedExpenses = expenses.filter(e => e.status === 'Approved');
    
    const byCategory = approvedExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<ExpenseCategory, number>
    );
    
    return {
      date,
      period: 'Daily',
      totalExpenses: approvedExpenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory,
      count: approvedExpenses.length,
    };
  },

  async getWeeklySummary(startDate: Date): Promise<ExpenseSummary> {
    const expenses = await this.getWeeklyExpenses(startDate);
    const approvedExpenses = expenses.filter(e => e.status === 'Approved');
    
    const byCategory = approvedExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<ExpenseCategory, number>
    );
    
    return {
      period: 'Weekly',
      totalExpenses: approvedExpenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory,
      count: approvedExpenses.length,
    };
  },

  async getMonthlySummary(month: number, year: number): Promise<ExpenseSummary> {
    const expenses = await this.getMonthlyExpenses(month, year);
    const approvedExpenses = expenses.filter(e => e.status === 'Approved');
    
    const byCategory = approvedExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<ExpenseCategory, number>
    );
    
    return {
      period: 'Monthly',
      totalExpenses: approvedExpenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory,
      count: approvedExpenses.length,
    };
  },

  async getPendingExpenses(): Promise<DailyExpense[]> {
    const expenses = await db.dailyExpenses.where('status').equals('Pending').toArray();
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getExpensesByProject(projectId: number, month?: number, year?: number): Promise<DailyExpense[]> {
    let expenses = await db.dailyExpenses
      .where('projectId')
      .equals(projectId)
      .toArray();
    
    if (month && year) {
      expenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getMonth() === month - 1 && eDate.getFullYear() === year;
      });
    }
    
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};
