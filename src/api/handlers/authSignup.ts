import type { User } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

import { getSupabase } from "@/db/supabase";
import type { Json } from "@/db/types";
import { logSystemEvent } from "@/repos/systemEvents";
import { SignupRequestSchema, type SignupRequest } from "@/schemas/apiSchemas";
import { respondWithError } from "@/lib/api/middleware/errorHandler";

type SignupResponse =
  | {
      success: true;
      data: {
        user: Pick<User, "id" | "email">;
        message: string;
      };
    }
  | {
      success: false;
      error: { code: string; message: string; details?: unknown };
    };

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
    console.error("[auth] Failed to log auth event", eventType, err);
  }
};

export const authSignupHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>,
) => {
  let credentials: SignupRequest;
  try {
    credentials = SignupRequestSchema.parse(req.body ?? {});
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid signup payload";
    await logAuthEvent("auth.signup.error", { message });
    console.error("[auth] Signup validation failed", err);
    return respondWithError(res, {
      code: "VALIDATION_ERROR",
      message,
    });
  }

  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error("Supabase initialization failed:", err);
    throw err;
  }
  await logAuthEvent("auth.signup.start", { email: credentials.email });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user) {
      const message = error?.message ?? "Sign-up failed";
      await logAuthEvent("auth.signup.error", {
        email: credentials.email,
        message,
      });
      console.error("[auth] Sign-up failed", error);
      return respondWithError(res, {
        code: "INTERNAL_ERROR",
        message,
      });
    }

    const userEmail = data.user.email ?? credentials.email;
    await logAuthEvent("auth.signup.success", {
      email: userEmail,
      userId: data.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        user: { id: data.user.id, email: userEmail },
        message: "Sign-up successful. Please verify your email.",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected sign-up error";
    await logAuthEvent("auth.signup.error", {
      email: credentials.email,
      message,
    });
    console.error("[auth] Unexpected sign-up error", err);
    return respondWithError(res, {
      code: "INTERNAL_ERROR",
      message,
    });
  }
};

export default authSignupHandler;
