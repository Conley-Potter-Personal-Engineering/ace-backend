import { handleApiError } from "@/api/error";
import {
  methodNotAllowed,
  normalizeQuery,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { getPerformanceMetricsApi } from "@/api/handlers/performanceMetricsHandler";
import { withApiKeyAuth } from "@/lib/api/middleware/apiKeyAuth";

async function handler(req: ApiRequest, res: ApiResponseLike) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const query = normalizeQuery(req.query);
    const data = await getPerformanceMetricsApi(query);
    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    return handleApiError(res, error, "get performance metrics");
  }
}

export default withApiKeyAuth(handler);
