import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ensureAccessToken,
  clearSessionTokens,
  getAuthErrorMessage,
} from '@/lib/api/client';
import { login as loginApi } from '@/lib/api/auth';
import { fetchMe } from '@/lib/api/users';
import type { MeResponse } from '@/types/api';

type AuthContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  user: MeResponse | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<MeResponse | null>(null);

  const refreshUser = useCallback(async () => {
    const token = await ensureAccessToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    const me = await fetchMe();
    setUser(me);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await ensureAccessToken();
        if (!token) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setUser(null);
            setReady(true);
          }
          return;
        }
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
          setIsAuthenticated(true);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await loginApi(email.trim(), password);
      await refreshUser();
    } catch (err) {
      throw new Error(getAuthErrorMessage(err));
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await clearSessionTokens();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ ready, isAuthenticated, user, login, logout, refreshUser }),
    [ready, isAuthenticated, user, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
