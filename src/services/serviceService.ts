import { db } from './database';
import type { ServiceTicket, IssueType, Priority, TicketStatus } from '@/types/extended';

export const serviceService = {
  // ==================== TICKET MANAGEMENT ====================
  
  async generateTicketNumber(): Promise<string> {
    const existing = await db.serviceTickets.toArray();
    const year = new Date().getFullYear();
    const thisYearTickets = existing.filter(t => 
      t.ticketNumber?.startsWith(`TKT-${year}`)
    );
    const max = thisYearTickets.reduce((m, ticket) => {
      const match = ticket.ticketNumber?.match(/TKT-\d{4}-(\d+)/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `TKT-${year}-${String(max + 1).padStart(3, '0')}`;
  },

  async createTicket(data: Omit<ServiceTicket, 'id' | 'createdAt' | 'updatedAt' | 'ticketNumber'>): Promise<number> {
    const ticketNumber = await this.generateTicketNumber();
    const ticket: Omit<ServiceTicket, 'id'> = {
      ...data,
      ticketNumber,
      status: data.status || 'Open',
      reportedDate: data.reportedDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.serviceTickets.add(ticket) as number;
  },

  async updateTicket(id: number, data: Partial<ServiceTicket>): Promise<void> {
    const ticket = await db.serviceTickets.get(id);
    if (!ticket) throw new Error('Ticket not found');

    // Auto-set dates based on status changes
    const updates: Partial<ServiceTicket> = { ...data, updatedAt: new Date() };
    
    if (data.status === 'Assigned' && !ticket.assignedDate) {
      updates.assignedDate = new Date();
    }
    
    if ((data.status === 'Closed' || data.status === 'Resolved') && !ticket.closedDate) {
      updates.closedDate = new Date();
    }

    await db.serviceTickets.update(id, updates);
  },

  async deleteTicket(id: number): Promise<void> {
    await db.serviceTickets.delete(id);
  },

  async getTickets(filters?: {
    status?: TicketStatus;
    priority?: Priority;
    issueType?: IssueType;
    customerId?: number;
    projectId?: number;
    assignedTo?: number;
  }): Promise<ServiceTicket[]> {
    let tickets = await db.serviceTickets.toArray();
    
    if (filters?.status) tickets = tickets.filter(t => t.status === filters.status);
    if (filters?.priority) tickets = tickets.filter(t => t.priority === filters.priority);
    if (filters?.issueType) tickets = tickets.filter(t => t.issueType === filters.issueType);
    if (filters?.customerId) tickets = tickets.filter(t => t.customerId === filters.customerId);
    if (filters?.projectId) tickets = tickets.filter(t => t.projectId === filters.projectId);
    if (filters?.assignedTo) tickets = tickets.filter(t => t.assignedTo === filters.assignedTo);
    
    return tickets.sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());
  },

  async getTicketById(id: number): Promise<ServiceTicket | undefined> {
    return db.serviceTickets.get(id);
  },

  async getTicketByNumber(ticketNumber: string): Promise<ServiceTicket | undefined> {
    const tickets = await db.serviceTickets.toArray();
    return tickets.find(t => t.ticketNumber === ticketNumber);
  },

  // ==================== ASSIGNMENT ====================

  async assignTicket(ticketId: number, technicianId: number): Promise<void> {
    await this.updateTicket(ticketId, {
      assignedTo: technicianId,
      assignedDate: new Date(),
      status: 'Assigned',
    });
  },

  async scheduleVisit(ticketId: number, visitDate: Date): Promise<void> {
    await this.updateTicket(ticketId, {
      visitDate,
      status: 'Assigned',
    });
  },

  async startWork(ticketId: number): Promise<void> {
    await this.updateTicket(ticketId, {
      status: 'In-progress',
    });
  },

  async resolveTicket(
    ticketId: number,
    data: {
      workDoneReport: string;
      resolutionNotes?: string;
      sparesUsed?: { itemId: number; quantity: number }[];
      photos?: string[];
      closedBy: number;
    }
  ): Promise<void> {
    await this.updateTicket(ticketId, {
      ...data,
      status: 'Resolved',
      closedDate: new Date(),
    });
  },

  async closeTicket(ticketId: number, closedBy: number): Promise<void> {
    await this.updateTicket(ticketId, {
      status: 'Closed',
      closedBy,
      closedDate: new Date(),
    });
  },

  async reopenTicket(ticketId: number, reason: string): Promise<void> {
    await this.updateTicket(ticketId, {
      status: 'Reopened',
      remarks: reason,
    });
  },

  // ==================== FEEDBACK ====================

  async submitFeedback(
    ticketId: number,
    rating: number,
    feedback?: string
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    await this.updateTicket(ticketId, {
      customerRating: rating,
      customerFeedback: feedback,
    });
  },

  // ==================== STATS & REPORTS ====================

  async getTicketStats(): Promise<{
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    reopened: number;
    avgResolutionTime: number; // in hours
    byPriority: Record<Priority, number>;
    byIssueType: Record<string, number>;
    avgRating: number;
  }> {
    const tickets = await db.serviceTickets.toArray();
    
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      assigned: tickets.filter(t => t.status === 'Assigned').length,
      inProgress: tickets.filter(t => t.status === 'In-progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      closed: tickets.filter(t => t.status === 'Closed').length,
      reopened: tickets.filter(t => t.status === 'Reopened').length,
      avgResolutionTime: 0,
      byPriority: {} as Record<Priority, number>,
      byIssueType: {} as Record<string, number>,
      avgRating: 0,
    };

    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.closedDate);
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, t) => {
        const reported = new Date(t.reportedDate).getTime();
        const closed = new Date(t.closedDate!).getTime();
        return sum + (closed - reported);
      }, 0);
      stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60)); // Convert to hours
    }

    // Group by priority
    tickets.forEach(t => {
      stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1;
      stats.byIssueType[t.issueType] = (stats.byIssueType[t.issueType] || 0) + 1;
    });

    // Calculate average rating
    const ratedTickets = tickets.filter(t => t.customerRating);
    if (ratedTickets.length > 0) {
      stats.avgRating = ratedTickets.reduce((sum, t) => sum + (t.customerRating || 0), 0) / ratedTickets.length;
    }

    return stats;
  },

  async getOpenTickets(): Promise<ServiceTicket[]> {
    return this.getTickets({ status: 'Open' });
  },

  async getOverdueTickets(): Promise<ServiceTicket[]> {
    const tickets = await db.serviceTickets.toArray();
    const now = new Date();
    
    return tickets.filter(t => {
      if (t.status === 'Closed' || t.status === 'Resolved') return false;
      if (!t.visitDate) return false;
      return new Date(t.visitDate) < now;
    });
  },

  async getPendingAssignment(): Promise<ServiceTicket[]> {
    return this.getTickets({ status: 'Open' });
  },

  async getMyTickets(technicianId: number): Promise<ServiceTicket[]> {
    return this.getTickets({ assignedTo: technicianId });
  },
};
