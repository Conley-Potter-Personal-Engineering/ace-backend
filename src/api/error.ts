import { ZodError } from "zod";
import { badRequest, serverError, type ApiResponseLike } from "./http";

export const normalizeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const handleApiError = (
  res: ApiResponseLike | undefined,
  error: unknown,
  context: string,
) => {
  if (error instanceof ZodError) {
    return badRequest(res, `Invalid ${context} payload`, error.format());
  }

  return serverError(res, `Failed to ${context}`, normalizeError(error));
};
