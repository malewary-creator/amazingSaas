/**
 * Database Schema for Shine Solar Management System
 * Using Dexie.js (IndexedDB wrapper) for offline-first architecture
 */

import Dexie, { Table } from 'dexie';
import type {
  User,
  Role,
  Permission,
  Customer,
  Lead,
  CustomerDocument,
  Survey,
  SurveyPhoto,
  Project,
  ProjectStage,
  Item,
  BOM,
  Quotation,
  QuotationItem,
  Invoice,
  InvoiceItem,
  Payment,
  FinanceApplication,
  StockLedger,
  Supplier,
  Warranty,
  AMCContract,
  ServiceTicket,
  Notification,
  Branch,
  AuditLog,
  ProjectMaterial,
  Employee,
  SalarySetup,
  Attendance,
  Leave,
  AdvanceDeduction,
  SalarySheet,
  DailyExpense,
  WorkAssignment,
  EmployeeNote,
} from '@/types';

export class ShineSolarDB extends Dexie {
  // User Management
  users!: Table<User, number>;
  roles!: Table<Role, number>;
  permissions!: Table<Permission, number>;

  // Customer & Lead Management
  customers!: Table<Customer, number>;
  leads!: Table<Lead, number>;
  customerDocuments!: Table<CustomerDocument, number>;

  // Survey Module
  surveys!: Table<Survey, number>;
  surveyPhotos!: Table<SurveyPhoto, number>;

  // Project Management
  projects!: Table<Project, number>;
  projectStages!: Table<ProjectStage, number>;

  // Material & BOM
  items!: Table<Item, number>;
  bom!: Table<BOM, number>;
  projectMaterials!: Table<ProjectMaterial, number>;

  // Quotation Module
  quotations!: Table<Quotation, number>;
  quotationItems!: Table<QuotationItem, number>;

  // Invoice & Billing
  invoices!: Table<Invoice, number>;
  invoiceItems!: Table<InvoiceItem, number>;

  // Payment & Finance
  payments!: Table<Payment, number>;
  financeApplications!: Table<FinanceApplication, number>;

  // Inventory
  stockLedger!: Table<StockLedger, number>;
  suppliers!: Table<Supplier, number>;

  // Warranty & AMC
  warranties!: Table<Warranty, number>;
  amcContracts!: Table<AMCContract, number>;

  // Service & Complaint
  serviceTickets!: Table<ServiceTicket, number>;

  // Notifications
  notifications!: Table<Notification, number>;

  // Multi-branch (optional)
  branches!: Table<Branch, number>;

  // Audit & Security
  auditLogs!: Table<AuditLog, number>;

  // HR & Employees
  employees!: Table<Employee, number>;
  salarySetups!: Table<SalarySetup, number>;
  attendance!: Table<Attendance, number>;
  leaves!: Table<Leave, number>;
  advanceDeductions!: Table<AdvanceDeduction, number>;
  salarySheets!: Table<SalarySheet, number>;
  workAssignments!: Table<WorkAssignment, number>;
  employeeNotes!: Table<EmployeeNote, number>;

  // Expenses
  dailyExpenses!: Table<DailyExpense, number>;

  constructor() {
    super('ShineSolarDB');

    this.version(1).stores({
      // User Management
      users: '++id, email, mobile, role, status, branchId',
      roles: '++id, name, code',
      permissions: '++id, roleId, module, action',

      // Customer & Lead Management
      customers: '++id, mobile, email, name, createdAt, updatedAt',
      leads: '++id, customerId, source, status, assignedTo, createdAt, updatedAt, branchId',
      customerDocuments: '++id, customerId, documentType, uploadedAt',

      // Survey Module
      surveys: '++id, leadId, assignedTo, status, surveyDate, createdAt, updatedAt',
      surveyPhotos: '++id, surveyId, photoType, capturedAt',

      // Project Management
      projects: '++id, leadId, customerId, quotationId, status, startDate, targetDate, completionDate, branchId, createdAt, updatedAt',
      projectStages: '++id, projectId, stageName, status, startDate, endDate, assignedTo',

      // Material & BOM
      items: '++id, category, name, brand, model, hsn, status, createdAt, updatedAt',
      bom: '++id, projectId, itemId, createdAt',

      // Quotation Module
      quotations: '++id, quotationNumber, leadId, customerId, status, quotationDate, validityDate, createdAt, updatedAt, branchId',
      quotationItems: '++id, quotationId, itemId, lineNumber',

      // Invoice & Billing
      invoices: '++id, invoiceNumber, projectId, customerId, invoiceType, status, invoiceDate, dueDate, createdAt, updatedAt, branchId',
      invoiceItems: '++id, invoiceId, itemId, lineNumber',

      // Payment & Finance
      payments: '++id, projectId, invoiceId, customerId, paymentDate, paymentMode, createdAt, branchId',
      financeApplications: '++id, projectId, customerId, financePartner, status, createdAt, updatedAt',

      // Inventory
      stockLedger: '++id, itemId, transactionType, projectId, supplierId, transactionDate, branchId',
      suppliers: '++id, name, gstin, status, createdAt, updatedAt',

      // Warranty & AMC
      warranties: '++id, projectId, customerId, warrantyType, startDate, endDate',
      amcContracts: '++id, projectId, customerId, status, startDate, endDate, createdAt',

      // Service & Complaint
      serviceTickets: '++id, ticketNumber, projectId, customerId, issueType, priority, status, assignedTo, createdAt, updatedAt, branchId',

      // Notifications
      notifications: '++id, userId, type, status, createdAt, scheduledFor',

      // Multi-branch
      branches: '++id, code, name, status',

      // Audit & Security
      auditLogs: '++id, userId, module, action, timestamp, branchId',

      // Settings
      companySettings: '++id',
      taxSettings: '++id',
      gstRates: '++id, rate, isActive',
      appearanceSettings: '++id',
    });

    // Add new stores in a bumped version for schema evolution
    this.version(2).stores({
      projectMaterials: '++id, projectId, itemId, status, date',
    });

    // Add HR module tables in version 3
    this.version(3).stores({
      employees: '++id, employeeId, category, status, joiningDate, assignedProject, branchId',
      salarySetups: '++id, employeeId, status, effectiveDate',
      attendance: '++id, employeeId, date, status, branchId',
      leaves: '++id, employeeId, leaveType, fromDate, toDate, status, branchId',
      advanceDeductions: '++id, employeeId, type, date, status, branchId',
      salarySheets: '++id, employeeId, [month+year], status, branchId',
      workAssignments: '++id, employeeId, projectId, assignedDate, status',
      employeeNotes: '++id, employeeId, noteType, createdBy',
      dailyExpenses: '++id, expenseId, date, category, projectId, status, branchId',
    });
  }

  /**
   * Seed initial data for fresh installation
   */
  async seedInitialData() {
    const rolesCount = await this.roles.count();
    
    if (rolesCount === 0) {
      // Create default roles
      await this.roles.bulkAdd([
        { name: 'Admin', code: 'ADMIN', description: 'Full system access', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Sales Executive', code: 'SALES', description: 'Lead management and quotations', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Survey Engineer', code: 'SURVEY', description: 'Site survey and technical assessment', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Project Manager', code: 'PM', description: 'Project and operations management', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Installation Team', code: 'INSTALL', description: 'Installation and field work', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Accounts', code: 'ACCOUNTS', description: 'Billing and finance management', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      ]);

      // Create default admin user
      const adminRole = await this.roles.where('code').equals('ADMIN').first();
      if (adminRole) {
        await this.users.add({
          email: 'admin@shinesolar.com',
          mobile: '9999999999',
          password: '$2a$10$YourHashedPasswordHere', // In production, hash properly
          name: 'System Admin',
          role: adminRole.id!,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Create default branch
      await this.branches.add({
        code: 'HQ',
        name: 'Head Office',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        contactPerson: '',
        mobile: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Backup database to JSON (Legacy - use backupService instead)
   * @deprecated Use backupService.exportFullBackup() for better functionality
   */
  async exportToJSON(): Promise<string> {
    const data: any = {};
    
    // Export all tables
    for (const table of this.tables) {
      data[table.name] = await table.toArray();
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON backup
   */
  async importFromJSON(jsonData: string, clearExisting: boolean = false): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (clearExisting) {
        await this.clearAllData();
      }

      // Import each table
      await this.transaction('rw', this.tables, async () => {
        for (const [tableName, records] of Object.entries(data)) {
          const table = (this as any)[tableName];
          if (table && Array.isArray(records)) {
            await table.bulkAdd(records as any[]);
          }
        }
      });

      console.log('✅ Data imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAllData() {
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        await table.clear();
      }
    });
    console.log('⚠️ All data cleared');
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats: { [key: string]: number } = {};
    let total = 0;

    for (const table of this.tables) {
      const count = await table.count();
      stats[table.name] = count;
      total += count;
    }

    return { tables: stats, total };
  }
}

// Export singleton instance
export const db = new ShineSolarDB();

// Initialize and seed data
db.seedInitialData().catch(console.error);
