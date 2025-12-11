import type { NextApiRequest, NextApiResponse } from "next";

import { authLoginHandler } from "@/api/handlers/authLogin";

export default async function loginRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  return authLoginHandler(req, res);
}
