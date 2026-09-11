"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isCloudConfigured } from "@/lib/supabase/config";
import { accountError } from "@/lib/supabase/errors";

type AuthState = { session: Session | null; loading: boolean; error: string; configured: boolean };
const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  error: "",
  configured: false,
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isCloudConfigured();
  const [state, setState] = useState({
    session: null as Session | null,
    loading: configured,
    error: "",
  });
  useEffect(() => {
    if (!configured) return;
    let active = true;
    let cleanup: (() => void) | undefined;
    try {
      const client = getSupabaseClient();
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        // Never call async Supabase methods inside this callback (auth lock).
        if (active) setState({ session, loading: false, error: "" });
      });
      cleanup = () => data.subscription.unsubscribe();
      void client.auth
        .getSession()
        .then(({ data, error }) => {
          if (active)
            setState({
              session: data.session,
              loading: false,
              error: error ? accountError(error) : "",
            });
        })
        .catch((error) => {
          if (active) setState({ session: null, loading: false, error: accountError(error) });
        });
    } catch (error) {
      setState({
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : accountError(error),
      });
    }
    return () => {
      active = false;
      cleanup?.();
    };
  }, [configured]);
  return <AuthContext.Provider value={{ ...state, configured }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
