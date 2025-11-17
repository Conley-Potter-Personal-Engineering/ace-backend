import { expect } from "vitest";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Warning: integration tests running without Supabase credentials.");
}

process.env.NODE_ENV = "test";

expect.extend({});
