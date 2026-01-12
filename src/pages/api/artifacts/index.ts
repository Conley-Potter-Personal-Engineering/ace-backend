import { handleApiError } from "../../../api/error";
import {
  methodNotAllowed,
  normalizeQuery,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../api/http";
import { listArtifacts } from "../../../api/handlers/artifactsHandler";
import { withAuth } from "@/lib/api/middleware/auth";

async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const query = normalizeQuery(req.query);
    const data = await listArtifacts(query);
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "list artifacts");
  }
}

export default withAuth(handler);
