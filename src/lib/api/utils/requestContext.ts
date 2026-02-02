import type { ApiRequest } from "@/api/http";

const readHeaderValue = (
  headers: ApiRequest["headers"],
  name: string,
): string | null => {
  if (!headers) {
    return null;
  }
  const direct = headers[name];
  const lower = headers[name.toLowerCase()];
  const upper = headers[name.toUpperCase()];
  const raw = direct ?? lower ?? upper;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(raw) && raw.length > 0) {
    const trimmed = raw[0]?.trim();
    return trimmed ? trimmed : null;
  }

  return null;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const withWorkflowContextFromHeaders = (
  req: ApiRequest,
  body: unknown,
): Record<string, unknown> => {
  const payload = isPlainObject(body) ? { ...body } : {};
  const workflowId = readHeaderValue(req.headers, "x-workflow-id");
  const correlationId = readHeaderValue(req.headers, "x-correlation-id");

  if (workflowId) {
    payload.workflow_id = workflowId;
    payload.workflowId = workflowId;
  }

  if (correlationId) {
    payload.correlation_id = correlationId;
    payload.correlationId = correlationId;
  }

  return payload;
};
