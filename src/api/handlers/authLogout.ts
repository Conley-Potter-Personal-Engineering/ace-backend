import type { NextApiRequest, NextApiResponse } from "next";

import { getSupabase } from "@/db/supabase";
import type { Json } from "@/db/types";
import { logSystemEvent } from "@/repos/systemEvents";

type LogoutResponse =
  | { success: true; data: { message: string } }
  | { success: false; error: string };

const logAuthEvent = async (
  eventType: string,
  payload: Record<string, unknown> = {},
) => {
  try {
    await logSystemEvent({
      agent_name: "AuthAPI",
      event_type: eventType,
      payload: payload as Json,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Failed to log auth event ${eventType}`, err);
  }
};

export const authLogoutHandler = async (
  _req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>,
) => {
  await logAuthEvent("auth.logout.start");
  const supabase = getSupabase();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      await logAuthEvent("auth.logout.error", { message: error.message });
      console.error("Auth logout failed", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    await logAuthEvent("auth.logout.success");
    return res
      .status(200)
      .json({ success: true, data: { message: "Logout successful" } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected logout error";
    await logAuthEvent("auth.logout.error", { message });
    console.error("Auth logout unexpected error", err);
    return res.status(500).json({ success: false, error: message });
  }
};

export default authLogoutHandler;
