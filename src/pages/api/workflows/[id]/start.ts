import { handleApiError } from "../../../../api/error";
import {
  badRequest,
  created,
  methodNotAllowed,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../../api/http";
import { startWorkflow } from "../../../../api/handlers/workflowsHandler";

const extractWorkflowId = (req: ApiRequest) => {
  const value = req.query?.id;
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(
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
    return handleApiError(res, error, "start workflow");
  }
}
