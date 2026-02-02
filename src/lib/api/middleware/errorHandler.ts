import { ZodError } from "zod";
import { respond, type ApiResponseLike } from "@/api/http";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "AGENT_ERROR"
  | "WORKFLOW_ERROR";

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const statusByCode: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INTERNAL_ERROR: 500,
  AGENT_ERROR: 500,
  WORKFLOW_ERROR: 500,
};

/**
 * Sends a standardized error response.
 */
export const respondWithError = <T>(
  res: ApiResponseLike<T> | undefined,
  payload: ApiErrorPayload,
  statusOverride?: number,
) =>
  respond(res as ApiResponseLike<any>, statusOverride ?? statusByCode[payload.code], {
    success: false,
    error: {
      code: payload.code,
      message: payload.message,
      details: payload.details,
    },
  });

/**
 * Wraps API error handling to enforce standardized response shapes.
 */
export const handleApiError = (
  res: ApiResponseLike | undefined,
  error: unknown,
  context: string,
) => {
  const suppressValidationLogs = process.env.NODE_ENV === "test";

  if (error instanceof ApiError) {
    return respondWithError(res, {
      code: error.code,
      message: error.message,
      details: error.details,
    }, error.status);
  }

  if (error instanceof ZodError) {
    if (!suppressValidationLogs) {
      console.error(`[api] validation error during ${context}`, error.format());
    }
    return respondWithError(res, {
      code: "VALIDATION_ERROR",
      message: `Invalid ${context} payload`,
      details: error.format(),
    });
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api] error during ${context}`, error);
  return respondWithError(res, {
    code: "INTERNAL_ERROR",
    message: `Failed to ${context}`,
    details: { message },
  });
};
