import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getMe,
  loginWithEmail,
  logout as logoutApi,
  reissueTokens,
  signupWithEmail,
} from '@/src/auth/api';
import { SESSION_STORAGE_KEY } from '@/src/auth/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          let parsed = JSON.parse(raw);
          /** 로그인 유지: 저장된 refresh로 액세스 토큰 갱신 */
          if (parsed?.refreshToken) {
            try {
              const tokens = await reissueTokens(parsed.refreshToken);
              parsed = {
                ...parsed,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken ?? parsed.refreshToken,
              };
              await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
            } catch {
              parsed = null;
              await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
            }
          }
          setSession(parsed);
        }
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const persistSession = async (nextSession) => {
    setSession(nextSession);
    if (nextSession) {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const signInEmail = async ({ email, password }) => {
    const tokens = await loginWithEmail(email, password);
    const nextSession = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: null,
    };
    await persistSession(nextSession);
    return nextSession;
  };

  const signUpEmail = async (payload) => {
    await signupWithEmail(payload);
  };

  const refreshMe = async () => {
    if (!session?.accessToken) return null;
    const json = await getMe(session.accessToken);
    const payload = json?.data ?? json;
    const nextSession = { ...session, user: payload.user ?? payload ?? null };
    await persistSession(nextSession);
    return nextSession;
  };

  const signOut = async () => {
    try {
      if (session?.accessToken) {
        await logoutApi(session.accessToken);
      }
    } finally {
      await persistSession(null);
    }
  };

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.accessToken),
    isBootstrapping,
    signInEmail,
    signUpEmail,
    refreshMe,
    reissueSession: async () => {
      if (!session?.refreshToken) return null;
      const tokens = await reissueTokens(session.refreshToken);
      const next = {
        ...session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? session.refreshToken,
      };
      await persistSession(next);
      return next;
    },
    signOut,
  }), [session, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
