import { handleApiError } from "@/api/error";
import {
  badRequest,
  methodNotAllowed,
  notFound,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { getExperimentDetailApi } from "@/api/handlers/experimentsHandler";
import { withAuth } from "@/lib/api/middleware/auth";

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

  const experimentId = extractIdParam(req);
  if (!experimentId) {
    return badRequest(res, "Experiment id is required");
  }

  try {
    const data = await getExperimentDetailApi(experimentId);
    if (!data) {
      return notFound(res, "Experiment not found");
    }
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "fetch experiment");
  }
}

export default withAuth(handler);
