/**
 * Customers Service
 * Business logic for customer management
 */

import { db } from './database';
import type { Customer } from '@/types';

export const customersService = {
  /**
   * Generate unique customer ID
   * Format: CUST-YYYY-NNN (e.g., CUST-2025-001)
   */
  async generateCustomerId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CUST-${year}-`;
    
    // Get all customer IDs for current year
    const customers = await db.customers
      .filter(c => c.customerId?.startsWith(prefix) ?? false)
      .toArray();
    
    // Extract sequence numbers and find the highest
    const sequences = customers
      .map(c => parseInt(c.customerId?.split('-')[2] || '0'))
      .filter(n => !isNaN(n));
    
    const nextSequence = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
    
    // Pad with zeros (e.g., 001, 002, ...)
    return `${prefix}${String(nextSequence).padStart(3, '0')}`;
  },

  /**
   * Create new customer
   */
  async createCustomer(data: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const customerId = await this.generateCustomerId();
    
    const customer: Omit<Customer, 'id'> = {
      ...data,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return await db.customers.add(customer) as number;
  },

  /**
   * Get all customers with optional filters
   */
  async getCustomers(filters?: {
    searchTerm?: string;
    city?: string;
    state?: string;
  }): Promise<Customer[]> {
    let query = db.customers.toCollection();
    
    const customers = await query.toArray();
    
    // Apply filters
    let filtered = customers;
    
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.customerId?.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.mobile.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }
    
    if (filters?.city) {
      filtered = filtered.filter(c => 
        c.address.city.toLowerCase() === filters.city!.toLowerCase()
      );
    }
    
    if (filters?.state) {
      filtered = filtered.filter(c => 
        c.address.state.toLowerCase() === filters.state!.toLowerCase()
      );
    }
    
    return filtered;
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(id: number): Promise<Customer | undefined> {
    return await db.customers.get(id);
  },

  /**
   * Get customer by customerId (CUST-YYYY-NNN)
   */
  async getCustomerByCustomerId(customerId: string): Promise<Customer | undefined> {
    return await db.customers.where('customerId').equals(customerId).first();
  },

  /**
   * Update customer
   */
  async updateCustomer(id: number, data: Partial<Omit<Customer, 'id' | 'customerId' | 'createdAt'>>): Promise<void> {
    await db.customers.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  },

  /**
   * Delete customer (only if no related records)
   */
  async deleteCustomer(id: number): Promise<{ success: boolean; message?: string }> {
    // Check for related leads
    const leads = await db.leads.where('customerId').equals(id).count();
    if (leads > 0) {
      return {
        success: false,
        message: `Cannot delete customer with ${leads} associated lead(s)`,
      };
    }

    // Check for related surveys
    const surveys = await db.surveys.where('customerId').equals(id).count();
    if (surveys > 0) {
      return {
        success: false,
        message: `Cannot delete customer with ${surveys} associated survey(s)`,
      };
    }

    // Check for related quotations
    const quotations = await db.quotations.where('customerId').equals(id).count();
    if (quotations > 0) {
      return {
        success: false,
        message: `Cannot delete customer with ${quotations} associated quotation(s)`,
      };
    }

    // Check for related projects
    const projects = await db.projects.where('customerId').equals(id).count();
    if (projects > 0) {
      return {
        success: false,
        message: `Cannot delete customer with ${projects} associated project(s)`,
      };
    }

    // Safe to delete
    await db.customers.delete(id);
    
    // Also delete customer documents
    await db.customerDocuments.where('customerId').equals(id).delete();
    
    return { success: true };
  },

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    total: number;
    withLeads: number;
    withProjects: number;
    byCity: { city: string; count: number }[];
    byState: { state: string; count: number }[];
    recentCustomers: Customer[];
  }> {
    const customers = await db.customers.toArray();
    const leads = await db.leads.toArray();
    const projects = await db.projects.toArray();

    // Count customers with leads
    const customerIdsWithLeads = new Set(leads.map(l => l.customerId));
    const withLeads = customers.filter(c => c.id && customerIdsWithLeads.has(c.id)).length;

    // Count customers with projects
    const customerIdsWithProjects = new Set(projects.map(p => p.customerId));
    const withProjects = customers.filter(c => c.id && customerIdsWithProjects.has(c.id)).length;

    // Group by city
    const cityGroups = customers.reduce((acc, c) => {
      const city = c.address.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCity = Object.entries(cityGroups)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by state
    const stateGroups = customers.reduce((acc, c) => {
      const state = c.address.state;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byState = Object.entries(stateGroups)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    // Recent customers (last 10)
    const recentCustomers = customers
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      total: customers.length,
      withLeads,
      withProjects,
      byCity,
      byState,
      recentCustomers,
    };
  },

  /**
   * Get customer with related data
   */
  async getCustomerWithRelatedData(id: number): Promise<{
    customer: Customer;
    leads: any[];
    surveys: any[];
    quotations: any[];
    projects: any[];
    documents: any[];
  } | null> {
    const customer = await db.customers.get(id);
    if (!customer) return null;

    const [leads, quotations, projects, documents] = await Promise.all([
      db.leads.where('customerId').equals(id).toArray(),
      db.quotations.where('customerId').equals(id).toArray(),
      db.projects.where('customerId').equals(id).toArray(),
      db.customerDocuments.where('customerId').equals(id).toArray(),
    ]);

    // Get surveys through leads (surveys are linked to leadId, not customerId)
    const leadIds = leads.map(l => l.id).filter(Boolean) as number[];
    const surveys = leadIds.length > 0 
      ? await db.surveys.where('leadId').anyOf(leadIds).toArray()
      : [];

    return {
      customer,
      leads,
      surveys,
      quotations,
      projects,
      documents,
    };
  },

  /**
   * Check if mobile number is already registered
   */
  async isMobileRegistered(mobile: string, excludeCustomerId?: number): Promise<boolean> {
    const customers = await db.customers.where('mobile').equals(mobile).toArray();
    
    if (excludeCustomerId) {
      return customers.some(c => c.id !== excludeCustomerId);
    }
    
    return customers.length > 0;
  },

  /**
   * Search customers by name or mobile
   */
  async searchCustomers(term: string, limit: number = 10): Promise<Customer[]> {
    const searchTerm = term.toLowerCase();
    const customers = await db.customers.toArray();
    
    return customers
      .filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.mobile.includes(searchTerm) ||
        c.customerId?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  },
};
