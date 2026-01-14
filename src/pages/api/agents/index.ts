import { handleApiError } from "../../../api/error";
import {
  methodNotAllowed,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../api/http";
import { listAgentStatuses } from "../../../api/handlers/agentsHandler";
import { withAuth } from "@/lib/api/middleware/auth";

async function handler(
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

export default withAuth(handler);
