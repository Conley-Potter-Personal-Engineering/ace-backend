import type { User } from "@supabase/supabase-js";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getSupabase } from "../db/supabase";

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  user: User;
}

export type AuthenticatedNextApiHandler<T = unknown> = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<T>,
) => ReturnType<NextApiHandler<T>>;

interface WithAuthOptions {
  allowDevBypass?: boolean;
}

const unauthorizedBody = { success: false as const, error: "Unauthorized" };
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Wraps an API handler with bearer token authentication enforced via Supabase.
 *
 * - Expects `Authorization: Bearer <token>` header.
 * - Validates the token using Supabase admin client and attaches the user to `req.user`.
 * - Returns a 401 ACE envelope `{ success: false, error: "Unauthorized" }` when invalid or missing.
 * - Optional `allowDevBypass` skips auth when `NODE_ENV === "development"`.
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedNextApiHandler<T>,
  options?: WithAuthOptions,
): NextApiHandler<T | typeof unauthorizedBody> {
  return async (req, res) => {
    if (options?.allowDevBypass && isDevelopment) {
      return handler(req as AuthenticatedNextApiRequest, res);
    }

    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : null;

    if (!token) {
      console.error("[auth] Missing bearer token");
      return res.status(401).json(unauthorizedBody);
    }

    try {
      const supabase = getSupabase();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error("[auth] Invalid token", error);
        return res.status(401).json(unauthorizedBody);
      }

      const authedReq = req as AuthenticatedNextApiRequest;
      authedReq.user = user;

      return handler(authedReq, res);
    } catch (err) {
      console.error("[auth] Failed to validate token", err);
      return res.status(401).json(unauthorizedBody);
    }
  };
}
