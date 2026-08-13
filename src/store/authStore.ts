import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { extractUserFromToken } from '../utils/jwt';
import { queryClient } from '../queryClient';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  getUser: () => User | null;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      login: (token: string) => {
        queryClient.clear();
        set({ token, isAuthenticated: true });
      },
      logout: () => {
        queryClient.clear();
        set({ token: null, isAuthenticated: false });
      },
      getUser: () => {
        const state = get();
        if (!state.token) return null;
        return extractUserFromToken(state.token);
      },
      isAdmin: () => {
        const state = get();
        if (!state.token) return false;
        const user = extractUserFromToken(state.token);
        return user?.role === 'admin' || user?.role === 'ADMIN';
      },
    }),
    {
      name: 'auth-storage',
    }
  )
); 