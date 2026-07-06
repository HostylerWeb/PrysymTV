import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUser } from '@/mocks';
import type { MeResponse } from '@/types/api';
import * as authApi from '@/lib/api/auth';
import {
  applyStreamer,
  applyVerticalCreator,
  fetchMe,
  requestCreatorAccess,
} from '@/lib/api/users';
import { getAuthErrorMessage, loadStoredAccessToken, setAccessToken } from '@/lib/api/client';
import { isApiEnabled } from '@/lib/api/config';

const AUTH_STORAGE_KEY = 'prysym_auth_mode';

type AuthMode = 'login' | 'register';

export type CreatorVerificationContext = {
  description?: string;
  portfolioUrl?: string;
  features: Array<'vertical' | 'live' | 'store'>;
};

type MockAuthContextValue = {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  sessionReady: boolean;
  hasSession: boolean;
  authPromptVisible: boolean;
  authPromptMode: AuthMode;
  login: (email?: string, password?: string) => Promise<void>;
  register: (name?: string, email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  updateProfile: (patch: Partial<MeResponse>) => void;
  refreshUser: () => Promise<void>;
  applyForStreamer: (description: string, idPhotoUrl: string) => Promise<void>;
  applyForVerticalCreator: (
    description: string,
    idDocumentUrl: string,
    portfolioUrl?: string,
  ) => Promise<void>;
  requestCreatorAccess: (body: {
    features: Array<'vertical' | 'live' | 'store'>;
    description?: string;
    acceptedStoreTerms?: boolean;
  }) => Promise<{ results?: Record<string, string> }>;
  requireAuth: (onSuccess?: () => void, mode?: AuthMode) => boolean;
  openAuthPrompt: (mode?: AuthMode, onSuccess?: () => void) => void;
  closeAuthPrompt: () => void;
};

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [authPromptMode, setAuthPromptMode] = useState<AuthMode>('login');
  const pendingSuccess = useRef<(() => void) | null>(null);

  const hydrateUser = useCallback(async () => {
    if (!isApiEnabled()) return null;
    const token = await loadStoredAccessToken();
    if (!token) return null;
    try {
      return await fetchMe();
    } catch {
      await setAccessToken(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mode = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (cancelled) return;
        if (mode === 'guest' || mode === 'user') setHasSession(true);
        if (mode === 'user') {
          const me = await hydrateUser();
          if (cancelled) return;
          setUser(me ?? mockUser);
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateUser]);

  const persistMode = useCallback(async (mode: 'guest' | 'user') => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, mode);
    setHasSession(true);
  }, []);

  const finishAuth = useCallback(() => {
    setAuthPromptVisible(false);
    const cb = pendingSuccess.current;
    pendingSuccess.current = null;
    cb?.();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      /* keep current */
    }
  }, []);

  const login = useCallback(
    async (email = 'demo@prysym.tv', password = 'password') => {
      if (isApiEnabled()) {
        try {
          await authApi.login(email, password);
          const me = await fetchMe();
          setUser(me);
          await persistMode('user');
          finishAuth();
          return;
        } catch {
          /* fall through to mock */
        }
      }
      setUser(mockUser);
      await persistMode('user');
      finishAuth();
    },
    [finishAuth, persistMode],
  );

  const register = useCallback(
    async (name = 'Demo User', email = 'demo@prysym.tv', password = 'password') => {
      if (isApiEnabled()) {
        try {
          const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || 'user';
          await authApi.register({ email, username, password, displayName: name });
          const me = await fetchMe();
          setUser(me);
          await persistMode('user');
          finishAuth();
          return;
        } catch {
          /* fall through */
        }
      }
      await login(email, password);
    },
    [finishAuth, login, persistMode],
  );

  const logout = useCallback(async () => {
    if (isApiEnabled()) {
      try {
        await authApi.logoutApi();
      } catch {
        /* ignore */
      }
    }
    setUser(null);
    await persistMode('guest');
  }, [persistMode]);

  const continueAsGuest = useCallback(async () => {
    setUser(null);
    await persistMode('guest');
  }, [persistMode]);

  const updateProfile = useCallback((patch: Partial<MeResponse>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const applyForStreamer = useCallback(
    async (description: string, idPhotoUrl: string) => {
      try {
        await applyStreamer(description, idPhotoUrl);
        await refreshUser();
      } catch (err) {
        if (isApiEnabled()) throw new Error(getAuthErrorMessage(err));
        updateProfile({ streamerStatus: 'pending' });
      }
    },
    [refreshUser, updateProfile],
  );

  const applyForVerticalCreator = useCallback(
    async (description: string, idDocumentUrl: string, portfolioUrl?: string) => {
      try {
        await applyVerticalCreator(description, idDocumentUrl, portfolioUrl);
        await refreshUser();
      } catch (err) {
        if (isApiEnabled()) throw new Error(getAuthErrorMessage(err));
        updateProfile({ verticalCreatorStatus: 'pending' });
      }
    },
    [refreshUser, updateProfile],
  );

  const requestCreatorAccessFn = useCallback(
    async (body: {
      features: Array<'vertical' | 'live' | 'store'>;
      description?: string;
      acceptedStoreTerms?: boolean;
    }) => {
      try {
        const res = await requestCreatorAccess(body);
        await refreshUser();
        return res;
      } catch (err) {
        if (isApiEnabled()) throw new Error(getAuthErrorMessage(err));
        const patch: Partial<MeResponse> = {};
        if (body.features.includes('live')) patch.streamerStatus = 'pending';
        if (body.features.includes('vertical')) patch.verticalCreatorStatus = 'pending';
        if (body.features.includes('store')) patch.storeCreatorStatus = 'pending';
        updateProfile(patch);
        return { results: {} };
      }
    },
    [refreshUser, updateProfile],
  );

  const openAuthPrompt = useCallback((mode: AuthMode = 'login', onSuccess?: () => void) => {
    pendingSuccess.current = onSuccess ?? null;
    setAuthPromptMode(mode);
    setAuthPromptVisible(true);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptVisible(false);
    pendingSuccess.current = null;
  }, []);

  const requireAuth = useCallback(
    (onSuccess?: () => void, mode: AuthMode = 'login') => {
      if (user) {
        onSuccess?.();
        return true;
      }
      openAuthPrompt(mode, onSuccess);
      return false;
    },
    [openAuthPrompt, user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isGuest: hasSession && user === null,
      sessionReady,
      hasSession,
      authPromptVisible,
      authPromptMode,
      login,
      register,
      logout,
      continueAsGuest,
      updateProfile,
      refreshUser,
      applyForStreamer,
      applyForVerticalCreator,
      requestCreatorAccess: requestCreatorAccessFn,
      requireAuth,
      openAuthPrompt,
      closeAuthPrompt,
    }),
    [
      user,
      hasSession,
      sessionReady,
      authPromptVisible,
      authPromptMode,
      login,
      register,
      logout,
      continueAsGuest,
      updateProfile,
      refreshUser,
      applyForStreamer,
      applyForVerticalCreator,
      requestCreatorAccessFn,
      requireAuth,
      openAuthPrompt,
      closeAuthPrompt,
    ],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error('useMockAuth must be used within MockAuthProvider');
  return ctx;
}

export { getAuthErrorMessage };
