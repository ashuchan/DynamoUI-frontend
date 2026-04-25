import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../lib/apiClient';
import { setCurrentToken, tokenStorage, type AuthSnapshot } from './tokenStorage';
import type {
  AuthResponse,
  LoginPayload,
  SignupPayload,
  TenantSummary,
  UserSummary,
} from './types';

interface AuthContextValue {
  user: UserSummary | null;
  tenant: TenantSummary | null;
  tenants: TenantSummary[];
  isAuthenticated: boolean;
  isBooting: boolean;
  error: string | null;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AuthSnapshot | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate from localStorage on first mount, then verify the token against
  // the server so a revoked or invalidated session does not boot as logged-in.
  useEffect(() => {
    let cancelled = false;
    const stored = tokenStorage.read();
    if (!stored) {
      setIsBooting(false);
      return;
    }
    setCurrentToken(stored.token);
    setSnapshot(stored.snapshot);
    (async () => {
      try {
        const me = await apiClient.authMe();
        if (cancelled) return;
        setSnapshot((prev) => ({
          user: me.user,
          tenant: me.tenant,
          tenants: me.tenants,
          expires_at: prev?.expires_at ?? stored.snapshot.expires_at,
        }));
      } catch {
        if (cancelled) return;
        tokenStorage.clear();
        setCurrentToken(null);
        setSnapshot(null);
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyResponse = useCallback((response: AuthResponse) => {
    tokenStorage.write(response);
    setCurrentToken(response.access_token);
    setSnapshot({
      user: response.user,
      tenant: response.tenant,
      tenants: response.tenants,
      expires_at: Math.floor(Date.now() / 1000) + response.expires_in,
    });
    setError(null);
  }, []);

  const signup = useCallback(
    async (payload: SignupPayload) => {
      try {
        const response = await apiClient.authSignup(payload);
        applyResponse(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Signup failed');
        throw err;
      }
    },
    [applyResponse],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        const response = await apiClient.authLogin(payload);
        applyResponse(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
        throw err;
      }
    },
    [applyResponse],
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      try {
        const response = await apiClient.authGoogle(idToken);
        applyResponse(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed');
        throw err;
      }
    },
    [applyResponse],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setCurrentToken(null);
    setSnapshot(null);
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: snapshot?.user ?? null,
      tenant: snapshot?.tenant ?? null,
      tenants: snapshot?.tenants ?? [],
      isAuthenticated: snapshot !== null,
      isBooting,
      error,
      signup,
      login,
      googleLogin,
      logout,
    }),
    [snapshot, isBooting, error, signup, login, googleLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}
