/**
 * Backup & Restore Service
 * Handles export/import of all database data to local file system
 */

import { db } from './database';

export interface BackupMetadata {
  version: string;
  exportDate: string;
  database: string;
  recordCount: number;
  tablesIncluded: string[];
  appVersion: string;
  checksum?: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  tables: {
    users?: any[];
    roles?: any[];
    permissions?: any[];
    customers?: any[];
    leads?: any[];
    customerDocuments?: any[];
    surveys?: any[];
    surveyPhotos?: any[];
    projects?: any[];
    projectStages?: any[];
    items?: any[];
    bom?: any[];
    quotations?: any[];
    quotationItems?: any[];
    invoices?: any[];
    invoiceItems?: any[];
    payments?: any[];
    financeApplications?: any[];
    stockLedger?: any[];
    suppliers?: any[];
    warranties?: any[];
    amcContracts?: any[];
    serviceTickets?: any[];
    notifications?: any[];
    branches?: any[];
    auditLogs?: any[];
  };
}

class BackupService {
  /**
   * Export entire database to JSON
   */
  async exportFullBackup(): Promise<BackupData> {
    try {
      const tables: any = {};
      let totalRecords = 0;
      const tablesIncluded: string[] = [];

      // Export all tables
      for (const table of db.tables) {
        const tableName = table.name;
        const data = await table.toArray();
        tables[tableName] = data;
        totalRecords += data.length;
        if (data.length > 0) {
          tablesIncluded.push(tableName);
        }
      }

      const metadata: BackupMetadata = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        database: 'ShineSolarDB',
        recordCount: totalRecords,
        tablesIncluded,
        appVersion: '1.0.0',
      };

      return {
        metadata,
        tables,
      };
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export database');
    }
  }

  /**
   * Download backup as JSON file
   */
  async downloadBackup(): Promise<void> {
    try {
      const backupData = await this.exportFullBackup();
      const jsonString = JSON.stringify(backupData, null, 2);
      
      // Calculate file size before creating blob
      const fileSizeMB = new Blob([jsonString]).size / 1024 / 1024;
      
      // Warn if file is very large (> 100MB)
      if (fileSizeMB > 100) {
        console.warn(`⚠️ Large backup file: ${fileSizeMB.toFixed(2)} MB`);
        console.warn('Consider removing old photos or data to reduce size');
      }
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `ShineSolar_Backup_${timestamp}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      // Log backup event
      console.log(`✅ Backup exported: ${filename}`);
      console.log(`📊 Total records: ${backupData.metadata.recordCount}`);
      console.log(`📁 File size: ${fileSizeMB.toFixed(2)} MB`);
    } catch (error) {
      console.error('Download failed:', error);
      if (error instanceof Error && error.message.includes('memory')) {
        throw new Error('Backup file too large. Try clearing old data first.');
      }
      throw new Error('Failed to download backup');
    }
  }

  /**
   * Import backup from JSON data
   */
  async importBackup(backupData: BackupData, options: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
  } = {}): Promise<{ success: boolean; imported: number; skipped: number; errors: number }> {
    const { clearExisting = false, skipDuplicates = true } = options;
    
    try {
      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      // Validate backup data
      if (!backupData.metadata || !backupData.tables) {
        throw new Error('Invalid backup file format');
      }

      console.log('📥 Starting import...');
      console.log(`📊 Backup contains ${backupData.metadata.recordCount} records`);

      // Clear existing data if requested
      if (clearExisting) {
        console.log('🗑️ Clearing existing data...');
        await db.transaction('rw', db.tables, async () => {
          for (const table of db.tables) {
            await table.clear();
          }
        });
        console.log('✅ Existing data cleared');
      }

      // Import each table
      for (const [tableName, records] of Object.entries(backupData.tables)) {
        if (!records || records.length === 0) continue;

        try {
          const table = (db as any)[tableName];
          if (!table) {
            console.warn(`⚠️ Table ${tableName} not found in current schema`);
            totalSkipped += records.length;
            continue;
          }

          if (skipDuplicates && !clearExisting) {
            // Import one by one to skip duplicates
            for (const record of records) {
              try {
                await table.add(record);
                totalImported++;
              } catch (error: any) {
                if (error.name === 'ConstraintError') {
                  totalSkipped++;
                } else {
                  console.error(`Error importing to ${tableName}:`, error);
                  totalErrors++;
                }
              }
            }
          } else {
            // Bulk import (faster)
            await table.bulkAdd(records);
            totalImported += records.length;
          }

          console.log(`✅ ${tableName}: ${records.length} records`);
        } catch (error) {
          console.error(`❌ Failed to import ${tableName}:`, error);
          totalErrors += records.length;
        }
      }

      console.log('✅ Import completed');
      console.log(`📊 Imported: ${totalImported} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);

      return {
        success: totalErrors === 0,
        imported: totalImported,
        skipped: totalSkipped,
        errors: totalErrors,
      };
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import backup');
    }
  }

  /**
   * Import from uploaded JSON file
   */
  async importFromFile(file: File, options?: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
  }): Promise<{ success: boolean; imported: number; skipped: number; errors: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const jsonString = event.target?.result as string;
          const backupData: BackupData = JSON.parse(jsonString);
          
          const result = await this.importBackup(backupData, options);
          resolve(result);
        } catch (error) {
          reject(new Error('Failed to parse backup file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Export selective data (date range)
   */
  async exportByDateRange(startDate: Date, endDate: Date): Promise<BackupData> {
    try {
      const tables: any = {};
      let totalRecords = 0;
      const tablesIncluded: string[] = [];

      // Tables with date filters
      const dateFilteredTables = [
        'leads',
        'customers',
        'surveys',
        'projects',
        'quotations',
        'invoices',
        'payments',
      ];

      for (const tableName of dateFilteredTables) {
        const table = (db as any)[tableName];
        if (!table) continue;

        const data = await table
          .where('createdAt')
          .between(startDate, endDate, true, true)
          .toArray();
        
        if (data.length > 0) {
          tables[tableName] = data;
          totalRecords += data.length;
          tablesIncluded.push(tableName);
        }
      }

      const metadata: BackupMetadata = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        database: 'ShineSolarDB',
        recordCount: totalRecords,
        tablesIncluded,
        appVersion: '1.0.0',
      };

      return {
        metadata,
        tables,
      };
    } catch (error) {
      console.error('Export by date range failed:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalRecords: number;
    tableStats: { table: string; count: number }[];
    estimatedSize: number;
  }> {
    let totalRecords = 0;
    const tableStats: { table: string; count: number }[] = [];

    for (const table of db.tables) {
      const count = await table.count();
      totalRecords += count;
      if (count > 0) {
        tableStats.push({ table: table.name, count });
      }
    }

    // Estimate size (rough calculation)
    const estimatedSize = totalRecords * 2000; // Assume 2KB per record on average

    return {
      totalRecords,
      tableStats: tableStats.sort((a, b) => b.count - a.count),
      estimatedSize,
    };
  }

  /**
   * Schedule automatic backup (to be called from app)
   */
  scheduleAutoBackup(intervalHours: number = 24): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        console.log('🔄 Running scheduled backup...');
        await this.downloadBackup();
        console.log('✅ Scheduled backup completed');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Validate backup file before import
   */
  async validateBackupFile(file: File): Promise<{
    valid: boolean;
    errors: string[];
    metadata?: BackupMetadata;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const errors: string[] = [];

      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const backupData: BackupData = JSON.parse(jsonString);

          // Check required fields
          if (!backupData.metadata) {
            errors.push('Missing metadata');
          }
          if (!backupData.tables) {
            errors.push('Missing tables data');
          }
          if (backupData.metadata?.database !== 'ShineSolarDB') {
            errors.push('Invalid database name');
          }

          resolve({
            valid: errors.length === 0,
            errors,
            metadata: backupData.metadata,
          });
        } catch (error) {
          errors.push('Invalid JSON format');
          resolve({ valid: false, errors });
        }
      };

      reader.onerror = () => {
        errors.push('Failed to read file');
        resolve({ valid: false, errors });
      };

      reader.readAsText(file);
    });
  }
}

export const backupService = new BackupService();
