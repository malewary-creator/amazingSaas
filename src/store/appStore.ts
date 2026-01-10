/**
 * App Store - Global application state
 */

import { create } from 'zustand';

interface AppState {
  // UI state
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  
  // Selected branch (for multi-branch)
  selectedBranchId: number | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean, message?: string) => void;
  setSelectedBranch: (branchId: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  theme: 'light',
  isLoading: false,
  loadingMessage: '',
  selectedBranchId: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  setTheme: (theme) => set({ theme }),
  
  setLoading: (loading, message = '') => 
    set({ isLoading: loading, loadingMessage: message }),
  
  setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
}));
