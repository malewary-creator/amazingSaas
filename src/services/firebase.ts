import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { env } from '@/config/env';

/**
 * Firebase client initialization (optional).
 *
 * Invariant intent:
 * - Do not crash the app when Firebase env vars are not configured.
 * - Only initialize Firebase when all required config values exist.
 * - Callers that require Firebase must explicitly assert availability.
 */

export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  storage: FirebaseStorage;
};

const config = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
};

const isConfigured = Object.values(config).every(v => typeof v === 'string' && v.trim().length > 0);

let cached: FirebaseClient | null = null;

export function getFirebaseClient(): FirebaseClient | null {
  if (!isConfigured) return null;
  if (cached) return cached;

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  cached = {
    app,
    auth: getAuth(app),
    storage: getStorage(app),
  };
  return cached;
}

export function requireFirebaseClient(): FirebaseClient {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_* env vars (see .env.example) to enable Firebase features.'
    );
  }
  return client;
}
