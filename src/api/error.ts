import type { ApiResponseLike } from "./http";
import { handleApiError as handleStandardError } from "@/lib/api/middleware/errorHandler";

export const normalizeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const handleApiError = (
  res: ApiResponseLike | undefined,
  error: unknown,
  context: string,
) => handleStandardError(res, error, context);
