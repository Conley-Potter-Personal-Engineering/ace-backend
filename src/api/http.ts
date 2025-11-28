export interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[]>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponseLike<T = unknown> {
  status?: (statusCode: number) => ApiResponseLike<T>;
  json?: (body: T) => ApiResponseLike<T> | void;
}

export interface HandlerReturn<T = unknown> {
  status: number;
  body: T;
}

export const respond = <T>(
  res: ApiResponseLike<T> | undefined,
  status: number,
  body: T,
): HandlerReturn<T> => {
  if (res && typeof res.status === "function" && typeof res.json === "function") {
    const statusRes = res.status(status);
    if (statusRes && typeof statusRes.json === "function") {
      statusRes.json(body);
    }
  }

  return { status, body };
};

export const methodNotAllowed = (
  res: ApiResponseLike | undefined,
  allowed: string[],
) =>
  respond(res, 405, {
    success: false,
    error: `Method not allowed. Expected: ${allowed.join(", ")}`,
  });

export const badRequest = (
  res: ApiResponseLike | undefined,
  message: string,
  details?: unknown,
) =>
  respond(res, 400, {
    success: false,
    error: message,
    details,
  });

export const serverError = (
  res: ApiResponseLike | undefined,
  message: string,
  details?: unknown,
) =>
  respond(res, 500, {
    success: false,
    error: message,
    details,
  });

export const notFound = (
  res: ApiResponseLike | undefined,
  message: string,
) =>
  respond(res, 404, {
    success: false,
    error: message,
  });

export const ok = <T>(res: ApiResponseLike | undefined, body: T) =>
  respond(res, 200, body);

export const created = <T>(res: ApiResponseLike | undefined, body: T) =>
  respond(res, 201, body);

export const normalizeQuery = (
  query: ApiRequest["query"],
): Record<string, string | undefined> => {
  if (!query) {
    return {};
  }

  return Object.entries(query).reduce<Record<string, string | undefined>>(
    (acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value[0] : value;
      return acc;
    },
    {},
  );
};
