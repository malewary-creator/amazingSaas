/**
 * Surveys Service
 * Business logic for survey management
 */

import { db } from './database';
import type { Survey, SurveyStatus } from '@/types';

export const surveysService = {
  /**
   * Create new survey
   */
  async createSurvey(data: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const survey: Omit<Survey, 'id'> = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return await db.surveys.add(survey) as number;
  },

  /**
   * Get all surveys with optional filters
   */
  async getSurveys(filters?: {
    status?: SurveyStatus;
    assignedTo?: number;
    leadId?: number;
    customerId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Survey[]> {
    let query = db.surveys.toCollection();
    
    let surveys = await query.toArray();
    
    // Apply filters
    if (filters?.status) {
      surveys = surveys.filter(s => s.status === filters.status);
    }
    
    if (filters?.assignedTo) {
      surveys = surveys.filter(s => s.assignedTo === filters.assignedTo);
    }
    
    if (filters?.leadId) {
      surveys = surveys.filter(s => s.leadId === filters.leadId);
    }
    
    if (filters?.customerId) {
      // Need to join with leads to filter by customer
      const leads = await db.leads.where('customerId').equals(filters.customerId).toArray();
      const leadIds = new Set(leads.map(l => l.id).filter(id => id !== undefined) as number[]);
      surveys = surveys.filter(s => leadIds.has(s.leadId));
    }
    
    if (filters?.startDate) {
      surveys = surveys.filter(s => 
        s.surveyDate && new Date(s.surveyDate) >= filters.startDate!
      );
    }
    
    if (filters?.endDate) {
      surveys = surveys.filter(s => 
        s.surveyDate && new Date(s.surveyDate) <= filters.endDate!
      );
    }
    
    return surveys;
  },

  /**
   * Get survey by ID
   */
  async getSurveyById(id: number): Promise<Survey | undefined> {
    return await db.surveys.get(id);
  },

  /**
   * Get survey with lead and customer data
   */
  async getSurveyWithDetails(id: number): Promise<{
    survey: Survey;
    lead: any;
    customer: any;
    engineer: any;
  } | null> {
    const survey = await db.surveys.get(id);
    if (!survey) return null;

    const lead = await db.leads.get(survey.leadId);
    if (!lead) return null;

    const customer = await db.customers.get(lead.customerId);
    const engineer = await db.users.get(survey.assignedTo);

    return {
      survey,
      lead,
      customer: customer || null,
      engineer: engineer || null,
    };
  },

  /**
   * Update survey
   */
  async updateSurvey(id: number, data: Partial<Omit<Survey, 'id' | 'createdAt'>>): Promise<void> {
    await db.surveys.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  },

  /**
   * Delete survey
   */
  async deleteSurvey(id: number): Promise<void> {
    await db.surveys.delete(id);
    // Also delete related photos
    await db.surveyPhotos.where('surveyId').equals(id).delete();
  },

  /**
   * Get survey statistics
   */
  async getSurveyStats(): Promise<{
    total: number;
    pending: number;
    assigned: number;
    inProgress: number;
    completed: number;
    revisitRequired: number;
    todaysSurveys: number;
    upcomingSurveys: number;
  }> {
    const surveys = await db.surveys.toArray();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      total: surveys.length,
      pending: surveys.filter(s => s.status === 'Pending').length,
      assigned: surveys.filter(s => s.status === 'Assigned').length,
      inProgress: surveys.filter(s => s.status === 'In-progress').length,
      completed: surveys.filter(s => s.status === 'Completed').length,
      revisitRequired: surveys.filter(s => s.status === 'Revisit Required').length,
      todaysSurveys: surveys.filter(s => {
        if (!s.surveyDate) return false;
        const surveyDate = new Date(s.surveyDate);
        surveyDate.setHours(0, 0, 0, 0);
        return surveyDate.getTime() === today.getTime();
      }).length,
      upcomingSurveys: surveys.filter(s => {
        if (!s.surveyDate) return false;
        const surveyDate = new Date(s.surveyDate);
        return surveyDate >= tomorrow;
      }).length,
    };
  },

  /**
   * Get surveys scheduled for today
   */
  async getTodaysSurveys(): Promise<Survey[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const surveys = await db.surveys.toArray();
    
    return surveys.filter(s => {
      if (!s.surveyDate) return false;
      const surveyDate = new Date(s.surveyDate);
      surveyDate.setHours(0, 0, 0, 0);
      return surveyDate.getTime() === today.getTime();
    });
  },

  /**
   * Get upcoming surveys (next 7 days)
   */
  async getUpcomingSurveys(days: number = 7): Promise<Survey[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const surveys = await db.surveys.toArray();
    
    return surveys.filter(s => {
      if (!s.surveyDate) return false;
      const surveyDate = new Date(s.surveyDate);
      return surveyDate >= today && surveyDate <= futureDate;
    }).sort((a, b) => {
      if (!a.surveyDate || !b.surveyDate) return 0;
      return new Date(a.surveyDate).getTime() - new Date(b.surveyDate).getTime();
    });
  },

  /**
   * Assign survey to engineer
   */
  async assignSurvey(id: number, engineerId: number): Promise<void> {
    await db.surveys.update(id, {
      assignedTo: engineerId,
      status: 'Assigned',
      updatedAt: new Date(),
    });
  },

  /**
   * Mark survey as completed
   */
  async completeSurvey(id: number): Promise<void> {
    await db.surveys.update(id, {
      status: 'Completed',
      updatedAt: new Date(),
    });
  },

  /**
   * Mark survey for revisit
   */
  async markForRevisit(id: number, reason: string): Promise<void> {
    await db.surveys.update(id, {
      status: 'Revisit Required',
      revisitReason: reason,
      updatedAt: new Date(),
    });
  },

  /**
   * Get surveys by engineer
   */
  async getSurveysByEngineer(engineerId: number, status?: SurveyStatus): Promise<Survey[]> {
    let surveys = await db.surveys.where('assignedTo').equals(engineerId).toArray();
    
    if (status) {
      surveys = surveys.filter(s => s.status === status);
    }
    
    return surveys;
  },

  /**
   * Calculate usable area from dimensions
   */
  calculateUsableArea(length?: number, width?: number): number {
    if (!length || !width) return 0;
    return length * width;
  },

  /**
   * Estimate system capacity based on usable area
   * Assumption: ~10-12 sq meters per kW
   */
  estimateSystemCapacity(usableArea: number): number {
    if (!usableArea) return 0;
    return Math.floor((usableArea / 11) * 10) / 10; // Round to 1 decimal
  },
};
