import type { NextApiRequest, NextApiResponse } from "next";

import { authSignupHandler } from "@/api/handlers/authSignup";
import { methodNotAllowed } from "@/api/http";

export default async function signupRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  return authSignupHandler(req, res);
}
