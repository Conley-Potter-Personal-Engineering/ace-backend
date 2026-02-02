import { handleApiError } from "@/api/error";
import {
  badRequest,
  methodNotAllowed,
  notFound,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { getPostPerformanceMetricsApi } from "@/api/handlers/performanceMetricsHandler";
import { withApiKeyAuth } from "@/lib/api/middleware/apiKeyAuth";

const extractIdParam = (req: ApiRequest) => {
  const value = req.query?.id;
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
};

async function handler(req: ApiRequest, res: ApiResponseLike) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const postId = extractIdParam(req);
  if (!postId) {
    return badRequest(res, "Post id is required");
  }

  try {
    const data = await getPostPerformanceMetricsApi(postId);
    if (!data) {
      return notFound(res, "Post not found");
    }
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "fetch post performance metrics");
  }
}

export default withApiKeyAuth(handler);
