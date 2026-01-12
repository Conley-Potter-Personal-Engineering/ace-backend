import { handleApiError } from "@/api/error";
import {
  methodNotAllowed,
  normalizeQuery,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { listPostsApi } from "@/api/handlers/artifactsEnhancedHandler";
import { withAuth } from "@/lib/api/middleware/auth";

async function handler(req: ApiRequest, res: ApiResponseLike) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const query = normalizeQuery(req.query);
    const result = await listPostsApi(query);
    return ok(res, {
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(res, error, "list posts");
  }
}

export default withAuth(handler);
