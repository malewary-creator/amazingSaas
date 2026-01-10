/**
 * Authentication Store using Zustand
 * Manages user authentication state and session
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Actions
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: (user, token) => {
        set({
          user,
          isAuthenticated: true,
          token: token || null,
        });
        
        // Update last login
        user.lastLogin = new Date();
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'shine-solar-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);
