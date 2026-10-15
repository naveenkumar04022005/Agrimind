"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api, { UserProfile } from "@/lib/api";

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: AuthError | null; user: UserProfile | null }>;
  signInWithGoogle: (data?: {
    credential?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  }) => Promise<{ error: AuthError | null; user: UserProfile | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Checks if backend API is configured
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  );

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = api.getToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setToken(storedToken);

      try {
        const currentUser = await api.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("[Agrimind Auth] Session expired or invalid token:", err);
        api.removeToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login({ email: email.trim(), password });
      setUser(res.user);
      setToken(res.access_token);
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      return { error: { message: msg } };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        const res = await api.register({
          name: fullName?.trim(),
          email: email.trim(),
          password,
        });
        setUser(res.user);
        setToken(res.access_token);
        return { error: null, user: res.user };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Registration failed.";
        return { error: { message: msg }, user: null };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (data?: {
      credential?: string;
      email?: string;
      name?: string;
      avatar_url?: string;
    }) => {
      try {
        const payload = data || {
          email: "farmer.google@gmail.com",
          name: "Farmer with Google",
        };
        const res = await api.loginWithGoogle(payload);
        setUser(res.user);
        setToken(res.access_token);
        return { error: null, user: res.user };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Google authentication failed.";
        return { error: { message: msg }, user: null };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
      setUser(null);
      setToken(null);
      return { error: null };
    } catch (err: unknown) {
      setUser(null);
      setToken(null);
      return { error: err as Error };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
