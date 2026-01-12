import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/db/supabase";
import type { ApiRequest, ApiResponseLike } from "@/api/http";
import { respondWithError } from "@/lib/api/middleware/errorHandler";

export interface AuthenticatedApiRequest extends ApiRequest {
  user: User;
}

export type AuthenticatedApiHandler<T = unknown> = (
  req: AuthenticatedApiRequest,
  res: ApiResponseLike<T>,
) => Promise<unknown>;

const extractBearerToken = (authorization?: string | string[]) => {
  if (typeof authorization !== "string") {
    return null;
  }

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
};

/**
 * Wraps an API handler with Bearer authentication enforced via Supabase Auth.
 */
export const withAuth = <T = unknown>(
  handler: AuthenticatedApiHandler<T>,
): ((req: ApiRequest, res: ApiResponseLike<T>) => Promise<unknown>) =>
  async (req, res) => {
    const token = extractBearerToken(req.headers?.authorization);

    if (!token) {
      return respondWithError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return respondWithError(res, {
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
          details: error?.message,
        });
      }

      const authedReq = req as AuthenticatedApiRequest;
      authedReq.user = data.user;

      return handler(authedReq, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return respondWithError(res, {
        code: "INTERNAL_ERROR",
        message: "Failed to validate token",
        details: { message },
      });
    }
  };
