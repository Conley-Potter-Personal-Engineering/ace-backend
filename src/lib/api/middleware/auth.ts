import type { User } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { getSupabase } from "@/db/supabase";
import { respond, type ApiRequest, type ApiResponseLike } from "@/api/http";
import { respondWithError } from "@/lib/api/middleware/errorHandler";

export interface AuthenticatedApiRequest extends ApiRequest {
  user?: User;
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

const extractApiKey = (apiKeyHeader?: string | string[]) => {
  if (typeof apiKeyHeader !== "string") {
    return null;
  }

  return apiKeyHeader.trim() || null;
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const length = Math.max(leftBuffer.length, rightBuffer.length);
  const paddedLeft = Buffer.alloc(length);
  const paddedRight = Buffer.alloc(length);

  leftBuffer.copy(paddedLeft);
  rightBuffer.copy(paddedRight);

  return timingSafeEqual(paddedLeft, paddedRight) && leftBuffer.length === rightBuffer.length;
};

const unauthorizedBody = {
  success: false,
  error: "Unauthorized",
} as const;

interface WithAuthOptions {
  allowApiKey?: boolean;
}

/**
 * Wraps an API handler with Bearer authentication enforced via Supabase Auth.
 * When allowApiKey is enabled, a valid ACE API key can authenticate agent calls.
 */
export const withAuth = <T = unknown>(
  handler: AuthenticatedApiHandler<T>,
  options?: WithAuthOptions,
): ((req: ApiRequest, res: ApiResponseLike<T>) => Promise<void>) =>
  async (req, res) => {
    const token = extractBearerToken(req.headers?.authorization);
    const allowApiKey = options?.allowApiKey === true;

    if (!token) {
      if (!allowApiKey) {
        respondWithError(res, {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
        return;
      }
    }

    if (token) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getUser(token);

        if (!error && data.user) {
          const authedReq = req as AuthenticatedApiRequest;
          authedReq.user = data.user;
          await handler(authedReq, res);
          return;
        }

        if (!allowApiKey) {
          respondWithError(res, {
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
            details: error?.message,
          });
          return;
        }
      } catch (error) {
        if (!allowApiKey) {
          const message = error instanceof Error ? error.message : String(error);
          respondWithError(res, {
            code: "INTERNAL_ERROR",
            message: "Failed to validate token",
            details: { message },
          });
          return;
        }
      }
    }

    if (allowApiKey) {
      const apiKey = extractApiKey(req.headers?.["x-api-key"]);
      const expectedApiKey = process.env.ACE_API_KEY;

      if (apiKey && expectedApiKey && safeEqual(apiKey, expectedApiKey)) {
        await handler(req as AuthenticatedApiRequest, res);
        return;
      }

      respond(res as ApiResponseLike<typeof unauthorizedBody>, 401, unauthorizedBody);
      return;
    }
  };
