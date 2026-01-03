import { handleApiError } from "../../../../api/error";
import {
  badRequest,
  methodNotAllowed,
  ok,
  serverError,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../../api/http";
import {
  AgentApiError,
  renderAssetFromApi,
} from "../../../../api/handlers/agentsHandler";

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const data = await renderAssetFromApi(req.body ?? {});
    return ok(res, { success: true, data });
  } catch (error) {
    if (error instanceof AgentApiError) {
      return error.status === 400
        ? badRequest(res, error.message, error.details)
        : serverError(res, error.message, error.details);
    }
    return handleApiError(res, error, "render asset");
  }
}
