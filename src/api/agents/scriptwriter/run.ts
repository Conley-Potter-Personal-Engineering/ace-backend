import {
  ScriptwriterAgent,
  ScriptwriterAgentError,
  type ScriptwriterResult,
} from "@/agents/ScriptwriterAgent";
import { ScriptRequestSchema } from "@/schemas/agentSchemas";
import {
  badRequest,
  ok,
  serverError,
  type ApiRequest,
  type ApiResponseLike,
} from "@/api/http";
import { ZodError } from "zod";

export interface ScriptwriterRunSuccessResponse {
  success: true;
  message: string;
  data: ScriptwriterResult;
}

export interface ScriptwriterRunErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ScriptwriterRunResponse =
  | ScriptwriterRunSuccessResponse
  | ScriptwriterRunErrorResponse;

const isBadRequestError = (error: ScriptwriterAgentError): boolean =>
  error.code === "VALIDATION" || error.code === "NOT_FOUND";

export default async function handler(
  req: ApiRequest,
  res: ApiResponseLike,
) {
  if (req.method !== "POST") {
    return badRequest(res, "Method not allowed");
  }

  try {
    const input = ScriptRequestSchema.parse(req.body ?? {});
    const agent = new ScriptwriterAgent({ agentName: "ScriptwriterAgent" });
    const result = await agent.run(input);

    return ok(res, {
      success: true,
      message: "Script generated successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest(res, "Validation error", error.format());
    }

    if (error instanceof ScriptwriterAgentError) {
      if (isBadRequestError(error)) {
        return badRequest(res, error.message, { code: error.code });
      }
      return serverError(res, error.message, { code: error.code });
    }

    return serverError(
      res,
      "Failed to generate script",
      error instanceof Error ? error.message : String(error),
    );
  }
}
