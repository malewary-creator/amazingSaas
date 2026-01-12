import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirebaseClient } from './firebase';

/**
 * Firebase Authentication wrapper.
 *
 * Safety intent:
 * - If Firebase is not configured, fail with a clear error.
 * - Keep app-level auth (Zustand) separate from Firebase auth; callers decide how to map.
 */
export const firebaseAuthService = {
  async signInWithGooglePopup(): Promise<{ uid: string; email?: string | null; displayName?: string | null; idToken: string }> {
    const client = getFirebaseClient();
    if (!client) throw new Error('Firebase is not configured');

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(client.auth, provider);
    const idToken = await credential.user.getIdToken();

    return {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      idToken,
    };
  },

  async logout(): Promise<void> {
    const client = getFirebaseClient();
    if (!client) return;
    await signOut(client.auth);
  },
};
