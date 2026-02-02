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
import { respondWithError } from "@/lib/api/middleware/errorHandler";
import { withApiKeyAuth } from "@/lib/api/middleware/apiKeyAuth";
import { withWorkflowContextFromHeaders } from "@/lib/api/utils/requestContext";

async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const payload = withWorkflowContextFromHeaders(req, req.body ?? {});
    const data = await publishExperimentPostFromApi(payload);
    return ok(res, {
      success: true,
      data,
      message: "Post published successfully",
      error: null,
    });
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

export default withApiKeyAuth(handler);
