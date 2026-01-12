/**
 * Additional Type Definitions - Part 2
 * Invoice, Payment, Finance, Inventory, Warranty, Service, etc.
 */

import type { BaseEntity, Status, Address } from './index';

// ==================== INVOICE & BILLING ====================

export type InvoiceType = 'Proforma' | 'Tax Invoice' | 'Stage Payment';
export type InvoiceStatus = 'Draft' | 'Generated' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
export type GSTType = 'Intra-state' | 'Inter-state';

export interface Invoice extends BaseEntity {
  invoiceNumber: string; // Auto: SS/INV/2025/001
  invoiceType: InvoiceType;
  projectId?: number;
  customerId: number;
  status: InvoiceStatus;
  
  invoiceDate: Date;
  dueDate?: Date;
  paymentTerms?: string;
  
  // Billing details
  billingAddress: Address;
  shippingAddress?: Address;
  placeOfSupply: string; // State name
  
  // GST Details
  gstType: GSTType;
  companyGSTIN: string;
  customerGSTIN?: string;
  reverseCharge: boolean;
  
  // Pricing
  subtotal: number;
  discountAmount?: number;
  taxableAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalGST: number;
  tcs?: number; // Tax Collected at Source
  roundOff?: number;
  grandTotal: number;
  grandTotalInWords?: string;
  
  // Payment tracking
  amountPaid?: number;
  balanceAmount?: number;
  
  // Additional
  branchId?: number;
  generatedBy?: number; // User ID
  approvedBy?: number;
  sentDate?: Date;
  termsAndConditions?: string;
  notes?: string;
  eInvoiceIRN?: string; // E-invoice reference (future)
  eInvoiceAckNo?: string;
  eInvoiceAckDate?: Date;
}

export interface InvoiceItem {
  id?: number;
  invoiceId: number;
  itemId?: number;
  lineNumber: number;
  itemName: string;
  description?: string;
  hsnCode?: string;
  sacCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  discountPercent?: number;
  taxableAmount: number;
  gstRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
}

// ==================== PAYMENT & FINANCE ====================

export type PaymentMode = 'Cash' | 'UPI' | 'NEFT' | 'RTGS' | 'Cheque' | 'Finance' | 'Card';
export type PaymentStage = 'Booking' | 'Material' | 'Installation' | 'Final' | 'Other';
export type PaymentStatus = 'Not Due' | 'Due' | 'Partially Received' | 'Received' | 'Bounced';

export interface Payment extends BaseEntity {
  paymentId: string; // Auto: PAY-2025-001
  projectId: number;
  invoiceId?: number;
  customerId: number;
  
  paymentStage: PaymentStage;
  paymentMode: PaymentMode;
  amount: number;
  paymentDate: Date;
  
  // Transaction details
  referenceNumber?: string; // UPI Ref, Cheque No, Transaction ID
  bankName?: string;
  accountNumber?: string;
  upiId?: string;
  
  // Cheque details
  chequeNumber?: string;
  chequeDate?: Date;
  chequeClearanceDate?: Date;
  chequeStatus?: 'Pending' | 'Cleared' | 'Bounced';
  
  status: PaymentStatus;
  remarks?: string;
  receivedBy?: number; // User ID
  branchId?: number;
  receiptGenerated?: boolean;
  receiptNumber?: string;
}

export type FinanceStatus = 
  | 'Applied'
  | 'Document Pending'
  | 'Under Review'
  | 'Approved'
  | 'Partially Disbursed'
  | 'Fully Disbursed'
  | 'Rejected';

export interface FinanceApplication extends BaseEntity {
  applicationId: string; // Auto: FIN-2025-001
  projectId: number;
  customerId: number;
  
  financePartner: string; // Bajaj, IDFC, Bank name
  loanAmount: number;
  customerContribution?: number;
  interestRate?: number;
  tenure?: number; // in months
  
  status: FinanceStatus;
  applicationDate: Date;
  approvalDate?: Date;
  
  // Disbursement tracking
  firstDisbursementAmount?: number;
  firstDisbursementDate?: Date;
  secondDisbursementAmount?: number;
  secondDisbursementDate?: Date;
  
  totalDisbursed?: number;
  pendingDisbursement?: number;
  
  remarks?: string;
  rejectionReason?: string;
}

// ==================== INVENTORY & STOCK ====================

export type TransactionType = 
  | 'Purchase'
  | 'Sale'
  | 'Transfer to Site'
  | 'Return from Site'
  | 'Adjustment'
  | 'Damage'
  | 'Opening Stock';

export interface StockLedger extends BaseEntity {
  itemId: number;
  transactionType: TransactionType;
  quantity: number;
  unit: string;
  
  // References
  projectId?: number;
  supplierId?: number;
  referenceNumber?: string; // Bill No, Challan No
  
  transactionDate: Date;
  rate?: number;
  amount?: number;
  
  // Running balance
  balanceQuantity?: number;
  
  branchId?: number;
  performedBy?: number; // User ID
  remarks?: string;
}

export interface Supplier extends BaseEntity {
  supplierCode: string; // Auto: SUP001
  name: string;
  companyName?: string;
  gstin?: string;
  pan?: string;
  
  contactPerson?: string;
  mobile: string;
  email?: string;
  address?: Address;
  
  // Banking
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  
  // Business
  itemCategories?: string[]; // What items they supply
  paymentTerms?: string;
  creditDays?: number;
  
  status: Status;
  remarks?: string;
}

// ==================== WARRANTY & AMC ====================

export type WarrantyType = 'Panel' | 'Inverter' | 'Structure' | 'Installation' | 'Battery' | 'Other';

export interface Warranty {
  id?: number;
  projectId: number;
  customerId: number;
  warrantyType: WarrantyType;
  
  itemName?: string;
  brand?: string;
  serialNumber?: string;
  
  warrantyPeriod: number; // in years
  startDate: Date;
  endDate: Date;
  
  warrantyCardFile?: string; // File path
  termsAndConditions?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type AMCType = 'Comprehensive' | 'Cleaning Only' | 'Service Only';
export type AMCStatus = 'Active' | 'Expired' | 'Cancelled';
export type VisitFrequency = 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';

export interface AMCContract extends BaseEntity {
  amcNumber: string; // Auto: AMC-2025-001
  projectId: number;
  customerId: number;
  
  amcType: AMCType;
  status: AMCStatus;
  
  startDate: Date;
  endDate: Date;
  amcAmount: number;
  amountPaid?: number;
  
  visitFrequency: VisitFrequency;
  numberOfVisits?: number;
  completedVisits?: number;
  
  scope?: string;
  termsAndConditions?: string;
  
  renewalReminder?: boolean;
  remarks?: string;
}

// ==================== SERVICE & COMPLAINT ====================

export type IssueType = 
  | 'Inverter Error'
  | 'Low Generation'
  | 'Panel Cleaning'
  | 'Wiring Issue'
  | 'Earthing Problem'
  | 'MCB Trip'
  | 'Display Issue'
  | 'Other';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'Assigned' | 'In-progress' | 'Resolved' | 'Closed' | 'Reopened';

export interface ServiceTicket extends BaseEntity {
  ticketNumber: string; // Auto: TKT-2025-001
  projectId?: number;
  customerId: number;
  
  issueType: IssueType;
  issueDescription: string;
  priority: Priority;
  status: TicketStatus;
  
  reportedBy?: string; // Customer name/mobile
  reportedDate: Date;
  
  assignedTo?: number; // Technician User ID
  assignedDate?: Date;
  
  visitDate?: Date;
  workDoneReport?: string;
  resolutionNotes?: string;
  
  photos?: string[]; // File paths
  sparesUsed?: { itemId: number; quantity: number }[];
  
  closedBy?: number;
  closedDate?: Date;
  
  customerRating?: number; // 1-5
  customerFeedback?: string;
  
  branchId?: number;
  remarks?: string;
}

// ==================== NOTIFICATIONS ====================

export type NotificationType = 
  | 'Payment Reminder'
  | 'AMC Reminder'
  | 'Service Reminder'
  | 'Warranty Expiry'
  | 'Lead Follow-up'
  | 'Task Assignment'
  | 'Stage Completion'
  | 'System Alert';

export type NotificationStatus = 'Pending' | 'Sent' | 'Failed' | 'Read';
export type NotificationChannel = 'SMS' | 'Email' | 'WhatsApp' | 'In-app';

export interface Notification {
  id?: number;
  userId?: number;
  customerId?: number;
  
  type: NotificationType;
  title: string;
  message: string;
  
  channel: NotificationChannel[];
  status: NotificationStatus;
  
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  
  // References
  leadId?: number;
  projectId?: number;
  invoiceId?: number;
  ticketId?: number;
  
  createdAt: Date;
  retryCount?: number;
  errorMessage?: string;
}

// ==================== BRANCH (Multi-location) ====================

export interface Branch extends BaseEntity {
  code: string; // HQ, MUM, PNE
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  gstin?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  
  status: Status;
}

// ==================== AUDIT LOG ====================

export type AuditAction = 
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Login'
  | 'Logout'
  | 'Export'
  | 'Approve'
  | 'Reject'
  | 'Error';

export interface AuditLog {
  id?: number;
  userId?: number;
  module: string; // 'customers', 'invoices', 'payments'
  action: AuditAction;
  recordId?: number;

  // Enterprise: explicit entity tracking (optional, backwards compatible)
  entity?: string; // e.g. 'PayrollRun', 'SalarySheet', 'Attendance', 'Leave'
  entityId?: number;
  reason?: string; // required for high-risk actions like unlock/override
  
  oldValue?: string; // JSON string
  newValue?: string; // JSON string
  
  ipAddress?: string;
  userAgent?: string;
  
  timestamp: Date;
  branchId?: number;
}

// ==================== SETTINGS & CONFIGURATION ====================

export interface CompanySettings {
  id?: number;
  companyName: string;
  logo?: string;
  gstin: string;
  pan: string;
  address: Address;
  mobile: string;
  email: string;
  website?: string;
  
  // Invoice settings
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  quotationPrefix?: string;
  
  // Payment terms
  defaultPaymentTerms?: string;
  defaultPaymentStructure?: {
    advance: number;
    secondPayment: number;
    final: number;
  };
  
  // GST
  defaultGSTRate?: number;
  
  // Notifications
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
  
  updatedAt: Date;
}

export interface PaymentTerm {
  id?: number;
  name: string; // '40-50-10', '30-65-5'
  structure: {
    stage: PaymentStage;
    percentage: number;
  }[];
  isDefault: boolean;
  createdAt: Date;
}
