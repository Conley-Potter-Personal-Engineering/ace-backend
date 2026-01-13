import type { ApiRequest, ApiResponseLike } from "@/api/http";
import { respondWithError } from "@/lib/api/middleware/errorHandler";

export type ApiKeyHandler<T = unknown> = (
  req: ApiRequest,
  res: ApiResponseLike<T>,
) => Promise<unknown>;

const extractApiKey = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value.trim() || null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0].trim() || null : null;
  }
  return null;
};

const readApiKey = (req: ApiRequest) =>
  extractApiKey(req.headers?.["x-api-key"]) ??
  extractApiKey(req.headers?.["X-API-KEY"]);

/**
 * Wraps an API handler with x-api-key authentication.
 */
export const withApiKeyAuth = <T = unknown>(
  handler: ApiKeyHandler<T>,
): ((req: ApiRequest, res: ApiResponseLike<T>) => Promise<unknown>) =>
  async (req, res) => {
    const apiKey = readApiKey(req);

    if (!apiKey) {
      return respondWithError(res, {
        code: "UNAUTHORIZED",
        message: "API key required",
      });
    }

    const expected = process.env.ACE_API_KEY;
    if (!expected) {
      return respondWithError(res, {
        code: "INTERNAL_ERROR",
        message: "API key is not configured",
      });
    }

    if (apiKey !== expected) {
      return respondWithError(res, {
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    return handler(req, res);
  };
