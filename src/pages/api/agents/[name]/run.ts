import { handleApiError } from "../../../../api/error";
import {
  badRequest,
  created,
  methodNotAllowed,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../../api/http";
import { triggerAgentRun } from "../../../../api/handlers/agentsHandler";
import { withAuth } from "@/lib/api/middleware/auth";
import { respondWithError } from "@/lib/api/middleware/errorHandler";

const extractNameParam = (req: ApiRequest) => {
  const value = req.query?.name;
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

  const name = extractNameParam(req);
  if (!name) {
    return badRequest(res, "Agent name is required");
  }

  try {
    const result = await triggerAgentRun(name, req.body ?? {});
    return created(res, {
      success: true,
      message: result.message,
      data: result.result,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AgentApiError") {
      return respondWithError(res, {
        code: "AGENT_ERROR",
        message: error.message,
      });
    }
    return handleApiError(res, error, "run agent");
  }
}

export default withAuth(handler);
