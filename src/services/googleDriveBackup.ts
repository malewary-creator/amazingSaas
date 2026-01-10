/**
 * Google Drive Backup Service
 * Handles OAuth authentication and backup operations with Google Drive
 */

import { backupService, BackupData } from './backupService';

// Google Drive API configuration
const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');
const BACKUP_FOLDER_NAME = 'ShineSolar_Backups';

interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
  webViewLink?: string;
}

class GoogleDriveBackupService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  private gapiInitialized = false;
  private userCallback: ((response: any) => void) | null = null;

  /**
   * Initialize Google API client
   */
  async initializeGoogleAPI(_clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load GAPI script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        // @ts-ignore
        window.gapi.load('client', async () => {
          try {
            // @ts-ignore
            await window.gapi.client.init({
              apiKey: '', // Not needed for Drive API with OAuth
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            this.gapiInitialized = true;
            console.log('✅ Google API initialized');
            resolve();
          } catch (error) {
            console.error('Failed to initialize Google API:', error);
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize Google OAuth token client
   */
  initializeTokenClient(clientId: string, callback: (response: any) => void): void {
    // Store the user callback
    this.userCallback = callback;
    
    // @ts-ignore
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPES,
      callback: (response: any) => {
        // Call both internal handler and user callback
        if (response.error) {
          console.error('OAuth error:', response.error);
          if (this.userCallback) this.userCallback(response);
          return;
        }
        
        // Store access token
        this.accessToken = response.access_token;
        console.log('✅ Google OAuth token received');
        console.log('Token stored:', !!this.accessToken);
        
        // Set token for gapi client
        // @ts-ignore
        if (window.gapi && window.gapi.client) {
          // @ts-ignore
          window.gapi.client.setToken({
            access_token: response.access_token,
          });
          console.log('✅ Token set for GAPI client');
        }
        
        // Call user callback
        if (this.userCallback) {
          this.userCallback(response);
        }
      },
    });
  }

  /**
   * Request Google OAuth access token
   */
  async requestAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      // Trigger OAuth flow
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
      
      // Note: The callback will be handled by the callback set in initializeTokenClient
      // We resolve immediately since the callback handles the actual response
      resolve('pending');
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(): Promise<{ email: string; name: string }> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      return {
        email: data.email,
        name: data.name,
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Sign out from Google Drive
   */
  signOut(): void {
    this.accessToken = null;
    // @ts-ignore
    if (window.google?.accounts?.oauth2) {
      // @ts-ignore
      window.google.accounts.oauth2.revoke(this.accessToken || '', () => {
        console.log('✅ Signed out from Google Drive');
      });
    }
  }

  /**
   * Get or create backup folder in Google Drive
   */
  private async getOrCreateBackupFolder(): Promise<string> {
    if (!this.gapiInitialized || !this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    try {
      // Search for existing folder
      // @ts-ignore
      const response = await window.gapi.client.drive.files.list({
        q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Create new folder
      // @ts-ignore
      const createResponse = await window.gapi.client.drive.files.create({
        resource: {
          name: BACKUP_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });

      console.log('✅ Created backup folder in Google Drive');
      return createResponse.result.id;
    } catch (error) {
      console.error('Failed to get/create backup folder:', error);
      throw error;
    }
  }

  /**
   * Upload backup to Google Drive
   */
  async uploadBackup(backupData?: BackupData): Promise<{ id: string; name: string }> {
    if (!this.gapiInitialized || !this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // Get backup data if not provided
      const data = backupData || (await backupService.exportFullBackup());
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Check file size (Google Drive has limits)
      const fileSizeMB = blob.size / 1024 / 1024;
      console.log(`📦 Backup size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 500) {
        throw new Error('Backup file too large (>500MB). Consider archiving old data.');
      }
      
      if (fileSizeMB > 100) {
        console.warn(`⚠️ Large upload: ${fileSizeMB.toFixed(2)} MB - this may take a while`);
      }

      // Get backup folder ID
      const folderId = await this.getOrCreateBackupFolder();

      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `ShineSolar_Backup_${timestamp}.json`;

      // Upload file with timeout protection
      const metadata = {
        name: filename,
        mimeType: 'application/json',
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      // Add timeout for large uploads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,modifiedTime', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('✅ Backup uploaded to Google Drive:', result.name);
      
      return {
        id: result.id,
        name: result.name,
      };
    } catch (error) {
      console.error('Failed to upload backup:', error);
      throw error;
    }
  }

  /**
   * List all backups from Google Drive
   */
  async listBackups(): Promise<GoogleDriveFile[]> {
    console.log('📋 Listing backups - GAPI initialized:', this.gapiInitialized, 'Access token:', !!this.accessToken);
    
    if (!this.gapiInitialized || !this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const folderId = await this.getOrCreateBackupFolder();

      // @ts-ignore
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
        fields: 'files(id, name, modifiedTime, size, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 50,
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Download backup from Google Drive
   */
  async downloadBackup(fileId: string): Promise<BackupData> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const jsonString = await response.text();
      const backupData: BackupData = JSON.parse(jsonString);
      
      console.log('✅ Backup downloaded from Google Drive');
      return backupData;
    } catch (error) {
      console.error('Failed to download backup:', error);
      throw error;
    }
  }

  /**
   * Delete backup from Google Drive
   */
  async deleteBackup(fileId: string): Promise<void> {
    if (!this.gapiInitialized || !this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // @ts-ignore
      await window.gapi.client.drive.files.delete({
        fileId,
      });
      
      console.log('✅ Backup deleted from Google Drive');
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Auto-backup to Google Drive (call periodically)
   */
  async autoBackup(): Promise<void> {
    if (!this.isAuthenticated()) {
      console.warn('⚠️ Not authenticated with Google Drive, skipping auto-backup');
      return;
    }

    try {
      console.log('🔄 Running auto-backup to Google Drive...');
      await this.uploadBackup();
      
      // Clean up old backups (keep last 30)
      const backups = await this.listBackups();
      if (backups.length > 30) {
        const toDelete = backups.slice(30);
        for (const backup of toDelete) {
          await this.deleteBackup(backup.id);
        }
        console.log(`🗑️ Deleted ${toDelete.length} old backups`);
      }
      
      console.log('✅ Auto-backup completed');
    } catch (error) {
      console.error('❌ Auto-backup failed:', error);
    }
  }

  /**
   * Restore from Google Drive backup
   */
  async restoreFromCloud(fileId: string, clearExisting: boolean = false): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: number;
  }> {
    try {
      console.log('📥 Downloading backup from Google Drive...');
      const backupData = await this.downloadBackup(fileId);
      
      console.log('📥 Restoring data...');
      const result = await backupService.importBackup(backupData, {
        clearExisting,
        skipDuplicates: !clearExisting,
      });
      
      console.log('✅ Restore completed');
      return result;
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }
}

export const googleDriveBackup = new GoogleDriveBackupService();
export type { GoogleDriveFile };
