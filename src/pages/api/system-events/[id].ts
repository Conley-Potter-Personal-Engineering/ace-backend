import { handleApiError } from "@/api/error";
import {
  badRequest,
  methodNotAllowed,
  notFound,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { getSystemEventDetailApi } from "@/api/handlers/systemEventsHandler";
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

  const eventId = extractIdParam(req);
  if (!eventId) {
    return badRequest(res, "System event id is required");
  }

  try {
    const data = await getSystemEventDetailApi(eventId);
    if (!data) {
      return notFound(res, "System event not found");
    }
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "fetch system event");
  }
}

export default withApiKeyAuth(handler);
