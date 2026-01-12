import { methodNotAllowed, ok, type ApiRequest, type ApiResponseLike } from "@/api/http";
import { withAuth } from "@/lib/api/middleware/auth";

function handler(_req: ApiRequest, res: ApiResponseLike) {
  if (_req.method && _req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  return ok(res, {
    success: true,
    data: {
      SUPABASE_URL: process.env.SUPABASE_URL || "missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "present" : "missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "present"
        : "missing",
      NODE_ENV: process.env.NODE_ENV,
      keys: Object.keys(process.env).filter((key) =>
        key.toLowerCase().includes("supabase")
      ),
    },
  });
}

export default withAuth(handler);
