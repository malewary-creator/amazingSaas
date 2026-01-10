/**
 * Projects Service
 * Business logic for project and stage management
 */

import { db } from './database';
import type { Project, ProjectStatus, ProjectStage, StageName, StageStatus } from '@/types';

// 10 project stages in order
export const PROJECT_STAGES: StageName[] = [
  'Material Planning',
  'Material Purchase/Booking',
  'Material Delivered to Site',
  'Structure Installation',
  'Panel Installation',
  'Inverter & Wiring',
  'Earthing & SPD',
  'Testing & Commissioning',
  'Documentation & Handover',
  'Net Meter Application',
];

export const projectsService = {
  /**
   * Generate project ID in format PROJ-YYYY-NNN
   */
  async generateProjectId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `PROJ-${year}-`;
    
    const existingProjects = await db.projects
      .filter(p => p.projectId?.startsWith(prefix))
      .toArray();
    
    const maxNumber = existingProjects.reduce((max, project) => {
      const match = project.projectId?.match(/PROJ-\d{4}-(\d+)/);
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
   * Sync project payment totals and paymentSchedule statuses from payments
   */
  async syncPaymentsAndSchedule(projectId: number): Promise<void> {
    const project = await db.projects.get(projectId);
    if (!project) return;

    const payments = await db.payments.where('projectId').equals(projectId).toArray();
    const validPayments = payments.filter(p => p.status !== 'Bounced');
    const totalPaid = validPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balanceAmount = (project.projectValue || 0) - totalPaid;

    // Update project totals
    await db.projects.update(projectId, {
      totalPaid,
      balanceAmount: Math.max(0, balanceAmount),
      updatedAt: new Date(),
    });

    // Update payment schedule statuses if present
    if (project.paymentSchedule && project.paymentSchedule.stages && project.paymentSchedule.stages.length > 0) {
      let remainingPaid = totalPaid;
      const stages = await db.projectStages.where('projectId').equals(projectId).sortBy('stageOrder');
      const schedule = project.paymentSchedule;

      // Compute amounts for each schedule stage if percentage provided
      const scheduleStages = schedule.stages.map(s => ({
        ...s,
        amount: s.amount || Math.round(((s.percentage || 0) / 100) * (project.projectValue || 0)),
      }));

      const updatedScheduleStages = scheduleStages.map(s => {
        if (!s.amount || s.amount <= 0) {
          return { ...s, status: s.status || 'Due' };
        }
        if (remainingPaid >= s.amount) {
          remainingPaid -= s.amount;
          return { ...s, status: 'Received' };
        }
        if (remainingPaid > 0 && remainingPaid < s.amount) {
          const ret = { ...s, status: 'Partial' };
          remainingPaid = 0;
          return ret;
        }
        return { ...s, status: 'Due' };
      });

      // Persist updated schedule back to project
      await db.projects.update(projectId, {
        paymentSchedule: {
          ...schedule,
          stages: updatedScheduleStages,
        } as any,
        updatedAt: new Date(),
      });

      // Optional: mark a project stage as In-progress/Completed based on schedule progress
      // e.g., when Booking received, start first stage
      const bookingReceived = updatedScheduleStages.find(s => s.stage === 'Booking' && s.status === 'Received');
      if (bookingReceived && stages[0]) {
        if (stages[0].status === 'Pending') {
          await db.projectStages.update(stages[0].id!, { status: 'In-progress', startDate: new Date() });
        }
      }
    }
  },

  /**
   * Create new project with default stages
   */
  async createProject(data: Omit<Project, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const projectId = await this.generateProjectId();
    
    const project: Omit<Project, 'id'> = {
      ...data,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const id = await db.projects.add(project) as number;
    
    // Create default stages
    await this.initializeProjectStages(id);
    
    return id;
  },

  /**
   * Initialize all 10 stages for a project
   */
  async initializeProjectStages(projectId: number): Promise<void> {
    const stages: Omit<ProjectStage, 'id'>[] = PROJECT_STAGES.map((stageName, index) => ({
      projectId,
      stageName,
      stageOrder: index + 1,
      status: 'Pending' as StageStatus,
    }));
    
    await db.projectStages.bulkAdd(stages);
  },

  /**
   * Get all projects with optional filters
   */
  async getProjects(filters?: {
    status?: ProjectStatus;
    customerId?: number;
    leadId?: number;
    projectManager?: number;
    branchId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Project[]> {
    let query = db.projects.toCollection();
    
    let projects = await query.toArray();
    
    // Apply filters
    if (filters?.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    
    if (filters?.customerId) {
      projects = projects.filter(p => p.customerId === filters.customerId);
    }
    
    if (filters?.leadId) {
      projects = projects.filter(p => p.leadId === filters.leadId);
    }
    
    if (filters?.projectManager) {
      projects = projects.filter(p => p.projectManager === filters.projectManager);
    }
    
    if (filters?.branchId) {
      projects = projects.filter(p => p.branchId === filters.branchId);
    }
    
    if (filters?.startDate) {
      projects = projects.filter(p => 
        p.startDate && new Date(p.startDate) >= filters.startDate!
      );
    }
    
    if (filters?.endDate) {
      projects = projects.filter(p => 
        p.targetDate && new Date(p.targetDate) <= filters.endDate!
      );
    }
    
    return projects;
  },

  /**
   * Get project by ID
   */
  async getProjectById(id: number): Promise<Project | undefined> {
    return await db.projects.get(id);
  },

  /**
   * Get project with all related data
   */
  async getProjectWithDetails(id: number): Promise<any> {
    const project = await db.projects.get(id);
    if (!project) return null;

    const lead = await db.leads.get(project.leadId);
    const customer = lead ? await db.customers.get(lead.customerId) : null;
    const quotation = project.quotationId ? await db.quotations.get(project.quotationId) : null;
    const projectManager = project.projectManager ? await db.users.get(project.projectManager) : null;
    
    // Get team members
    const teamMembers = project.installationTeam 
      ? await Promise.all(project.installationTeam.map(id => db.users.get(id)))
      : [];
    
    // Get project stages
    const stages = await db.projectStages
      .where('projectId')
      .equals(id)
      .sortBy('stageOrder');

    // Format address as string
    const formatAddress = (addr: any) => {
      if (!addr) return 'N/A';
      const parts = [addr.area, addr.city, addr.state, addr.pincode].filter(Boolean);
      return parts.join(', ') || 'N/A';
    };

    return {
      ...project,
      leadId: lead?.leadId,
      customerName: customer?.name,
      customerMobile: customer?.mobile,
      customerAddress: formatAddress(customer?.address),
      quotationNumber: quotation?.quotationNumber,
      projectManagerName: projectManager?.name,
      teamMemberNames: teamMembers.filter(Boolean).map(m => m?.name),
      stages,
    };
  },

  /**
   * Update project
   */
  async updateProject(id: number, data: Partial<Omit<Project, 'id' | 'projectId' | 'createdAt'>>): Promise<void> {
    await db.projects.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  },

  /**
   * Delete project and all stages
   */
  async deleteProject(id: number): Promise<void> {
    // Delete all stages first
    await db.projectStages.where('projectId').equals(id).delete();
    // Delete project
    await db.projects.delete(id);
  },

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    total: number;
    planning: number;
    materialProcurement: number;
    inProgress: number;
    installation: number;
    testing: number;
    completed: number;
    onHold: number;
    cancelled: number;
    activeProjects: number;
    totalValue: number;
    totalPaid: number;
    totalBalance: number;
  }> {
    const projects = await db.projects.toArray();
    
    const stats = {
      total: projects.length,
      planning: projects.filter(p => p.status === 'Planning').length,
      materialProcurement: projects.filter(p => p.status === 'Material Procurement').length,
      inProgress: projects.filter(p => p.status === 'In Progress').length,
      installation: projects.filter(p => p.status === 'Installation').length,
      testing: projects.filter(p => p.status === 'Testing').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      onHold: projects.filter(p => p.status === 'On-hold').length,
      cancelled: projects.filter(p => p.status === 'Cancelled').length,
      activeProjects: projects.filter(p => 
        !['Completed', 'Cancelled', 'On-hold'].includes(p.status)
      ).length,
      totalValue: projects.reduce((sum, p) => sum + (p.projectValue || 0), 0),
      totalPaid: projects.reduce((sum, p) => sum + (p.totalPaid || 0), 0),
      totalBalance: projects.reduce((sum, p) => sum + (p.balanceAmount || 0), 0),
    };
    
    return stats;
  },

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    return await db.projects.where('status').equals(status).toArray();
  },

  /**
   * Get projects by manager
   */
  async getProjectsByManager(managerId: number): Promise<Project[]> {
    return await db.projects.where('projectManager').equals(managerId).toArray();
  },

  /**
   * Update project status
   */
  async updateProjectStatus(id: number, status: ProjectStatus): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    
    if (status === 'Completed') {
      updates.completionDate = new Date();
    }
    
    await db.projects.update(id, updates);
  },

  /**
   * Calculate project progress based on stages
   */
  async calculateProjectProgress(projectId: number): Promise<number> {
    const stages = await db.projectStages.where('projectId').equals(projectId).toArray();
    
    if (stages.length === 0) return 0;
    
    const completedStages = stages.filter(s => s.status === 'Completed').length;
    return Math.round((completedStages / stages.length) * 100);
  },

  // ==================== STAGE MANAGEMENT ====================

  /**
   * Get stages for a project
   */
  async getProjectStages(projectId: number): Promise<ProjectStage[]> {
    return await db.projectStages
      .where('projectId')
      .equals(projectId)
      .sortBy('stageOrder');
  },

  /**
   * Update stage
   */
  async updateStage(stageId: number, data: Partial<Omit<ProjectStage, 'id' | 'projectId' | 'stageName' | 'stageOrder'>>): Promise<void> {
    await db.projectStages.update(stageId, data);
  },

  /**
   * Mark stage as completed
   */
  async completeStage(stageId: number, completedBy: number): Promise<void> {
    await db.projectStages.update(stageId, {
      status: 'Completed',
      endDate: new Date(),
      completedBy,
      completedAt: new Date(),
    });
  },

  /**
   * Start stage
   */
  async startStage(stageId: number): Promise<void> {
    await db.projectStages.update(stageId, {
      status: 'In-progress',
      startDate: new Date(),
    });
  },

  /**
   * Skip stage
   */
  async skipStage(stageId: number, reason: string): Promise<void> {
    await db.projectStages.update(stageId, {
      status: 'Skipped',
      comments: reason,
    });
  },

  /**
   * Get current active stage
   */
  async getCurrentStage(projectId: number): Promise<ProjectStage | null> {
    const stages = await this.getProjectStages(projectId);
    
    // Find first non-completed, non-skipped stage
    const activeStage = stages.find(s => 
      s.status === 'In-progress' || s.status === 'Pending'
    );
    
    return activeStage || null;
  },

  /**
   * Get stage completion summary
   */
  async getStageCompletionSummary(projectId: number): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    skipped: number;
    percentage: number;
  }> {
    const stages = await this.getProjectStages(projectId);
    
    return {
      total: stages.length,
      completed: stages.filter(s => s.status === 'Completed').length,
      inProgress: stages.filter(s => s.status === 'In-progress').length,
      pending: stages.filter(s => s.status === 'Pending').length,
      skipped: stages.filter(s => s.status === 'Skipped').length,
      percentage: await this.calculateProjectProgress(projectId),
    };
  },

  /**
   * Assign stage to user
   */
  async assignStage(stageId: number, userId: number): Promise<void> {
    await db.projectStages.update(stageId, {
      assignedTo: userId,
    });
  },

  // ==================== FINANCIAL ====================

  /**
   * Update payment information
   */
  async updatePayment(projectId: number, totalPaid: number): Promise<void> {
    const project = await db.projects.get(projectId);
    if (!project) return;
    
    const balanceAmount = (project.projectValue || 0) - totalPaid;
    
    await db.projects.update(projectId, {
      totalPaid,
      balanceAmount,
      updatedAt: new Date(),
    });
  },

  /**
   * Get payment summary
   */
  async getPaymentSummary(projectId: number): Promise<{
    projectValue: number;
    totalPaid: number;
    balanceAmount: number;
    paymentPercentage: number;
  }> {
    const project = await db.projects.get(projectId);
    
    if (!project) {
      return {
        projectValue: 0,
        totalPaid: 0,
        balanceAmount: 0,
        paymentPercentage: 0,
      };
    }
    
    const projectValue = project.projectValue || 0;
    const totalPaid = project.totalPaid || 0;
    const balanceAmount = project.balanceAmount || 0;
    const paymentPercentage = projectValue > 0 
      ? Math.round((totalPaid / projectValue) * 100)
      : 0;
    
    return {
      projectValue,
      totalPaid,
      balanceAmount,
      paymentPercentage,
    };
  },
};
