import { supabase } from "./client";

type TableMap = {
  localStorageKey: string;
  table: string;
  idField?: string;
};

const TABLE_MAP: TableMap[] = [
  { localStorageKey: "pmate_requirements", table: "requirements" },
  { localStorageKey: "pmate_todos", table: "todos" },
  { localStorageKey: "pmate_activities", table: "activities" },
  { localStorageKey: "pmate_experiments", table: "experiments" },
  { localStorageKey: "pmate_versions", table: "versions" },
  { localStorageKey: "pmate_feedback", table: "feedback" },
  { localStorageKey: "pmate_logs", table: "operation_logs" },
  { localStorageKey: "pmate_metrics", table: "metrics" },
  { localStorageKey: "pmate_documents", table: "documents" },
  { localStorageKey: "pmate_content_history", table: "content_history" },
];

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("sb_auth_user_id");
  return stored || null;
}

export function setSyncUserId(userId: string) {
  localStorage.setItem("sb_auth_user_id", userId);
}

export function clearSyncUserId() {
  localStorage.removeItem("sb_auth_user_id");
}

/** Upload all localStorage data to Supabase for the current user */
export async function uploadAllToSupabase(): Promise<{ pushed: number; errors: number }> {
  const userId = getUserId();
  if (!userId) return { pushed: 0, errors: 0 };

  let pushed = 0;
  let errors = 0;

  for (const map of TABLE_MAP) {
    const raw = localStorage.getItem(map.localStorageKey);
    if (!raw) continue;
    try {
      const rows = JSON.parse(raw);
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const payload = rows.map((row: Record<string, unknown>) => {
        const { id, ...rest } = row;
        return {
          id,
          user_id: userId,
          ...rest,
          updated_at: new Date().toISOString(),
        };
      });

      // Upsert in batches of 100
      for (let i = 0; i < payload.length; i += 100) {
        const batch = payload.slice(i, i + 100);
        const { error } = await supabase.from(map.table).upsert(batch, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
        if (error) {
          console.error(`Sync upload ${map.table}:`, error.message);
          errors++;
        } else {
          pushed += batch.length;
        }
      }
    } catch {
      errors++;
    }
  }

  return { pushed, errors };
}

/** Download all data from Supabase and merge into localStorage */
export async function downloadAllFromSupabase(): Promise<{ pulled: number; errors: number }> {
  const userId = getUserId();
  if (!userId) return { pulled: 0, errors: 0 };

  let pulled = 0;
  let errors = 0;

  for (const map of TABLE_MAP) {
    try {
      const { data, error } = await supabase
        .from(map.table)
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error(`Sync download ${map.table}:`, error.message);
        errors++;
        continue;
      }

      if (data && data.length > 0) {
        const cleaned = data.map((row: Record<string, unknown>) => {
          const r = { ...row };
          delete r.user_id;
          return r;
        });
        localStorage.setItem(map.localStorageKey, JSON.stringify(cleaned));
        pulled += cleaned.length;
      }
    } catch {
      errors++;
    }
  }

  return { pulled, errors };
}

/** Push a single item to Supabase (call after localStorage CRUD) */
export async function pushItem(
  table: string,
  item: Record<string, unknown>,
  isDelete = false
) {
  const userId = getUserId();
  if (!userId) return;

  if (isDelete) {
    await supabase.from(table).delete().eq("id", item.id);
  } else {
    const payload = { ...item, user_id: userId, updated_at: new Date().toISOString() };
    await supabase.from(table).upsert(payload, {
      onConflict: "id",
      ignoreDuplicates: false,
    });
  }
}

/** Map localStorage key to Supabase table name */
export function getTableForLocalKey(localKey: string): string | null {
  const match = TABLE_MAP.find((m) => m.localStorageKey === localKey);
  return match?.table || null;
}

/** Bidirectional sync: upload local → Supabase, then download Supabase → local */
export async function bidirectionalSync(): Promise<{
  uploaded: number;
  downloaded: number;
}> {
  const up = await uploadAllToSupabase();
  const down = await downloadAllFromSupabase();
  return { uploaded: up.pushed, downloaded: down.pulled };
}
