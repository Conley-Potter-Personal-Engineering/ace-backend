import { handleApiError } from "../../api/error";
import {
  methodNotAllowed,
  normalizeQuery,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../api/http";
import { listSystemEventsApi } from "../../api/handlers/systemEventsHandler";

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const query = normalizeQuery(req.query);
    const data = await listSystemEventsApi(query);
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "list system events");
  }
}
