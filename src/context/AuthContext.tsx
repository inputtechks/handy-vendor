import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isReady = useRef(false);

  const fetchAccessState = useCallback(async (sess: Session | null) => {
    if (!sess?.user) {
      setSession(null);
      setUser(null);
      setIsApproved(false);
      setIsAdmin(false);
      return;
    }

    setSession(sess);
    setUser(sess.user);

    try {
      const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("is_approved").eq("id", sess.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", sess.user.id),
      ]);

      // Keep previous access state on transient failures; do not wrongly downgrade verified users.
      if (!profileError) {
        setIsApproved(profile?.is_approved ?? false);
      }

      if (!rolesError) {
        setIsAdmin(roles?.some((r: { role: string }) => r.role === "admin") ?? false);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!isReady.current) return;
      // Show spinner while we fetch approval status — prevents verification page flash
      setLoading(true);
      void fetchAccessState(sess).then(() => setLoading(false));
    });

    void supabase.auth.getSession().then(({ data: { session: sess } }) => {
      void fetchAccessState(sess).then(() => {
        isReady.current = true;
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, [fetchAccessState]);

  // Re-check approval while user is pending (focus + interval) so approved users stop seeing verification promptly.
  useEffect(() => {
    if (!session?.user || isApproved === true) return;

    const recheck = () => {
      void fetchAccessState(session);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recheck();
    };

    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(recheck, 10000);

    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [session, isApproved, fetchAccessState]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isApproved, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
