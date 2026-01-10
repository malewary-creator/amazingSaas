/**
 * Backup Store
 * Manages backup state, Google Drive connection, and sync status
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BackupState {
  // Google Drive connection
  isGoogleDriveConnected: boolean;
  googleDriveEmail: string | null;
  lastSyncDate: Date | null;

  // Auto-backup settings
  autoBackupEnabled: boolean;
  autoBackupInterval: 'daily' | 'weekly' | 'monthly';
  lastAutoBackup: Date | null;

  // Backup history
  lastLocalBackup: Date | null;
  lastCloudBackup: Date | null;

  // Settings
  backupRetentionDays: number; // Keep backups for X days
  maxCloudBackups: number; // Maximum cloud backups to keep

  // Actions
  setGoogleDriveConnected: (email: string) => void;
  disconnectGoogleDrive: () => void;
  setLastSyncDate: (date: Date) => void;
  setAutoBackupEnabled: (enabled: boolean) => void;
  setAutoBackupInterval: (interval: 'daily' | 'weekly' | 'monthly') => void;
  setLastAutoBackup: (date: Date) => void;
  setLastLocalBackup: (date: Date) => void;
  setLastCloudBackup: (date: Date) => void;
  setBackupRetentionDays: (days: number) => void;
  setMaxCloudBackups: (max: number) => void;
}

export const useBackupStore = create<BackupState>()(
  persist(
    (set) => ({
      // Initial state
      isGoogleDriveConnected: false,
      googleDriveEmail: null,
      lastSyncDate: null,
      autoBackupEnabled: false,
      autoBackupInterval: 'daily',
      lastAutoBackup: null,
      lastLocalBackup: null,
      lastCloudBackup: null,
      backupRetentionDays: 30,
      maxCloudBackups: 30,

      // Actions
      setGoogleDriveConnected: (email) =>
        set({
          isGoogleDriveConnected: true,
          googleDriveEmail: email,
          lastSyncDate: new Date(),
        }),

      disconnectGoogleDrive: () =>
        set({
          isGoogleDriveConnected: false,
          googleDriveEmail: null,
          lastSyncDate: null,
        }),

      setLastSyncDate: (date) => set({ lastSyncDate: date }),

      setAutoBackupEnabled: (enabled) => set({ autoBackupEnabled: enabled }),

      setAutoBackupInterval: (interval) => set({ autoBackupInterval: interval }),

      setLastAutoBackup: (date) => set({ lastAutoBackup: date }),

      setLastLocalBackup: (date) => set({ lastLocalBackup: date }),

      setLastCloudBackup: (date) => set({ lastCloudBackup: date }),

      setBackupRetentionDays: (days) => set({ backupRetentionDays: days }),

      setMaxCloudBackups: (max) => set({ maxCloudBackups: max }),
    }),
    {
      name: 'backup-storage',
    }
  )
);
