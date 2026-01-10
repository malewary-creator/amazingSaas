/**
 * Quotations Service
 * Business logic for quotation and line items management
 */

import { db } from './database';
import type { Quotation, QuotationStatus, QuotationItem } from '@/types';

export const quotationsService = {
  /**
   * Generate quotation number in format QUO-YYYY-NNN
   */
  async generateQuotationNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `QUO-${year}-`;
    
    const existingQuotations = await db.quotations
      .filter(q => q.quotationNumber?.startsWith(prefix))
      .toArray();
    
    const maxNumber = existingQuotations.reduce((max, quotation) => {
      const match = quotation.quotationNumber?.match(/QUO-\d{4}-(\d+)/);
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
   * Calculate line item amounts
   */
  calculateLineItemAmounts(
    quantity: number,
    unitPrice: number,
    discount: number = 0,
    gstRate: number = 18
  ): {
    taxableAmount: number;
    gstAmount: number;
    totalAmount: number;
  } {
    const grossAmount = quantity * unitPrice;
    const discountAmount = (grossAmount * discount) / 100;
    const taxableAmount = grossAmount - discountAmount;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = taxableAmount + gstAmount;
    
    return {
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  },

  /**
   * Calculate quotation totals from line items
   */
  calculateQuotationTotals(
    items: QuotationItem[],
    discountPercent: number = 0,
    isIGST: boolean = false
  ): {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGST: number;
    roundOff: number;
    grandTotal: number;
  } {
    // Calculate subtotal (sum of all taxable amounts before quotation-level discount)
    const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    
    // Apply quotation-level discount
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    
    // Calculate GST
    const totalGST = items.reduce((sum, item) => sum + item.gstAmount, 0);
    
    // Apply discount proportionally to GST as well
    const adjustedGST = discountPercent > 0 
      ? totalGST * (1 - discountPercent / 100)
      : totalGST;
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    if (isIGST) {
      igst = adjustedGST;
    } else {
      cgst = adjustedGST / 2;
      sgst = adjustedGST / 2;
    }
    
    // Calculate grand total
    const exactTotal = taxableAmount + adjustedGST;
    const roundedTotal = Math.round(exactTotal);
    const roundOff = roundedTotal - exactTotal;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalGST: Math.round(adjustedGST * 100) / 100,
      roundOff: Math.round(roundOff * 100) / 100,
      grandTotal: roundedTotal,
    };
  },

  /**
   * Create new quotation with line items
   */
  async createQuotation(
    data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>,
    items: Omit<QuotationItem, 'id' | 'quotationId'>[]
  ): Promise<number> {
    const quotationNumber = await this.generateQuotationNumber();
    
    const quotation: Omit<Quotation, 'id'> = {
      ...data,
      quotationNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const quotationId = await db.quotations.add(quotation) as number;
    
    // Add line items
    if (items.length > 0) {
      const itemsWithQuotationId = items.map(item => ({
        ...item,
        quotationId,
      }));
      await db.quotationItems.bulkAdd(itemsWithQuotationId);
    }
    
    return quotationId;
  },

  /**
   * Get all quotations with optional filters
   */
  async getQuotations(filters?: {
    status?: QuotationStatus;
    leadId?: number;
    customerId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Quotation[]> {
    let query = db.quotations.toCollection();
    
    let quotations = await query.toArray();
    
    // Apply filters
    if (filters?.status) {
      quotations = quotations.filter(q => q.status === filters.status);
    }
    
    if (filters?.leadId) {
      quotations = quotations.filter(q => q.leadId === filters.leadId);
    }
    
    if (filters?.customerId) {
      quotations = quotations.filter(q => q.customerId === filters.customerId);
    }
    
    if (filters?.startDate) {
      quotations = quotations.filter(q => 
        new Date(q.quotationDate) >= filters.startDate!
      );
    }
    
    if (filters?.endDate) {
      quotations = quotations.filter(q => 
        new Date(q.quotationDate) <= filters.endDate!
      );
    }
    
    return quotations;
  },

  /**
   * Get quotation by ID
   */
  async getQuotationById(id: number): Promise<Quotation | undefined> {
    return await db.quotations.get(id);
  },

  /**
   * Get quotation with all related data
   */
  async getQuotationWithDetails(id: number): Promise<any> {
    const quotation = await db.quotations.get(id);
    if (!quotation) return null;

    const lead = await db.leads.get(quotation.leadId);
    const customer = quotation.customerId ? await db.customers.get(quotation.customerId) : null;
    const preparedBy = quotation.preparedBy ? await db.users.get(quotation.preparedBy) : null;
    const approvedBy = quotation.approvedBy ? await db.users.get(quotation.approvedBy) : null;
    
    // Get line items
    const items = await db.quotationItems
      .where('quotationId')
      .equals(id)
      .sortBy('lineNumber');

    return {
      ...quotation,
      leadId: lead?.leadId,
      customerName: customer?.name,
      customerMobile: customer?.mobile,
      customerEmail: customer?.email,
      customerAddress: customer?.address,
      customerCity: customer?.address?.city,
      customerState: customer?.address?.state,
      preparedByName: preparedBy?.name,
      approvedByName: approvedBy?.name,
      items,
    };
  },

  /**
   * Update quotation
   */
  async updateQuotation(
    id: number,
    data: Partial<Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>>,
    items?: Omit<QuotationItem, 'id' | 'quotationId'>[]
  ): Promise<void> {
    await db.quotations.update(id, {
      ...data,
      updatedAt: new Date(),
    });
    
    // Update line items if provided
    if (items) {
      // Delete existing items
      await db.quotationItems.where('quotationId').equals(id).delete();
      
      // Add new items
      const itemsWithQuotationId = items.map(item => ({
        ...item,
        quotationId: id,
      }));
      await db.quotationItems.bulkAdd(itemsWithQuotationId);
    }
  },

  /**
   * Delete quotation and all line items
   */
  async deleteQuotation(id: number): Promise<void> {
    // Delete all line items first
    await db.quotationItems.where('quotationId').equals(id).delete();
    // Delete quotation
    await db.quotations.delete(id);
  },

  /**
   * Get quotation statistics
   */
  async getQuotationStats(): Promise<{
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    totalValue: number;
    acceptedValue: number;
    acceptanceRate: number;
  }> {
    const quotations = await db.quotations.toArray();
    
    const stats = {
      total: quotations.length,
      draft: quotations.filter(q => q.status === 'Draft').length,
      sent: quotations.filter(q => q.status === 'Sent').length,
      accepted: quotations.filter(q => q.status === 'Accepted').length,
      rejected: quotations.filter(q => q.status === 'Rejected').length,
      expired: quotations.filter(q => q.status === 'Expired').length,
      totalValue: quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0),
      acceptedValue: quotations
        .filter(q => q.status === 'Accepted')
        .reduce((sum, q) => sum + (q.grandTotal || 0), 0),
      acceptanceRate: 0,
    };
    
    if (stats.sent + stats.accepted + stats.rejected > 0) {
      stats.acceptanceRate = Math.round(
        (stats.accepted / (stats.sent + stats.accepted + stats.rejected)) * 100
      );
    }
    
    return stats;
  },

  /**
   * Get line items for a quotation
   */
  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    return await db.quotationItems
      .where('quotationId')
      .equals(quotationId)
      .sortBy('lineNumber');
  },

  /**
   * Update quotation status
   */
  async updateQuotationStatus(
    id: number,
    status: QuotationStatus,
    additionalData?: { acceptedDate?: Date; rejectionReason?: string }
  ): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    
    if (status === 'Sent') {
      updates.sentDate = new Date();
    } else if (status === 'Accepted') {
      updates.acceptedDate = additionalData?.acceptedDate || new Date();
    } else if (status === 'Rejected' && additionalData?.rejectionReason) {
      updates.rejectionReason = additionalData.rejectionReason;
    }
    
    await db.quotations.update(id, updates);
  },

  /**
   * Send quotation to customer
   */
  async sendQuotation(id: number): Promise<void> {
    await this.updateQuotationStatus(id, 'Sent');
  },

  /**
   * Accept quotation
   */
  async acceptQuotation(id: number): Promise<void> {
    await this.updateQuotationStatus(id, 'Accepted', {
      acceptedDate: new Date(),
    });
  },

  /**
   * Reject quotation
   */
  async rejectQuotation(id: number, reason: string): Promise<void> {
    await this.updateQuotationStatus(id, 'Rejected', {
      rejectionReason: reason,
    });
  },

  /**
   * Mark quotation as expired
   */
  async markAsExpired(id: number): Promise<void> {
    await this.updateQuotationStatus(id, 'Expired');
  },

  /**
   * Check and update expired quotations
   */
  async checkExpiredQuotations(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const quotations = await db.quotations
      .filter(q => 
        (q.status === 'Sent' || q.status === 'Draft') &&
        q.validityDate &&
        new Date(q.validityDate) < today
      )
      .toArray();
    
    for (const quotation of quotations) {
      await this.markAsExpired(quotation.id!);
    }
    
    return quotations.length;
  },

  /**
   * Get quotations by status
   */
  async getQuotationsByStatus(status: QuotationStatus): Promise<Quotation[]> {
    return await db.quotations.where('status').equals(status).toArray();
  },

  /**
   * Get quotations by customer
   */
  async getQuotationsByCustomer(customerId: number): Promise<Quotation[]> {
    return await db.quotations.where('customerId').equals(customerId).toArray();
  },

  /**
   * Duplicate quotation
   */
  async duplicateQuotation(id: number): Promise<number> {
    const original = await this.getQuotationWithDetails(id);
    if (!original) throw new Error('Quotation not found');
    
    // Remove original ID and quotation number
    const { id: _, quotationNumber: __, items, createdAt: ___, updatedAt: ____, ...quotationData } = original;
    
    // Create new quotation with 'Draft' status
    const newQuotationData = {
      ...quotationData,
      status: 'Draft' as QuotationStatus,
      quotationDate: new Date(),
      sentDate: undefined,
      acceptedDate: undefined,
    };
    
    // Remove quotation-specific fields from items
    const newItems = items.map(({ id: _id, quotationId: _qid, ...item }: any) => item);
    
    return await this.createQuotation(newQuotationData, newItems);
  },
};
