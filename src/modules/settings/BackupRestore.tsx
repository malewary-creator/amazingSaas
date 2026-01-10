/**
 * Backup & Restore Page
 * Local and cloud backup management
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  Cloud,
  CloudOff,
  Database,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { backupService } from '@/services/backupService';
import { googleDriveBackup, GoogleDriveFile } from '@/services/googleDriveBackup';
import { useBackupStore } from '@/store/backupStore';
import { useToastStore } from '@/store/toastStore';
import { db } from '@/services/database';

export default function BackupRestore() {
  const toast = useToastStore();
  const backupStore = useBackupStore();

  const [dbStats, setDbStats] = useState<{ total: number; tables: any }>({
    total: 0,
    tables: {},
  });
  const [loading, setLoading] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<GoogleDriveFile[]>([]);
  const [showCloudBackups, setShowCloudBackups] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<GoogleDriveFile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load database statistics
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await db.getStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Initialize Google Drive (if connected)
  useEffect(() => {
    if (backupStore.isGoogleDriveConnected) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId) {
        googleDriveBackup.initializeGoogleAPI(clientId).catch(console.error);
      }
    }
  }, [backupStore.isGoogleDriveConnected]);

  // Export local backup
  const handleExportBackup = async () => {
    setLoading(true);
    try {
      // Check database size first
      const stats = await backupService.getBackupStats();
      const estimatedSizeMB = stats.estimatedSize / 1024 / 1024;
      
      if (estimatedSizeMB > 100) {
        const confirmed = window.confirm(
          `This backup is large (~${estimatedSizeMB.toFixed(0)}MB). It may take some time to export. Continue?`
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      
      await backupService.downloadBackup();
      backupStore.setLastLocalBackup(new Date());
      toast.success('Backup exported successfully!');
      await loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export backup';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Import backup from file
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (warn if > 100MB)
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 500) {
      toast.error('File too large (>500MB). Please contact support.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    try {
      // Validate file first
      const validation = await backupService.validateBackupFile(file);
      if (!validation.valid) {
        toast.error(`Invalid backup file: ${validation.errors.join(', ')}`);
        return;
      }
      
      // Show info about the backup
      if (validation.metadata) {
        const recordCount = validation.metadata.recordCount;
        const confirmed = window.confirm(
          `This backup contains ${recordCount} records from ${new Date(validation.metadata.exportDate).toLocaleString()}. Import and merge with existing data?`
        );
        if (!confirmed) {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }

      // Import data
      const result = await backupService.importFromFile(file, {
        clearExisting: false,
        skipDuplicates: true,
      });

      toast.success(
        `Backup restored! Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`
      );
      await loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import backup';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Connect to Google Drive
  const handleConnectGoogleDrive = async () => {
    setLoading(true);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        toast.error('Google Client ID not configured. Please check your .env file.');
        setLoading(false);
        return;
      }

      // Initialize Google API
      await googleDriveBackup.initializeGoogleAPI(clientId);

      // Initialize token client and set callback
      googleDriveBackup.initializeTokenClient(clientId, async (response: any) => {
        if (response.error) {
          console.error('OAuth error:', response.error);
          toast.error(`Google authentication failed: ${response.error}`);
          setLoading(false);
          return;
        }

        // Successfully authenticated
        console.log('✅ Google OAuth successful');
        
        try {
          // Get user info from Google API
          const userInfo = await googleDriveBackup.getUserInfo();
          const userEmail = userInfo.email || 'Connected User';
          
          backupStore.setGoogleDriveConnected(userEmail);
          backupStore.setLastSyncDate(new Date());
          toast.success(`Connected as ${userEmail}!`);
        } catch (error) {
          console.error('Failed to get user info:', error);
          // Still mark as connected even if we can't get email
          backupStore.setGoogleDriveConnected('Connected User');
          toast.success('Connected to Google Drive!');
        }
        
        setLoading(false);
      });

      // Request access token (this will trigger the OAuth popup)
      await googleDriveBackup.requestAccessToken();
      
    } catch (error) {
      console.error('Google Drive connection error:', error);
      const message = error instanceof Error ? error.message : 'Failed to connect to Google Drive';
      toast.error(message);
      setLoading(false);
    }
  };

  // Disconnect from Google Drive
  const handleDisconnectGoogleDrive = () => {
    googleDriveBackup.signOut();
    backupStore.disconnectGoogleDrive();
    toast.success('Disconnected from Google Drive');
  };

  // Upload backup to Google Drive
  const handleUploadToCloud = async () => {
    setLoading(true);
    try {
      // Check database size before upload
      const stats = await backupService.getBackupStats();
      const estimatedSizeMB = stats.estimatedSize / 1024 / 1024;
      
      if (estimatedSizeMB > 100) {
        toast.info(`Uploading large backup (~${estimatedSizeMB.toFixed(0)}MB). Please wait...`);
      }
      
      await googleDriveBackup.uploadBackup();
      backupStore.setLastCloudBackup(new Date());
      toast.success('Backup uploaded to Google Drive!');
      await loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload to Google Drive';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // List cloud backups
  const handleViewCloudBackups = async () => {
    setLoading(true);
    try {
      const backups = await googleDriveBackup.listBackups();
      setCloudBackups(backups);
      setShowCloudBackups(true);
      
      if (backups.length === 0) {
        toast.info('No cloud backups found. Create your first backup!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load cloud backups';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Restore from cloud
  const handleRestoreFromCloud = async (clearExisting: boolean = false) => {
    if (!selectedBackup) return;

    setLoading(true);
    try {
      const fileSizeMB = parseInt(selectedBackup.size) / 1024 / 1024;
      
      if (fileSizeMB > 100) {
        toast.info(`Downloading large backup (~${fileSizeMB.toFixed(0)}MB). Please wait...`);
      }
      
      const result = await googleDriveBackup.restoreFromCloud(selectedBackup.id, clearExisting);
      toast.success(
        `Restored from cloud! Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`
      );
      setShowRestoreModal(false);
      setSelectedBackup(null);
      await loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore from cloud';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    setLoading(true);
    try {
      const stats = await db.getStats();
      if (stats.total === 0) {
        toast.info('Database is already empty');
        setShowClearConfirm(false);
        setLoading(false);
        return;
      }
      
      await db.clearAllData();
      await loadStats();
      setShowClearConfirm(false);
      toast.success('All data cleared successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear data';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (isNaN(size)) return 'Unknown';
    return (size / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleString();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
        <p className="mt-2 text-gray-600">
          Manage your data backups and restore from local or cloud storage
        </p>
      </div>

      {/* Database Statistics */}
      <Card title="Database Statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Total Records</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{dbStats.total}</div>
          </div>

          {Object.entries(dbStats.tables)
            .filter(([_, count]) => (count as number) > 0)
            .slice(0, 7)
            .map(([table, count]) => (
              <div key={table} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 capitalize mb-1">{table}</div>
                <div className="text-xl font-semibold text-gray-900">{count as number}</div>
              </div>
            ))}
        </div>
      </Card>

      {/* Local Backup */}
      <Card title="Local Backup" description="Export and import backups from your computer">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Last Local Backup</div>
                <div className="text-sm text-gray-600">{formatDate(backupStore.lastLocalBackup)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportBackup}
              loading={loading}
            >
              Export Backup
            </Button>

            <label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
                disabled={loading}
              />
              <Button
                variant="secondary"
                icon={<Upload className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                loading={loading}
              >
                Import Backup
              </Button>
            </label>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <strong>Tip:</strong> Regular backups protect your data against browser issues. Download
                backups to your computer and store them safely.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Google Drive Backup */}
      <Card
        title="Cloud Backup (Google Drive)"
        description="Automatically backup to Google Drive for maximum protection"
      >
        <div className="space-y-4">
          {backupStore.isGoogleDriveConnected ? (
            <>
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">Connected to Google Drive</div>
                    <div className="text-sm text-green-700">{backupStore.googleDriveEmail}</div>
                    <div className="text-xs text-green-600 mt-1">
                      Last sync: {formatDate(backupStore.lastSyncDate)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<CloudOff className="h-4 w-4" />}
                  onClick={handleDisconnectGoogleDrive}
                >
                  Disconnect
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  icon={<Cloud className="h-4 w-4" />}
                  onClick={handleUploadToCloud}
                  loading={loading}
                >
                  Backup to Cloud Now
                </Button>

                <Button
                  variant="secondary"
                  icon={<Calendar className="h-4 w-4" />}
                  onClick={handleViewCloudBackups}
                  loading={loading}
                >
                  View Cloud Backups
                </Button>
              </div>

              {backupStore.lastCloudBackup && (
                <div className="text-sm text-gray-600">
                  Last cloud backup: {formatDate(backupStore.lastCloudBackup)}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CloudOff className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Not connected to Google Drive</div>
                  <div className="text-sm text-gray-600">
                    Connect to enable automatic cloud backups
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                icon={<Cloud className="h-4 w-4" />}
                onClick={handleConnectGoogleDrive}
                loading={loading}
              >
                Connect Google Drive
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-900">Clear All Data</div>
                <div className="text-sm text-red-700 mt-1">
                  This will permanently delete all data from the database. This action cannot be undone!
                  Make sure you have a backup before proceeding.
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* Cloud Backups Modal */}
      <Modal
        isOpen={showCloudBackups}
        onClose={() => setShowCloudBackups(false)}
        title="Cloud Backups"
        description="Select a backup to restore"
        size="lg"
      >
        {cloudBackups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No cloud backups found</div>
        ) : (
          <div className="space-y-2">
            {cloudBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">{backup.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(backup.modifiedTime)} • {formatFileSize(backup.size)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedBackup(backup);
                    setShowRestoreModal(true);
                  }}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedBackup(null);
        }}
        title="Restore from Cloud"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowRestoreModal(false);
                setSelectedBackup(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleRestoreFromCloud(false)}
              loading={loading}
            >
              Merge with Existing
            </Button>
            <Button
              variant="danger"
              onClick={() => handleRestoreFromCloud(true)}
              loading={loading}
            >
              Replace All Data
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to restore from backup: <strong>{selectedBackup?.name}</strong>
          </p>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-900">
                <strong>Choose an option:</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>
                    <strong>Merge:</strong> Add backup data to existing data (keeps both, skips duplicates)
                  </li>
                  <li>
                    <strong>Replace:</strong> Delete all existing data and restore from backup
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllData}
        title="Clear All Data"
        description="Are you absolutely sure? This will permanently delete all data including customers, invoices, payments, and everything else. This action cannot be undone!"
        confirmText="Yes, Clear Everything"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
