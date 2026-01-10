import { z } from 'zod';

const EnvSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_AUTO_BACKUP_ENABLED: z.string().optional(),
  VITE_AUTO_BACKUP_HOURS: z.string().optional(),
});

const raw = EnvSchema.parse(import.meta.env as any);

export const env = {
  googleClientId: raw.VITE_GOOGLE_CLIENT_ID || '',
  autoBackupEnabled: (raw.VITE_AUTO_BACKUP_ENABLED || 'false').toLowerCase() === 'true',
  autoBackupHours: parseInt(raw.VITE_AUTO_BACKUP_HOURS || '24', 10),
};

export type AppEnv = typeof env;
