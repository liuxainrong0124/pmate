import { createClient, SupabaseClient } from "@supabase/supabase-js";

function hasEnv(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function getKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export const supabase: SupabaseClient | null = hasEnv()
  ? createClient(getUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  : null;

export const supabaseAdmin: SupabaseClient | null = hasEnv()
  ? createClient(getUrl(), getKey())
  : null;
