import { handleApiError } from "../../../../api/error";
import {
  badRequest,
  created,
  methodNotAllowed,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../../api/http";
import { triggerAgentRun } from "../../../../api/handlers/agentsHandler";

const extractNameParam = (req: ApiRequest) => {
  const value = req.query?.name;
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const name = extractNameParam(req);
  if (!name) {
    return badRequest(res, "Agent name is required");
  }

  try {
    const result = await triggerAgentRun(name, req.body ?? {});
    if ("error" in result) {
      return badRequest(res, result.error, result.details);
    }

    return created(res, {
      success: true,
      message: result.message,
      data: result.result,
    });
  } catch (error) {
    return handleApiError(res, error, "run agent");
  }
}
