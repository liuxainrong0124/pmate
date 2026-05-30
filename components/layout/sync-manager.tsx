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
        bidirectionalSync().catch(() => {});
      }
    } else {
      clearSyncUserId();
      syncedRef.current = false;
    }
  }, [user]);

  // Periodic sync every 60 seconds when authenticated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      bidirectionalSync().catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
