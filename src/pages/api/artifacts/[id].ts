import { handleApiError } from "../../../api/error";
import {
  badRequest,
  methodNotAllowed,
  notFound,
  ok,
  type ApiRequest,
  type ApiResponseLike,
} from "../../../api/http";
import { fetchArtifactDetail } from "../../../api/handlers/artifactsHandler";

const extractIdParam = (req: ApiRequest) => {
  const value = req.query?.id;
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const artifactId = extractIdParam(req);
  if (!artifactId) {
    return badRequest(res, "Artifact id is required");
  }

  try {
    const data = await fetchArtifactDetail(artifactId);
    if (!data) {
      return notFound(res, "Artifact not found");
    }
    return ok(res, { success: true, data });
  } catch (error) {
    return handleApiError(res, error, "fetch artifact");
  }
}
