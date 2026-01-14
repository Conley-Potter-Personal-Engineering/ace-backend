import type { NextApiRequest, NextApiResponse } from "next";

import { authLoginHandler } from "@/api/handlers/authLogin";
import { methodNotAllowed } from "@/api/http";

export default async function loginRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  return authLoginHandler(req, res);
}
