/**
 * Supabase client initialized lazily to avoid Turbopack build-time variable freezing.
 * This ensures process.env values are read only at runtime in Next.js 16+.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let client: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase environment variables are missing");
    }

    client = createClient<Database>(url, key);
  }

  return client;
};

export const getSupabase = (): SupabaseClient<Database> => getSupabaseClient();
