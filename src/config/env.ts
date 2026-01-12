import { z } from 'zod';

const EnvSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_AUTO_BACKUP_ENABLED: z.string().optional(),
  VITE_AUTO_BACKUP_HOURS: z.string().optional(),

  // Firebase (optional)
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
});

const raw = EnvSchema.parse(import.meta.env as any);

export const env = {
  googleClientId: raw.VITE_GOOGLE_CLIENT_ID || '',
  autoBackupEnabled: (raw.VITE_AUTO_BACKUP_ENABLED || 'false').toLowerCase() === 'true',
  autoBackupHours: parseInt(raw.VITE_AUTO_BACKUP_HOURS || '24', 10),

  firebaseApiKey: raw.VITE_FIREBASE_API_KEY || '',
  firebaseAuthDomain: raw.VITE_FIREBASE_AUTH_DOMAIN || '',
  firebaseProjectId: raw.VITE_FIREBASE_PROJECT_ID || '',
  firebaseStorageBucket: raw.VITE_FIREBASE_STORAGE_BUCKET || '',
  firebaseMessagingSenderId: raw.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  firebaseAppId: raw.VITE_FIREBASE_APP_ID || '',
};

export type AppEnv = typeof env;
