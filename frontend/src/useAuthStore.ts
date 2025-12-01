import { create } from 'zustand';
import type { ApiUser } from './types/auth';

type StatusType = 'info' | 'error' | 'success' | null;

interface AuthState {
  accessToken: string | null;
  user: ApiUser | null;
  statusMessage: string | null;
  statusType: StatusType;
  setLogin: (accessToken: string, user: ApiUser) => void;
  setAccessToken: (newAccessToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  statusMessage: null,
  statusType: null,
  setLogin: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (newAccessToken) => set({ accessToken: newAccessToken }),
  logout: () =>
    set({
      accessToken: null,
      user: null,
      statusMessage: 'You have been logged out',
      statusType: 'info',
    }),
}));
