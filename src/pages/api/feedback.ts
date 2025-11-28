import { handleApiError } from "../../api/error";
import {
  created,
  methodNotAllowed,
  type ApiRequest,
  type ApiResponseLike,
} from "../../api/http";
import { recordFeedback } from "../../api/handlers/feedbackHandler";

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const result = await recordFeedback(req.body ?? {});
    return created(res, { success: true, ...result });
  } catch (error) {
    return handleApiError(res, error, "record feedback");
  }
}
