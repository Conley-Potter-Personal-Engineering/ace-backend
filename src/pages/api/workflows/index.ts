import { handleApiError } from "../../../api/error";
import {
  methodNotAllowed,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../api/http";
import { listWorkflowStatuses } from "../../../api/handlers/workflowsHandler";

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const data = await listWorkflowStatuses();
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "list workflows");
  }
}
