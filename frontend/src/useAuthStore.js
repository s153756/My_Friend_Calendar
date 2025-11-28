import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,

  setLogin: (accessToken, user) => set({ accessToken, user }),
}));