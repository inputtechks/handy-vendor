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

const APPROVAL_CACHE_KEY = "hv_approved_users_v1";

type ApprovalCache = Record<string, true>;

function readApprovalCache(): ApprovalCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(APPROVAL_CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const normalized: ApprovalCache = {};

    for (const [userId, approved] of Object.entries(parsed ?? {})) {
      if (approved === true) normalized[userId] = true;
    }

    return normalized;
  } catch {
    return {};
  }
}

function writeApprovalCache(cache: ApprovalCache) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APPROVAL_CACHE_KEY, JSON.stringify(cache));
}

function getCachedApproval(userId: string): boolean {
  const cache = readApprovalCache();
  return cache[userId] === true;
}

function setCachedApproval(userId: string, approved: boolean) {
  const cache = readApprovalCache();

  if (approved) {
    cache[userId] = true;
  } else {
    delete cache[userId];
  }

  writeApprovalCache(cache);
}

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

    const cachedApproved = getCachedApproval(sess.user.id);
    if (cachedApproved) {
      // Immediate unlock for previously approved users (prevents verification flicker/offline false negatives).
      setIsApproved(true);
    }

    try {
      const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("is_approved").eq("id", sess.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", sess.user.id),
      ]);

      if (!profileError) {
        const approved = profile?.is_approved ?? false;
        setIsApproved(approved);
        setCachedApproval(sess.user.id, approved);
      } else if (cachedApproved) {
        setIsApproved(true);
      }

      if (!rolesError) {
        setIsAdmin(roles?.some((r: { role: string }) => r.role === "admin") ?? false);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
      if (cachedApproved) {
        setIsApproved(true);
      }
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!isReady.current) return;
      // Show spinner while we fetch approval status — prevents verification page flash.
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
