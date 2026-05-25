import type { Session, User } from "@supabase/supabase-js";
import * as SplashScreen from "expo-splash-screen";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { INIT_SESSION_ERROR, mapAuthError } from "@/lib/authErrors";
import { supabase, supabaseConfigError } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  initError: string | null;
  retryBootstrap: () => void;
  signIn: (email: string, password: string) => ReturnType<
    typeof supabase.auth.signInWithPassword
  >;
  signUp: (email: string, password: string) => ReturnType<
    typeof supabase.auth.signUp
  >;
  resendSignupEmail: (email: string) => ReturnType<typeof supabase.auth.resend>;
  signOut: () => ReturnType<typeof supabase.auth.signOut>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  const bootstrapSession = useCallback(async (cancelled: () => boolean) => {
    if (supabaseConfigError) {
      if (!cancelled()) {
        setInitError(supabaseConfigError);
        setSession(null);
        setInitialized(true);
      }
      return;
    }

    try {
      const { data: { session: next }, error } = await supabase.auth.getSession();
      if (cancelled()) return;

      if (error) {
        setInitError(mapAuthError(error));
        setSession(null);
      } else {
        setInitError(null);
        setSession(next);
      }
    } catch {
      if (!cancelled()) {
        setInitError(INIT_SESSION_ERROR);
        setSession(null);
      }
    } finally {
      if (!cancelled()) {
        setInitialized(true);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setInitialized(false);
    setInitError(null);

    void bootstrapSession(() => cancelled);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!cancelled) {
        setSession(next);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [bootstrapAttempt, bootstrapSession]);

  useEffect(() => {
    if (initialized) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [initialized]);

  const retryBootstrap = useCallback(() => {
    setBootstrapAttempt((n) => n + 1);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback((email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  }, []);

  const resendSignupEmail = useCallback((email: string) => {
    return supabase.auth.resend({
      type: "signup",
      email,
    });
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      initialized,
      initError,
      retryBootstrap,
      signIn,
      signUp,
      resendSignupEmail,
      signOut,
    }),
    [
      session,
      initialized,
      initError,
      retryBootstrap,
      signIn,
      signUp,
      resendSignupEmail,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
