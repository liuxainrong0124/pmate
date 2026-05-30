"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Role } from "@/lib/permissions";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  role: "member",
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

const ROLE_CACHE_KEY = "pulse_cached_role";

function getCachedRole(): Role {
  if (typeof window === "undefined") return "member";
  const cached = localStorage.getItem(ROLE_CACHE_KEY);
  if (cached === "admin" || cached === "member" || cached === "viewer") return cached;
  return "member";
}

function setCachedRole(role: Role) {
  localStorage.setItem(ROLE_CACHE_KEY, role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(getCachedRole);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setRole(getCachedRole());
          setLoading(false);
        }
      }
    );

    // Safety: hide loading after 3s even if Supabase doesn't respond
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    // Use cached role immediately for fast UI
    const cached = getCachedRole();

    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      const remoteRole = (data?.role as Role) || cached;
      setRole(remoteRole);
      setCachedRole(remoteRole);
    } catch {
      setRole(cached);
    }
    setLoading(false);
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole("member");
    setCachedRole("member");
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
