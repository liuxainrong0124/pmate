"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { setSyncUserId, clearSyncUserId, bidirectionalSync } from "@/lib/supabase/sync";

export function SyncManager() {
  const { user } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (user) {
      setSyncUserId(user.id);
      if (!syncedRef.current) {
        syncedRef.current = true;
        // Delay initial sync to avoid blocking page render
        const timer = setTimeout(() => {
          bidirectionalSync().catch(() => {});
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      clearSyncUserId();
      syncedRef.current = false;
    }
  }, [user]);

  // Periodic sync every 5 minutes when authenticated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      bidirectionalSync().catch(() => {});
    }, 300000);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
