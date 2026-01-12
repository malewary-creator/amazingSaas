/**
 * Employee Service
 * CRUD operations for employees and basic HR management
 */

import { db } from './database';
import type { Employee, EmployeeCategory } from '@/types';
import { auditService } from './auditService';

export const employeeService = {
  async generateEmployeeId(): Promise<string> {
    const existing = await db.employees.toArray();
    const max = existing.reduce((m, emp) => {
      const match = emp.employeeId?.match(/EMP-(\d{4})-(\d+)/);
      return match ? Math.max(m, parseInt(match[2], 10)) : m;
    }, 0);
    const year = new Date().getFullYear();
    return `EMP-${year}-${String(max + 1).padStart(3, '0')}`;
  },

  async createEmployee(
    data: Omit<Employee, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const employeeId = await this.generateEmployeeId();
    const employee: Omit<Employee, 'id'> = {
      ...data,
      employeeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = (await db.employees.add(employee)) as number;
    await auditService.logEvent('hr.employee', 'Create', {
      entity: 'Employee',
      entityId: id,
      recordId: id,
      newValue: employee,
      branchId: employee.branchId,
    });
    return id;
  },

  async updateEmployee(id: number, data: Partial<Employee>): Promise<void> {
    const existing = await db.employees.get(id);
    if (!existing) throw new Error('Employee not found');
    await db.employees.update(id, { ...data, updatedAt: new Date() });
    const updated = await db.employees.get(id);
    await auditService.logEvent('hr.employee', 'Update', {
      entity: 'Employee',
      entityId: id,
      recordId: id,
      oldValue: existing,
      newValue: updated,
      branchId: existing.branchId,
    });
  },

  async deleteEmployee(id: number): Promise<void> {
    const existing = await db.employees.get(id);
    if (!existing) throw new Error('Employee not found');

    // Check if employee has any attendance or leave records
    const attendance = await db.attendance.where('employeeId').equals(id).count();
    const leaves = await db.leaves.where('employeeId').equals(id).count();
    
    if (attendance > 0 || leaves > 0) {
      await auditService.logEvent('hr.employee', 'Delete', {
        entity: 'Employee',
        entityId: id,
        recordId: id,
        oldValue: existing,
        newValue: { blocked: true, attendanceCount: attendance, leaveCount: leaves },
        branchId: existing.branchId,
        reason: 'Blocked delete due to dependent HR records',
      });
      throw new Error('Cannot delete employee with attendance or leave records. Mark as inactive instead.');
    }

    await db.employees.delete(id);

    await auditService.logEvent('hr.employee', 'Delete', {
      entity: 'Employee',
      entityId: id,
      recordId: id,
      oldValue: existing,
      branchId: existing.branchId,
    });
  },

  async getEmployees(filters?: {
    category?: EmployeeCategory;
    status?: string;
    assignedProject?: number;
  }): Promise<Employee[]> {
    let employees = await db.employees.toArray();
    
    if (filters?.category) employees = employees.filter(e => e.category === filters.category);
    if (filters?.status) employees = employees.filter(e => e.status === filters.status);
    if (filters?.assignedProject) employees = employees.filter(e => e.assignedProject === filters.assignedProject);
    
    return employees.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    return db.employees.get(id);
  },

  async getEmployeesByCategory(category: EmployeeCategory): Promise<Employee[]> {
    const employees = await db.employees.where('category').equals(category).toArray();
    return employees.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getActiveEmployees(): Promise<Employee[]> {
    const employees = await db.employees.where('status').equals('active').toArray();
    return employees.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<EmployeeCategory, number>;
  }> {
    const employees = await db.employees.toArray();
    
    return {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      byCategory: employees.reduce(
        (acc, emp) => {
          acc[emp.category] = (acc[emp.category] || 0) + 1;
          return acc;
        },
        {} as Record<EmployeeCategory, number>
      ),
    };
  },
};
