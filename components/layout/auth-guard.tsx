"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { syncAuthRole } from "@/lib/permissions";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const checkedRef = useRef(false);

  const isPublic = pathname === "/login" || pathname === "/";

  useEffect(() => {
    syncAuthRole(user ? role : null);
  }, [user, role]);

  useEffect(() => {
    if (!loading && !user && !isPublic && !checkedRef.current) {
      checkedRef.current = true;
      router.replace("/login");
    }
  }, [user, loading, isPublic, router]);

  // Only block render on first load; after auth is known, render instantly
  if (loading && !isPublic && !checkedRef.current) return null;

  if (!user && !isPublic) return null;

  return <>{children}</>;
}
