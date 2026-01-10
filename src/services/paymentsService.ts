import { db } from './database';
import { projectsService } from './projectsService';
import type { Payment, PaymentMode, PaymentStatus } from '@/types/extended';

export const paymentsService = {
  async generatePaymentId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;
    const existing = await db.payments.filter(p => p.paymentId?.startsWith(prefix)).toArray();
    const max = existing.reduce((m, p) => {
      const match = p.paymentId?.match(/PAY-\d{4}-(\d+)/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  },

  async createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'paymentId'>): Promise<number> {
    // Validate payment data
    if (!this.validateAmount(data.amount)) {
      throw new Error('Invalid payment amount');
    }
    if (!this.validateMode(data.paymentMode)) {
      throw new Error('Invalid payment mode');
    }

    const paymentId = await this.generatePaymentId();
    const payment: Omit<Payment, 'id'> = { ...data, paymentId, createdAt: new Date(), updatedAt: new Date() };
    const id = await db.payments.add(payment) as number;

    // If linked to invoice, update invoice payment
    if (payment.invoiceId) {
      try {
        const invoice = await db.invoices.get(payment.invoiceId);
        if (invoice) {
          const newPaid = (invoice.amountPaid || 0) + payment.amount;
          const balance = invoice.grandTotal - newPaid;
          
          // Prevent overpayment
          if (balance < -0.01) { // Allow small rounding tolerance
            await db.payments.delete(id);
            throw new Error('Payment amount exceeds invoice balance');
          }
          
          await db.invoices.update(invoice.id!, {
            amountPaid: newPaid,
            balanceAmount: Math.max(0, balance),
            status: balance <= 0.01 ? 'Paid' : 'Partially Paid',
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        // Rollback payment if invoice update fails
        await db.payments.delete(id);
        throw err;
      }
    }

    // Sync project totals and schedule
    if (payment.projectId) {
      await projectsService.syncPaymentsAndSchedule(payment.projectId);
    }

    return id;
  },

  async updatePayment(id: number, data: Partial<Payment>): Promise<void> {
    await db.payments.update(id, { ...data, updatedAt: new Date() });
  },

  async deletePayment(id: number): Promise<void> {
    const payment = await db.payments.get(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment?.invoiceId) {
      const invoice = await db.invoices.get(payment.invoiceId);
      if (invoice) {
        const newPaid = Math.max(0, (invoice.amountPaid || 0) - payment.amount);
        const balance = invoice.grandTotal - newPaid;
        await db.invoices.update(invoice.id!, {
          amountPaid: newPaid,
          balanceAmount: balance,
          status: balance >= invoice.grandTotal ? 'Generated' : newPaid > 0 ? 'Partially Paid' : 'Paid',
          updatedAt: new Date(),
        });
      }
    }
    await db.payments.delete(id);
    if (payment.projectId) {
      await projectsService.syncPaymentsAndSchedule(payment.projectId);
    }
  },

  async getPaymentStats(): Promise<{
    totalCollected: number;
    receivedCount: number;
    pendingCount: number;
    bouncedCount: number;
    byMode: Record<string, number>;
  }> {
    const payments = await db.payments.toArray();
    const stats = {
      totalCollected: payments.reduce((sum, p) => sum + p.amount, 0),
      receivedCount: payments.filter(p => p.status === 'Received').length,
      pendingCount: payments.filter(p => p.status === 'Due' || p.status === 'Not Due' || p.status === 'Partially Received').length,
      bouncedCount: payments.filter(p => p.status === 'Bounced').length,
      byMode: {} as Record<string, number>,
    };

    payments.forEach(p => {
      stats.byMode[p.paymentMode] = (stats.byMode[p.paymentMode] || 0) + p.amount;
    });

    return stats;
  },

  async getPayments(): Promise<Payment[]> {
    const list = await db.payments.toArray();
    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  },

  async getPaymentById(id: number): Promise<Payment | undefined> {
    return db.payments.get(id);
  },

  validateAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount);
  },

  validateMode(mode: PaymentMode): boolean {
    return ['Cash','UPI','NEFT','RTGS','Cheque','Finance','Card'].includes(mode);
  },

  suggestStatusForInvoicePayment(invoiceGrandTotal: number, existingPaid: number): PaymentStatus {
    const progress = (existingPaid / invoiceGrandTotal) * 100;
    if (progress <= 0) return 'Due';
    if (progress >= 100) return 'Received';
    return 'Partially Received';
  },
};
