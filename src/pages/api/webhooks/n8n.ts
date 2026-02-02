import { handleApiError } from "@/api/error";
import {
  methodNotAllowed,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { createSystemEventApi } from "@/api/handlers/systemEventsHandler";
import { withApiKeyAuth } from "@/lib/api/middleware/apiKeyAuth";

async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const data = await createSystemEventApi(req.body ?? {});
    return ok(res, {
      success: true,
      data,
      message: "Webhook event received",
      error: null,
    });
  } catch (error) {
    return handleApiError(res, error, "process n8n webhook");
  }
}

export default withApiKeyAuth(handler);
