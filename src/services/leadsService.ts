/**
 * Leads Service
 * Business logic for lead management
 */

import { db } from '@/services/database';
import type { Lead, Customer } from '@/types';

class LeadsService {
  /**
   * Generate next lead ID
   */
  private async generateLeadId(): Promise<string> {
    const year = new Date().getFullYear();
    const leads = await db.leads
      .where('leadId')
      .startsWith(`LEAD-${year}`)
      .toArray();
    
    const nextNumber = leads.length + 1;
    return `LEAD-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Create new lead
   */
  async createLead(leadData: Omit<Lead, 'id' | 'leadId' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const leadId = await this.generateLeadId();
    
    const lead: Lead = {
      ...leadData,
      leadId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.leads.add(lead);
    return { ...lead, id };
  }

  /**
   * Get all leads with optional filters
   */
  async getLeads(filters?: {
    status?: string;
    source?: string;
    assignedTo?: number;
    branchId?: number;
    fromDate?: Date;
    toDate?: Date;
    searchTerm?: string;
  }): Promise<Lead[]> {
    let leads = await db.leads.toArray();

    // Apply filters
    if (filters) {
      if (filters.status) {
        leads = leads.filter(l => l.status === filters.status);
      }
      if (filters.source) {
        leads = leads.filter(l => l.source === filters.source);
      }
      if (filters.assignedTo) {
        leads = leads.filter(l => l.assignedTo === filters.assignedTo);
      }
      if (filters.branchId) {
        leads = leads.filter(l => l.branchId === filters.branchId);
      }
      if (filters.fromDate) {
        leads = leads.filter(l => new Date(l.createdAt) >= filters.fromDate!);
      }
      if (filters.toDate) {
        leads = leads.filter(l => new Date(l.createdAt) <= filters.toDate!);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        leads = leads.filter(l => 
          l.leadId.toLowerCase().includes(term)
        );
      }
    }

    // Sort by created date (newest first)
    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return leads;
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: number): Promise<Lead | undefined> {
    return await db.leads.get(id);
  }

  /**
   * Get lead with customer details
   */
  async getLeadWithCustomer(id: number): Promise<{ lead: Lead; customer: Customer } | null> {
    const lead = await db.leads.get(id);
    if (!lead) return null;

    const customer = await db.customers.get(lead.customerId);
    if (!customer) return null;

    return { lead, customer };
  }

  /**
   * Update lead
   */
  async updateLead(id: number, updates: Partial<Lead>): Promise<void> {
    await db.leads.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete lead
   */
  async deleteLead(id: number): Promise<void> {
    await db.leads.delete(id);
  }

  /**
   * Convert lead to customer (mark as converted)
   */
  async convertLead(id: number): Promise<void> {
    await db.leads.update(id, {
      status: 'Converted',
      updatedAt: new Date(),
    });
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<{
    total: number;
    new: number;
    inProgress: number;
    converted: number;
    lost: number;
    onHold: number;
    conversionRate: number;
  }> {
    const leads = await db.leads.toArray();
    
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      inProgress: leads.filter(l => l.status === 'In-progress').length,
      converted: leads.filter(l => l.status === 'Converted').length,
      lost: leads.filter(l => l.status === 'Lost').length,
      onHold: leads.filter(l => l.status === 'On-hold').length,
      conversionRate: 0,
    };

    // Calculate conversion rate
    if (stats.total > 0) {
      stats.conversionRate = (stats.converted / stats.total) * 100;
    }

    return stats;
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await db.leads.where('status').equals(status).toArray();
  }

  /**
   * Get leads assigned to user
   */
  async getMyLeads(userId: number): Promise<Lead[]> {
    return await db.leads.where('assignedTo').equals(userId).toArray();
  }

  /**
   * Get upcoming follow-ups
   */
  async getUpcomingFollowUps(userId?: number): Promise<Lead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    let leads = await db.leads
      .where('followUpDate')
      .between(today, nextWeek)
      .toArray();

    if (userId) {
      leads = leads.filter(l => l.assignedTo === userId);
    }

    return leads.sort((a, b) => 
      new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()
    );
  }

  /**
   * Get overdue follow-ups
   */
  async getOverdueFollowUps(userId?: number): Promise<Lead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let leads = await db.leads.toArray();
    
    leads = leads.filter(l => 
      l.followUpDate && 
      new Date(l.followUpDate) < today &&
      l.status !== 'Converted' &&
      l.status !== 'Lost'
    );

    if (userId) {
      leads = leads.filter(l => l.assignedTo === userId);
    }

    return leads;
  }

  /**
   * Get lead source distribution
   */
  async getLeadSourceDistribution(): Promise<Record<string, number>> {
    const leads = await db.leads.toArray();
    const distribution: Record<string, number> = {};

    leads.forEach(lead => {
      distribution[lead.source] = (distribution[lead.source] || 0) + 1;
    });

    return distribution;
  }
}

export const leadsService = new LeadsService();
