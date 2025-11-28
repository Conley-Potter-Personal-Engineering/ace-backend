import { handleApiError } from "../../../api/error";
import {
  methodNotAllowed,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../api/http";
import { listAgentStatuses } from "../../../api/handlers/agentsHandler";

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const data = await listAgentStatuses();
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "list agents");
  }
}
