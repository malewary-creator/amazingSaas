import { db } from './database';

// ==================== TYPES ====================

export interface GSTRate {
  id?: number;
  rate: number;
  description: string;
  applicableFor: string;
  isActive: boolean;
}

export interface TaxSettings {
  id?: number;
  enableGST: boolean;
  gstNumber: string;
  panNumber: string;
  defaultGSTRate: number;
  includeGSTInPrice: boolean;
  tdsApplicable: boolean;
  tdsRate: number;
}

export interface CompanySettings {
  id?: number;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website?: string;
  logo?: string;
  businessType: string;
}

export interface AppearanceSettings {
  id?: number;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface BackupMetadata {
  id?: number;
  timestamp: string;
  recordCount: number;
  size: string;
  version: string;
}

// ==================== SETTINGS SERVICE ====================

export const settingsService = {
  // ==================== COMPANY SETTINGS ====================

  async getCompanySettings(): Promise<CompanySettings | null> {
    const settings = await db.table('companySettings').toArray();
    return settings.length > 0 ? settings[0] : null;
  },

  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<void> {
    const existing = await this.getCompanySettings();
    if (existing?.id) {
      await db.table('companySettings').update(existing.id, settings);
    } else {
      await db.table('companySettings').add({
        companyName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        businessType: 'Solar EPC',
        ...settings,
      });
    }
  },

  // ==================== TAX SETTINGS ====================

  async getTaxSettings(): Promise<TaxSettings | null> {
    const settings = await db.table('taxSettings').toArray();
    return settings.length > 0 ? settings[0] : null;
  },

  async updateTaxSettings(settings: Partial<TaxSettings>): Promise<void> {
    const existing = await this.getTaxSettings();
    if (existing?.id) {
      await db.table('taxSettings').update(existing.id, settings);
    } else {
      await db.table('taxSettings').add({
        enableGST: true,
        gstNumber: '',
        panNumber: '',
        defaultGSTRate: 18,
        includeGSTInPrice: false,
        tdsApplicable: false,
        tdsRate: 0,
        ...settings,
      });
    }
  },

  // ==================== GST RATES ====================

  async getGSTRates(): Promise<GSTRate[]> {
    return db.table('gstRates').toArray();
  },

  async addGSTRate(rate: Omit<GSTRate, 'id'>): Promise<number> {
    const id = await db.table('gstRates').add(rate);
    return Number(id);
  },

  async updateGSTRate(id: number, rate: Partial<GSTRate>): Promise<void> {
    await db.table('gstRates').update(id, rate);
  },

  async deleteGSTRate(id: number): Promise<void> {
    await db.table('gstRates').delete(id);
  },

  async initializeDefaultGSTRates(): Promise<void> {
    const existing = await this.getGSTRates();
    if (existing.length === 0) {
      const defaultRates: Omit<GSTRate, 'id'>[] = [
        { rate: 0, description: 'Nil Rated', applicableFor: 'Exempt goods/services', isActive: true },
        { rate: 5, description: '5% GST', applicableFor: 'Essential goods', isActive: true },
        { rate: 12, description: '12% GST', applicableFor: 'Standard goods', isActive: true },
        { rate: 18, description: '18% GST', applicableFor: 'Most goods & services', isActive: true },
        { rate: 28, description: '28% GST', applicableFor: 'Luxury goods', isActive: true },
      ];
      
      for (const rate of defaultRates) {
        await this.addGSTRate(rate);
      }
    }
  },

  // ==================== APPEARANCE SETTINGS ====================

  async getAppearanceSettings(): Promise<AppearanceSettings | null> {
    const settings = await db.table('appearanceSettings').toArray();
    return settings.length > 0 ? settings[0] : null;
  },

  async updateAppearanceSettings(settings: Partial<AppearanceSettings>): Promise<void> {
    const existing = await this.getAppearanceSettings();
    if (existing?.id) {
      await db.table('appearanceSettings').update(existing.id, settings);
    } else {
      await db.table('appearanceSettings').add({
        theme: 'light',
        primaryColor: '#3b82f6',
        fontSize: 'medium',
        compactMode: false,
        ...settings,
      });
    }
  },

  // ==================== BACKUP & RESTORE ====================

  async createBackup(): Promise<string> {
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        customers: await db.customers.toArray(),
        leads: await db.leads.toArray(),
        quotations: await db.quotations.toArray(),
        projects: await db.projects.toArray(),
        invoices: await db.invoices.toArray(),
        payments: await db.payments.toArray(),
        items: await db.items.toArray(),
        stockLedger: await db.stockLedger.toArray(),
        suppliers: await db.suppliers.toArray(),
        serviceTickets: await db.serviceTickets.toArray(),
        companySettings: await db.table('companySettings').toArray(),
        taxSettings: await db.table('taxSettings').toArray(),
        gstRates: await db.table('gstRates').toArray(),
        appearanceSettings: await db.table('appearanceSettings').toArray(),
      },
      metadata: {
        totalRecords: 0,
      },
    };

    // Calculate total records
    backup.metadata.totalRecords = Object.values(backup.data).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return JSON.stringify(backup, null, 2);
  },

  async restoreBackup(backupJson: string): Promise<void> {
    try {
      const backup = JSON.parse(backupJson);

      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }

      // Clear all tables
      await db.customers.clear();
      await db.leads.clear();
      await db.quotations.clear();
      await db.projects.clear();
      await db.invoices.clear();
      await db.payments.clear();
      await db.items.clear();
      await db.stockLedger.clear();
      await db.suppliers.clear();
      await db.serviceTickets.clear();
      await db.table('companySettings').clear();
      await db.table('taxSettings').clear();
      await db.table('gstRates').clear();
      await db.table('appearanceSettings').clear();

      // Restore data
      if (backup.data.customers) await db.customers.bulkAdd(backup.data.customers);
      if (backup.data.leads) await db.leads.bulkAdd(backup.data.leads);
      if (backup.data.quotations) await db.quotations.bulkAdd(backup.data.quotations);
      if (backup.data.projects) await db.projects.bulkAdd(backup.data.projects);
      if (backup.data.invoices) await db.invoices.bulkAdd(backup.data.invoices);
      if (backup.data.payments) await db.payments.bulkAdd(backup.data.payments);
      if (backup.data.items) await db.items.bulkAdd(backup.data.items);
      if (backup.data.stockLedger) await db.stockLedger.bulkAdd(backup.data.stockLedger);
      if (backup.data.suppliers) await db.suppliers.bulkAdd(backup.data.suppliers);
      if (backup.data.serviceTickets) await db.serviceTickets.bulkAdd(backup.data.serviceTickets);
      if (backup.data.companySettings) await db.table('companySettings').bulkAdd(backup.data.companySettings);
      if (backup.data.taxSettings) await db.table('taxSettings').bulkAdd(backup.data.taxSettings);
      if (backup.data.gstRates) await db.table('gstRates').bulkAdd(backup.data.gstRates);
      if (backup.data.appearanceSettings) await db.table('appearanceSettings').bulkAdd(backup.data.appearanceSettings);
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getBackupMetadata(): Promise<BackupMetadata> {
    const customers = await db.customers.count();
    const leads = await db.leads.count();
    const projects = await db.projects.count();
    const invoices = await db.invoices.count();
    const items = await db.items.count();

    const totalRecords = customers + leads + projects + invoices + items;

    return {
      timestamp: new Date().toISOString(),
      recordCount: totalRecords,
      size: 'Calculating...',
      version: '1.0.0',
    };
  },

  // ==================== UTILITY ====================

  async resetAllSettings(): Promise<void> {
    await db.table('companySettings').clear();
    await db.table('taxSettings').clear();
    await db.table('gstRates').clear();
    await db.table('appearanceSettings').clear();
    await this.initializeDefaultGSTRates();
  },
};
