import { handleApiError } from "../../../../api/error";
import {
  badRequest,
  created,
  methodNotAllowed,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../../api/http";
import { startWorkflow } from "../../../../api/handlers/workflowsHandler";
import { withAuth } from "@/lib/api/middleware/auth";
import { respondWithError } from "@/lib/api/middleware/errorHandler";
import { ZodError } from "zod";

const extractWorkflowId = (req: ApiRequest) => {
  const value = req.query?.id;
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
};

async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const workflowId = extractWorkflowId(req);
  if (!workflowId) {
    return badRequest(res, "Workflow id is required");
  }

  try {
    const result = await startWorkflow(workflowId, req.body ?? {});
    return created(res, { success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleApiError(res, error, "start workflow");
    }
    return respondWithError(res, {
      code: "WORKFLOW_ERROR",
      message: "Failed to start workflow",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler);
