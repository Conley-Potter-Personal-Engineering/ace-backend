import type { NextApiRequest, NextApiResponse } from "next";

export interface HealthResponse {
  success: boolean;
  message: string;
}

export default function handler(
  _: NextApiRequest,
  res: NextApiResponse<HealthResponse>
): void {
  res.status(200).json({ success: true, message: "ACE API alive" });
}