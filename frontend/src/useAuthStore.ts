import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiUser } from './types/auth';
import { useCalendarStore } from './useCalendarStore';

export type NotificationType = 'error' | 'success';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface AuthState {
  accessToken: string | null;
  user: ApiUser | null;
  notifications: Notification[];
  setLogin: (accessToken: string, user: ApiUser) => void;
  setAccessToken: (newAccessToken: string | null) => void;
  logout: () => void;
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      notifications: [],
      setLogin: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (newAccessToken) => set({ accessToken: newAccessToken }),
      logout: () => {
        set({
          accessToken: null,
          user: null,
          notifications: [
            { id: Date.now(), message: 'You have been logged out', type: 'success' },
          ],
        })
      },
      addNotification: (message, type) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: Date.now() + Math.random(), message, type },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
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