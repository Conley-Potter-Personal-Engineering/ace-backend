import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || "missing",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "present" : "missing",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "present"
      : "missing",
    NODE_ENV: process.env.NODE_ENV,
    keys: Object.keys(process.env).filter((k) =>
      k.toLowerCase().includes("supabase")
    ),
  });
}
