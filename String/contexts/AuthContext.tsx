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

import { supabase } from "@/lib/supabase";

type AuthContextValue = { // what this context exports and the information
  session: Session | null;
  user: User | null;
  initialized: boolean;
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
  const [session, setSession] = useState<Session | null>(null); // going to hold what Supabase reports as the current session
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // runs on mount and gathers the stored session from supabase
    supabase.auth.getSession().then(({ data: { session: next } }) => {
      if (!cancelled) { // error catching --> if user cancels during getting the session
        setSession(next);
        setInitialized(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

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
      signIn,
      signUp,
      resendSignupEmail,
      signOut,
    }),
    [session, initialized, signIn, signUp, resendSignupEmail, signOut],
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
