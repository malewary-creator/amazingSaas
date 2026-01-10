/**
 * Invoices Service
 * Business logic for GST-compliant invoice generation and management
 */

import { db } from './database';
import type { Invoice, InvoiceStatus, InvoiceType, InvoiceItem } from '@/types/extended';

export const invoicesService = {
  /**
   * Validate GSTIN format (15 chars: 2-digit state code + PAN + entity + checksum)
   */
  validateGSTIN(gstin: string): boolean {
    if (!gstin) return false;
    const upper = gstin.toUpperCase().trim();
    // Basic structure check: 15 alphanumeric, starts with 2 digits (state code)
    const re = /^[0-9]{2}[A-Z0-9]{13}$/;
    return re.test(upper);
  },
  /**
   * Generate invoice number in format SS/INV/YYYY/NNN
   */
  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `SS/INV/${year}/`;
    
    const existingInvoices = await db.invoices
      .filter(inv => inv.invoiceNumber?.startsWith(prefix))
      .toArray();
    
    const maxNumber = existingInvoices.reduce((max, invoice) => {
      const match = invoice.invoiceNumber?.match(/SS\/INV\/\d{4}\/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${prefix}${nextNumber}`;
  },

  /**
   * Convert number to words (Indian format)
   * Example: 125000 => "One Lakh Twenty Five Thousand Only"
   */
  convertToWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero Rupees Only';
    
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    
    let words = '';
    
    // Crores
    const crores = Math.floor(integerPart / 10000000);
    if (crores > 0) {
      words += this.convertBelowThousand(crores, ones, teens, tens) + ' Crore ';
    }
    
    // Lakhs
    const lakhs = Math.floor((integerPart % 10000000) / 100000);
    if (lakhs > 0) {
      words += this.convertBelowThousand(lakhs, ones, teens, tens) + ' Lakh ';
    }
    
    // Thousands
    const thousands = Math.floor((integerPart % 100000) / 1000);
    if (thousands > 0) {
      words += this.convertBelowThousand(thousands, ones, teens, tens) + ' Thousand ';
    }
    
    // Hundreds
    const remainder = integerPart % 1000;
    if (remainder > 0) {
      words += this.convertBelowThousand(remainder, ones, teens, tens);
    }
    
    words = words.trim() + ' Rupees';
    
    if (decimalPart > 0) {
      words += ' and ' + this.convertBelowThousand(decimalPart, ones, teens, tens) + ' Paise';
    }
    
    return words + ' Only';
  },

  /**
   * Helper function to convert numbers below 1000
   */
  convertBelowThousand(num: number, ones: string[], teens: string[], tens: string[]): string {
    if (num === 0) return '';
    
    let result = '';
    
    // Hundreds
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    // Tens and ones
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result.trim();
  },

  /**
   * Calculate line item amounts
   */
  calculateLineItemAmounts(
    quantity: number,
    unitPrice: number,
    discountPercent: number = 0,
    gstRate: number = 18
  ): {
    taxableAmount: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
  } {
    const grossAmount = quantity * unitPrice;
    const discountAmount = (grossAmount * discountPercent) / 100;
    const taxableAmount = grossAmount - discountAmount;
    const gstAmount = (taxableAmount * gstRate) / 100;
    
    // For now, assume intra-state (CGST/SGST)
    // This should be determined by customer state vs company state
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const igst = 0;
    
    const totalAmount = taxableAmount + gstAmount;
    
    return {
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  },

  /**
   * Calculate invoice totals from line items
   */
  calculateInvoiceTotals(
    items: InvoiceItem[],
    isIGST: boolean = false,
    tcsRate: number = 0
  ): {
    subtotal: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGST: number;
    tcs: number;
    roundOff: number;
    grandTotal: number;
    grandTotalInWords: string;
  } {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    const taxableAmount = subtotal;
    
    // Calculate GST
    const totalGST = items.reduce((sum, item) => {
      const itemGST = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
      return sum + itemGST;
    }, 0);
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    if (isIGST) {
      igst = totalGST;
    } else {
      cgst = totalGST / 2;
      sgst = totalGST / 2;
    }
    
    // Calculate TCS (Tax Collected at Source) if applicable
    const tcs = tcsRate > 0 ? (taxableAmount * tcsRate) / 100 : 0;
    
    // Calculate grand total
    const exactTotal = taxableAmount + totalGST + tcs;
    const roundedTotal = Math.round(exactTotal);
    const roundOff = roundedTotal - exactTotal;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      tcs: Math.round(tcs * 100) / 100,
      roundOff: Math.round(roundOff * 100) / 100,
      grandTotal: roundedTotal,
      grandTotalInWords: this.convertToWords(roundedTotal),
    };
  },

  /**
   * Create new invoice with line items
   */
  async createInvoice(
    data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
  ): Promise<number> {
    const invoiceNumber = await this.generateInvoiceNumber();
    
    const invoice: Omit<Invoice, 'id'> = {
      ...data,
      invoiceNumber,
      balanceAmount: data.grandTotal - (data.amountPaid || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const invoiceId = await db.invoices.add(invoice) as number;
    
    // Add line items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoiceId,
      }));
      await db.invoiceItems.bulkAdd(itemsWithInvoiceId);
    }
    
    return invoiceId;
  },

  /**
   * Get all invoices with optional filters
   */
  async getInvoices(filters?: {
    status?: InvoiceStatus;
    type?: InvoiceType;
    customerId?: number;
    projectId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Invoice[]> {
    let query = db.invoices.toCollection();
    
    let invoices = await query.toArray();
    
    // Apply filters
    if (filters?.status) {
      invoices = invoices.filter(inv => inv.status === filters.status);
    }
    
    if (filters?.type) {
      invoices = invoices.filter(inv => inv.invoiceType === filters.type);
    }
    
    if (filters?.customerId) {
      invoices = invoices.filter(inv => inv.customerId === filters.customerId);
    }
    
    if (filters?.projectId) {
      invoices = invoices.filter(inv => inv.projectId === filters.projectId);
    }
    
    if (filters?.startDate) {
      invoices = invoices.filter(inv => 
        new Date(inv.invoiceDate) >= filters.startDate!
      );
    }
    
    if (filters?.endDate) {
      invoices = invoices.filter(inv => 
        new Date(inv.invoiceDate) <= filters.endDate!
      );
    }
    
    return invoices;
  },

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    return await db.invoices.get(id);
  },

  /**
   * Get invoice with all related data
   */
  async getInvoiceWithDetails(id: number): Promise<any> {
    const invoice = await db.invoices.get(id);
    if (!invoice) return null;

    const customer = await db.customers.get(invoice.customerId);
    const project = invoice.projectId ? await db.projects.get(invoice.projectId) : null;
    const generatedBy = invoice.generatedBy ? await db.users.get(invoice.generatedBy) : null;
    const approvedBy = invoice.approvedBy ? await db.users.get(invoice.approvedBy) : null;
    
    // Get line items
    const items = await db.invoiceItems
      .where('invoiceId')
      .equals(id)
      .sortBy('lineNumber');

    return {
      ...invoice,
      customerName: customer?.name,
      customerMobile: customer?.mobile,
      customerEmail: customer?.email,
      customerAddress: customer?.address,
      projectName: project?.id,
      generatedByName: generatedBy?.name,
      approvedByName: approvedBy?.name,
      items,
    };
  },

  /**
   * Update invoice
   */
  async updateInvoice(
    id: number,
    data: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>>,
    items?: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
  ): Promise<void> {
    // Recalculate balance if payment changed
    if (data.amountPaid !== undefined && data.grandTotal !== undefined) {
      data.balanceAmount = data.grandTotal - data.amountPaid;
    }
    
    await db.invoices.update(id, {
      ...data,
      updatedAt: new Date(),
    });
    
    // Update line items if provided
    if (items) {
      // Delete existing items
      await db.invoiceItems.where('invoiceId').equals(id).delete();
      
      // Add new items
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoiceId: id,
      }));
      await db.invoiceItems.bulkAdd(itemsWithInvoiceId);
    }
  },

  /**
   * Delete invoice and all line items
   */
  async deleteInvoice(id: number): Promise<void> {
    // Delete all line items first
    await db.invoiceItems.where('invoiceId').equals(id).delete();
    // Delete invoice
    await db.invoices.delete(id);
  },

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(): Promise<{
    total: number;
    draft: number;
    generated: number;
    sent: number;
    paid: number;
    partiallyPaid: number;
    overdue: number;
    cancelled: number;
    totalValue: number;
    paidAmount: number;
    outstandingAmount: number;
    collectionRate: number;
  }> {
    const invoices = await db.invoices.toArray();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: invoices.length,
      draft: invoices.filter(inv => inv.status === 'Draft').length,
      generated: invoices.filter(inv => inv.status === 'Generated').length,
      sent: invoices.filter(inv => inv.status === 'Sent').length,
      paid: invoices.filter(inv => inv.status === 'Paid').length,
      partiallyPaid: invoices.filter(inv => inv.status === 'Partially Paid').length,
      overdue: invoices.filter(inv => inv.status === 'Overdue').length,
      cancelled: invoices.filter(inv => inv.status === 'Cancelled').length,
      totalValue: invoices
        .filter(inv => inv.status !== 'Cancelled')
        .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
      paidAmount: invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
      outstandingAmount: 0,
      collectionRate: 0,
    };
    
    stats.outstandingAmount = stats.totalValue - stats.paidAmount;
    
    if (stats.totalValue > 0) {
      stats.collectionRate = Math.round((stats.paidAmount / stats.totalValue) * 100);
    }
    
    return stats;
  },

  /**
   * Get invoice line items
   */
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.invoiceItems
      .where('invoiceId')
      .equals(invoiceId)
      .sortBy('lineNumber');
  },

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    id: number,
    status: InvoiceStatus,
    additionalData?: { sentDate?: Date }
  ): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    
    if (status === 'Sent' && additionalData?.sentDate) {
      updates.sentDate = additionalData.sentDate;
    }
    
    await db.invoices.update(id, updates);
  },

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: number, amount?: number): Promise<void> {
    const invoice = await this.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');
    
    const paidAmount = amount || invoice.grandTotal;
    const balanceAmount = invoice.grandTotal - paidAmount;
    
    await db.invoices.update(id, {
      status: balanceAmount === 0 ? 'Paid' : 'Partially Paid',
      amountPaid: paidAmount,
      balanceAmount,
      updatedAt: new Date(),
    });
  },

  /**
   * Record payment against invoice
   */
  async recordPayment(id: number, amount: number): Promise<void> {
    const invoice = await this.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');
    
    const currentPaid = invoice.amountPaid || 0;
    const newPaidAmount = currentPaid + amount;
    const balanceAmount = invoice.grandTotal - newPaidAmount;
    
    await db.invoices.update(id, {
      status: balanceAmount === 0 ? 'Paid' : 'Partially Paid',
      amountPaid: newPaidAmount,
      balanceAmount,
      updatedAt: new Date(),
    });
  },

  /**
   * Check and update overdue invoices
   */
  async checkOverdueInvoices(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const invoices = await db.invoices
      .filter(inv => {
        if (!inv.dueDate) return false;
        const isDueDatePassed = new Date(inv.dueDate) < today;
        const isUnpaidStatus = inv.status === 'Sent' || 
                              inv.status === 'Generated' || 
                              inv.status === 'Partially Paid';
        return isUnpaidStatus && isDueDatePassed;
      })
      .toArray();
    
    for (const invoice of invoices) {
      await this.updateInvoiceStatus(invoice.id!, 'Overdue');
    }
    
    return invoices.length;
  },

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return await db.invoices.where('status').equals(status).toArray();
  },

  /**
   * Get invoices by customer
   */
  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return await db.invoices.where('customerId').equals(customerId).toArray();
  },

  /**
   * Get invoices by project
   */
  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    return await db.invoices.where('projectId').equals(projectId).toArray();
  },

  /**
   * Duplicate invoice
   */
  async duplicateInvoice(id: number): Promise<number> {
    const original = await this.getInvoiceWithDetails(id);
    if (!original) throw new Error('Invoice not found');
    
    // Remove original ID and invoice number
    const { id: _, invoiceNumber: __, items, createdAt: ___, updatedAt: ____, ...invoiceData } = original;
    
    // Create new invoice with 'Draft' status
    const newInvoiceData = {
      ...invoiceData,
      status: 'Draft' as InvoiceStatus,
      invoiceDate: new Date(),
      sentDate: undefined,
      amountPaid: 0,
      balanceAmount: invoiceData.grandTotal,
    };
    
    // Remove invoice-specific fields from items
    const newItems = items.map(({ id: _id, invoiceId: _invId, ...item }: any) => item);
    
    return await this.createInvoice(newInvoiceData, newItems);
  },
};
