import { methodNotAllowed, respond, type ApiResponseLike } from "@/api/http";
import {
  withAuth,
  type AuthenticatedApiHandler,
  type AuthenticatedApiRequest,
} from "@/lib/api/middleware/auth";

const meHandler: AuthenticatedApiHandler = async (
  req: AuthenticatedApiRequest,
  res: ApiResponseLike,
) => {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  // Defensive coding: req.user should be populated by withAuth, but we check to be safe types-wise if needed.
  // The AuthenticatedApiRequest type implies user might be undefined if not asserted,
  // but withAuth guarantees it for the handler execution path unless something substantial fails.
  const user = req.user;

  if (!user) {
    // This case should theoretically not be reached due to middleware protection
    return respond(res, 401, {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User context missing",
      },
    });
  }

  return respond(res, 200, {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      },
    },
  });
};

export default withAuth(meHandler);
