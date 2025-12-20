import type { NextApiRequest, NextApiResponse } from "next";

import { authLogoutHandler } from "@/api/handlers/authLogout";

export default async function logoutRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  return authLogoutHandler(req, res);
}
