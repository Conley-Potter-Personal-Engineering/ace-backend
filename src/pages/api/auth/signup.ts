import type { NextApiRequest, NextApiResponse } from "next";

import { authSignupHandler } from "@/api/handlers/authSignup";

export default async function signupRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  return authSignupHandler(req, res);
}
