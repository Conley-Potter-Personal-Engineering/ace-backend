import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabase = () => {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase environment variables are not set. " +
        "Load .env.local or .env.test before calling getSupabase()"
      );
    }

    _client = createClient<Database>(url, key);
  }
  return _client;
};
