'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Backend

export interface User {
  firstname: string;
  role: string;
  photo?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setToken: (accessToken: string, refreshToken: string) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (loginValue: string, password: string) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: loginValue, password })
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(error.message || 'Login failed');
        }

        const data = await res.json();
        
        // Store tokens in cookies for middleware access
        document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
        
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: {
            firstname: data.firstname,
            role: data.role,
            photo: data.photo
          },
          isAuthenticated: true
        });
      },

      logout: () => {
        // Clear cookies
        document.cookie = 'access_token=; path=/; max-age=0';
        document.cookie = 'refresh_token=; path=/; max-age=0';
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false
        });
        redirect('/auth/sign-in');
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!res.ok) {
          get().logout();
          return;
        }

        const data = await res.json();
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        });
      },

      setToken: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
