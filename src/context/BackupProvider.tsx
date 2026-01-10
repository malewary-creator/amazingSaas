import React, { useEffect, useRef } from 'react';
import { env } from '@/config/env';
import { googleDriveBackup } from '@/services/googleDriveBackup';
import { useAuthStore } from '@/store/authStore';

export const BackupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Google API client if a client ID is provided
    (async () => {
      if (env.googleClientId) {
        try {
          await googleDriveBackup.initializeGoogleAPI(env.googleClientId);
        } catch (err) {
          console.warn('Google API init failed:', err);
        }
      }
    })();
  }, []);

  useEffect(() => {
    // Schedule auto-backup only when logged in, env enabled, and Drive authenticated
    if (env.autoBackupEnabled && isAuthenticated && googleDriveBackup.isAuthenticated()) {
      // Clear previous
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const hours = Math.max(1, env.autoBackupHours);
      const ms = hours * 60 * 60 * 1000;
      intervalRef.current = window.setInterval(() => {
        googleDriveBackup.autoBackup().catch(console.error);
      }, ms);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return <>{children}</>;
};
