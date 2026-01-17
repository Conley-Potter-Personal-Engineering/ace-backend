import { handleApiError } from "../../api/error";
import {
  created,
  methodNotAllowed,
  normalizeQuery,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../api/http";
import {
  createSystemEventApi,
  listSystemEventsApi,
} from "../../api/handlers/systemEventsHandler";
import { withApiKeyAuth } from "@/lib/api/middleware/apiKeyAuth";

async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  try {
    if (req.method === "GET") {
      const query = normalizeQuery(req.query);
      const result = await listSystemEventsApi(query);
      return ok(res, { success: true, ...result });
    }

    if (req.method === "POST") {
      const data = await createSystemEventApi(req.body ?? {});
      return created(res, {
        success: true,
        data,
        message: "Event created successfully",
      });
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    const context =
      req.method === "POST" ? "create system event" : "list system events";
    return handleApiError(res, error, context);
  }
}

export default withApiKeyAuth(handler);
