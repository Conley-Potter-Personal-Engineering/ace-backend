import type { User } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

import { getSupabase } from "@/db/supabase";
import type { Json } from "@/db/types";
import { logSystemEvent } from "@/repos/systemEvents";
import { loginRequestSchema, type LoginRequest } from "@/schemas/apiSchemas";

type LoginResponse =
  | {
      success: true;
      data: { token: string; user: User };
    }
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

export const authLoginHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>,
) => {
  let credentials: LoginRequest;
  try {
    credentials = loginRequestSchema.parse(req.body ?? {});
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid login payload";
    await logAuthEvent("auth.login.error", { message });
    console.error("Auth login validation failed", err);
    return res.status(400).json({ success: false, error: message });
  }

  await logAuthEvent("auth.login.start", { email: credentials.email });
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session || !data.user) {
      const message = error?.message ?? "Invalid credentials";
      await logAuthEvent("auth.login.error", {
        email: credentials.email,
        message,
      });
      console.error("Auth login failed", error);
      return res.status(400).json({ success: false, error: message });
    }

    const token = data.session.access_token;
    await logAuthEvent("auth.login.success", {
      email: credentials.email,
      userId: data.user.id,
    });

    return res
      .status(200)
      .json({ success: true, data: { token, user: data.user } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected login error";
    await logAuthEvent("auth.login.error", {
      email: credentials.email,
      message,
    });
    console.error("Auth login unexpected error", err);
    return res.status(500).json({ success: false, error: message });
  }
};

export default authLoginHandler;
