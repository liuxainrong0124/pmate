"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { syncAuthRole } from "@/lib/permissions";
import { getSettings } from "@/lib/store/local-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const checkedRef = useRef(false);

  const isPublic = pathname === "/login" || pathname === "/";
  const hasApiKey = typeof window !== "undefined" && !!getSettings().deepseekApiKey;

  useEffect(() => {
    syncAuthRole(user ? role : null);
  }, [user, role]);

  useEffect(() => {
    if (!loading && !user && !isPublic && !checkedRef.current) {
      // Allow local mode users (API key configured but no Supabase auth)
      if (!hasApiKey) {
        checkedRef.current = true;
        router.replace("/login");
      }
    }
  }, [user, loading, isPublic, router, hasApiKey]);

  // Only block render on first load; after auth is known, render instantly
  if (loading && !isPublic && !checkedRef.current) return null;

  if (!user && !isPublic && !hasApiKey) return null;

  return <>{children}</>;
}
