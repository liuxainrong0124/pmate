import { createClient, SupabaseClient } from "@supabase/supabase-js";

function hasSupabaseEnv(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function createSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}

const _client: SupabaseClient | null = typeof window !== "undefined" ? createSupabaseClient() : null;

export function getSupabase(): SupabaseClient | null {
  return _client;
}

export { _client as supabase };
