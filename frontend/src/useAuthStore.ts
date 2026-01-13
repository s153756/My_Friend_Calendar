import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiUser } from './types/auth';

type StatusType = 'info' | 'error' | 'success' | null;


interface AuthState {
  accessToken: string | null;
  user: ApiUser | null;
  errors: { id: number; message: string }[];
  successMessage: string[];
  statusType: StatusType;
  setLogin: (accessToken: string, user: ApiUser) => void;
  setAccessToken: (newAccessToken: string | null) => void;
  logout: () => void;
  addError: (message: string) => void;
  removeError: (id: number) => void;
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      errors: [],
      successMessage: [],
      statusType: null,
      setLogin: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (newAccessToken) => set({ accessToken: newAccessToken }),
      logout: () =>
        set({
          accessToken: null,
          user: null,
          successMessage: ['You have been logged out'],
        }),
      addError: (message) => set((state) => ({
        errors: [...state.errors, { id: Date.now() + Math.random(), message }]
      })),
      removeError: (id) => set((state) => ({
        errors: state.errors.filter((e) => e.id !== id)
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);