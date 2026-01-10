import { db } from './database';
import { inventoryService } from './inventoryService';

export const reportsService = {
  // ==================== SALES & REVENUE ====================
  
  async getSalesReport(startDate: Date, endDate: Date): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    avgInvoiceValue: number;
    invoicesByStatus: Record<string, number>;
    revenueByMonth: { month: string; revenue: number }[];
  }> {
    const invoices = await db.invoices
      .filter(inv => {
        const invDate = new Date(inv.invoiceDate);
        return invDate >= startDate && invDate <= endDate;
      })
      .toArray();

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalPending = totalRevenue - totalPaid;
    
    const now = new Date();
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'Overdue' && inv.dueDate && new Date(inv.dueDate) < now
    );
    const totalOverdue = overdueInvoices.reduce((sum, inv) => 
      sum + ((inv.grandTotal || 0) - (inv.amountPaid || 0)), 0
    );

    const invoicesByStatus: Record<string, number> = {};
    invoices.forEach(inv => {
      invoicesByStatus[inv.status || 'Unknown'] = (invoicesByStatus[inv.status || 'Unknown'] || 0) + 1;
    });

    // Revenue by month
    const monthlyRevenue: Record<string, number> = {};
    invoices.forEach(inv => {
      const month = new Date(inv.invoiceDate).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (inv.grandTotal || 0);
    });

    const revenueByMonth = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      totalPaid,
      totalPending,
      totalOverdue,
      avgInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
      invoicesByStatus,
      revenueByMonth,
    };
  },

  async getPaymentCollectionReport(startDate: Date, endDate: Date): Promise<{
    totalCollected: number;
    collectionByMode: Record<string, number>;
    collectionByMonth: { month: string; amount: number }[];
    avgPaymentValue: number;
  }> {
    const payments = await db.payments
      .filter(pay => {
        const payDate = new Date(pay.paymentDate);
        return payDate >= startDate && payDate <= endDate && pay.status === 'Received';
      })
      .toArray();

    const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);

    const collectionByMode: Record<string, number> = {};
    payments.forEach(pay => {
      collectionByMode[pay.paymentMode] = (collectionByMode[pay.paymentMode] || 0) + pay.amount;
    });

    const monthlyCollection: Record<string, number> = {};
    payments.forEach(pay => {
      const month = new Date(pay.paymentDate).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyCollection[month] = (monthlyCollection[month] || 0) + pay.amount;
    });

    const collectionByMonth = Object.entries(monthlyCollection)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
      totalCollected,
      collectionByMode,
      collectionByMonth,
      avgPaymentValue: payments.length > 0 ? totalCollected / payments.length : 0,
    };
  },

  // ==================== INVENTORY ====================

  async getInventoryReport(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStock: number;
    categoryBreakdown: { category: string; count: number; value: number }[];
    topValueItems: { name: string; value: number }[];
  }> {
    const stats = await inventoryService.getInventoryStats();
    const items = await db.items.toArray();
    const lowStock = await inventoryService.getLowStockItems();
    const outOfStock = items.filter(i => !i.currentStock || i.currentStock === 0);

    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    items.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, value: 0 };
      }
      categoryBreakdown[item.category].count++;
      categoryBreakdown[item.category].value += (item.currentStock || 0) * (item.purchasePrice || 0);
    });

    const topValueItems = items
      .map(item => ({
        name: item.name,
        value: (item.currentStock || 0) * (item.purchasePrice || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalItems: stats.totalItems,
      totalValue: stats.totalValue,
      lowStockItems: lowStock.length,
      outOfStock: outOfStock.length,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
      })),
      topValueItems,
    };
  },

  async getStockMovementReport(startDate: Date, endDate: Date): Promise<{
    totalTransactions: number;
    stockIn: number;
    stockOut: number;
    netMovement: number;
    transactionsByType: Record<string, number>;
  }> {
    const transactions = await db.stockLedger
      .filter(txn => {
        const txnDate = new Date(txn.transactionDate);
        return txnDate >= startDate && txnDate <= endDate;
      })
      .toArray();

    const inboundTypes = ['Purchase', 'Return from Site', 'Opening Stock', 'Adjustment'];
    const stockIn = transactions
      .filter(t => inboundTypes.includes(t.transactionType))
      .reduce((sum, t) => sum + t.quantity, 0);

    const stockOut = transactions
      .filter(t => !inboundTypes.includes(t.transactionType))
      .reduce((sum, t) => sum + t.quantity, 0);

    const transactionsByType: Record<string, number> = {};
    transactions.forEach(txn => {
      transactionsByType[txn.transactionType] = (transactionsByType[txn.transactionType] || 0) + 1;
    });

    return {
      totalTransactions: transactions.length,
      stockIn,
      stockOut,
      netMovement: stockIn - stockOut,
      transactionsByType,
    };
  },

  // ==================== SERVICE ====================

  async getServiceReport(startDate: Date, endDate: Date): Promise<{
    totalTickets: number;
    resolved: number;
    pending: number;
    avgResolutionTime: number;
    avgRating: number;
    ticketsByPriority: Record<string, number>;
    ticketsByIssueType: Record<string, number>;
    resolutionRate: number;
  }> {
    const tickets = await db.serviceTickets
      .filter(tkt => {
        const reportDate = new Date(tkt.reportedDate);
        return reportDate >= startDate && reportDate <= endDate;
      })
      .toArray();

    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const pending = tickets.filter(t => 
      t.status !== 'Resolved' && t.status !== 'Closed'
    ).length;

    const resolvedTickets = tickets.filter(t => t.closedDate);
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        const reported = new Date(t.reportedDate).getTime();
        const closed = new Date(t.closedDate!).getTime();
        return sum + (closed - reported);
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // hours
    }

    const ratedTickets = tickets.filter(t => t.customerRating);
    const avgRating = ratedTickets.length > 0
      ? ratedTickets.reduce((sum, t) => sum + (t.customerRating || 0), 0) / ratedTickets.length
      : 0;

    const ticketsByPriority: Record<string, number> = {};
    const ticketsByIssueType: Record<string, number> = {};

    tickets.forEach(t => {
      ticketsByPriority[t.priority] = (ticketsByPriority[t.priority] || 0) + 1;
      ticketsByIssueType[t.issueType] = (ticketsByIssueType[t.issueType] || 0) + 1;
    });

    return {
      totalTickets: tickets.length,
      resolved,
      pending,
      avgResolutionTime,
      avgRating,
      ticketsByPriority,
      ticketsByIssueType,
      resolutionRate: tickets.length > 0 ? (resolved / tickets.length) * 100 : 0,
    };
  },

  // ==================== LEADS & PROJECTS ====================

  async getLeadConversionReport(startDate: Date, endDate: Date): Promise<{
    totalLeads: number;
    qualified: number;
    converted: number;
    lost: number;
    conversionRate: number;
    leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>;
    avgLeadValue: number;
  }> {
    const leads = await db.leads
      .filter(lead => {
        const createDate = new Date(lead.createdAt);
        return createDate >= startDate && createDate <= endDate;
      })
      .toArray();

    const qualified = leads.filter(l => l.status === 'In-progress').length;
    const converted = leads.filter(l => l.status === 'Converted').length;
    const lost = leads.filter(l => l.status === 'Lost').length;

    const leadsBySource: Record<string, number> = {};
    const leadsByStatus: Record<string, number> = {};

    leads.forEach(lead => {
      leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
    });

    const totalValue = leads.reduce((sum, l) => sum + (l.tentativeBudget || 0), 0);

    return {
      totalLeads: leads.length,
      qualified,
      converted,
      lost,
      conversionRate: leads.length > 0 ? (converted / leads.length) * 100 : 0,
      leadsBySource,
      leadsByStatus,
      avgLeadValue: leads.length > 0 ? totalValue / leads.length : 0,
    };
  },

  async getProjectReport(startDate: Date, endDate: Date): Promise<{
    totalProjects: number;
    completed: number;
    ongoing: number;
    totalCapacity: number;
    projectsByStatus: Record<string, number>;
    projectsByType: Record<string, number>;
    avgProjectValue: number;
  }> {
    const projects = await db.projects
      .filter(proj => {
        const createDate = new Date(proj.createdAt);
        return createDate >= startDate && createDate <= endDate;
      })
      .toArray();

    const completed = projects.filter(p => p.status === 'Completed').length;
    const ongoing = projects.filter(p => 
      p.status === 'In Progress' || p.status === 'Installation' || p.status === 'Testing'
    ).length;

    const totalCapacity = projects.reduce((sum, p) => sum + (p.systemSize || 0), 0);

    const projectsByStatus: Record<string, number> = {};
    const projectsByType: Record<string, number> = {};

    projects.forEach(proj => {
      projectsByStatus[proj.status] = (projectsByStatus[proj.status] || 0) + 1;
      projectsByType[proj.systemType] = (projectsByType[proj.systemType] || 0) + 1;
    });

    const totalValue = projects.reduce((sum, p) => sum + (p.projectValue || 0), 0);

    return {
      totalProjects: projects.length,
      completed,
      ongoing,
      totalCapacity,
      projectsByStatus,
      projectsByType,
      avgProjectValue: projects.length > 0 ? totalValue / projects.length : 0,
    };
  },

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<{
    sales: { total: number; paid: number; pending: number };
    inventory: { items: number; value: number; lowStock: number };
    service: { open: number; resolved: number; avgRating: number };
    projects: { total: number; active: number; capacity: number };
  }> {
    const [invoices, items, lowStock, tickets, projects] = await Promise.all([
      db.invoices.toArray(),
      db.items.toArray(),
      inventoryService.getLowStockItems(),
      db.serviceTickets.toArray(),
      db.projects.toArray(),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalValue = items.reduce((sum, i) => {
      const price = i.purchasePrice || i.sellingPrice || 0;
      return sum + ((i.currentStock || 0) * price);
    }, 0);

    const openTickets = tickets.filter(t => 
      t.status === 'Open' || t.status === 'Assigned' || t.status === 'In-progress'
    ).length;
    const resolvedTickets = tickets.filter(t => 
      t.status === 'Resolved' || t.status === 'Closed'
    ).length;
    const ratedTickets = tickets.filter(t => t.customerRating);
    const avgRating = ratedTickets.length > 0
      ? ratedTickets.reduce((sum, t) => sum + (t.customerRating || 0), 0) / ratedTickets.length
      : 0;

    const activeProjects = projects.filter(p => 
      p.status === 'In Progress' || p.status === 'Installation'
    ).length;
    const totalCapacity = projects.reduce((sum, p) => sum + (p.systemSize || 0), 0);

    return {
      sales: {
        total: totalRevenue,
        paid: totalPaid,
        pending: totalRevenue - totalPaid,
      },
      inventory: {
        items: items.filter(i => i.status === 'active').length,
        value: totalValue,
        lowStock: lowStock.length,
      },
      service: {
        open: openTickets,
        resolved: resolvedTickets,
        avgRating,
      },
      projects: {
        total: projects.length,
        active: activeProjects,
        capacity: totalCapacity,
      },
    };
  },
};
