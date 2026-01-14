import { authLogoutHandler } from "@/api/handlers/authLogout";
import { methodNotAllowed, type ApiRequest, type ApiResponseLike } from "@/api/http";
import { withAuth } from "@/lib/api/middleware/auth";

async function logoutRoute(req: ApiRequest, res: ApiResponseLike) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  return authLogoutHandler(req as any, res as any);
}

export default withAuth(logoutRoute);
