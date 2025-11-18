const loadEnv = async () => {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch {
    // dotenv is optional; environments like CI should provide variables explicitly.
  }
};

await loadEnv();

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

const hasSupabaseCredentials = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

if (!hasSupabaseCredentials) {
  console.warn(
    "Warning: integration tests will be skipped because SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-service-role-key";
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && /prod|production|live/i.test(supabaseUrl)) {
  throw new Error(
    "Refusing to run integration tests against a production Supabase database.",
  );
}

export const integrationEnv = {
  supabaseUrl,
  serviceRoleKey,
  hasSupabaseCredentials,
};
