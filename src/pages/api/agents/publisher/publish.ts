import { handleApiError } from "../../../../api/error";
import {
  methodNotAllowed,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../../api/http";
import {
  AgentApiError,
  publishExperimentPostFromApi,
} from "../../../../api/handlers/agentsHandler";
import { withAuth } from "@/lib/api/middleware/auth";
import { respondWithError } from "@/lib/api/middleware/errorHandler";

async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const data = await publishExperimentPostFromApi(req.body ?? {});
    return ok(res, { success: true, data });
  } catch (error) {
    if (error instanceof AgentApiError) {
      if (error.status === 400) {
        return respondWithError(res, {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        });
      }
      return respondWithError(res, {
        code: "AGENT_ERROR",
        message: error.message,
        details: error.details,
      });
    }
    return handleApiError(res, error, "publish experiment post");
  }
}

export default withAuth(handler, { allowApiKey: true });
