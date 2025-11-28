import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  statusMessage: null,
  statusType: null,

  setLogin: (accessToken, user) => set({ accessToken, user }),

  setAccessToken: (newAccessToken) => set({
    accessToken: newAccessToken
  }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
      statusMessage: 'You have been logged out',
      statusType: 'info',
    }),
}));