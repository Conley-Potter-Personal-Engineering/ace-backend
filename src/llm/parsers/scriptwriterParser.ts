import { z } from "zod";

const ScriptwriterCreativeVariablesSchema = z
  .object({
    tone: z.string().trim().min(1).optional(),
    structure: z.string().trim().min(1).optional(),
    style: z.string().trim().min(1).optional(),
    patternId: z.string().uuid().optional(),
    trendTags: z.array(z.string().trim().min(1)).optional(),
  })
  .strip()
  .optional();

const ScriptwriterRawOutputSchema = z
  .object({
    title: z.string().trim().min(1),
    hook: z.string().trim().min(5).max(100),
    outline: z.array(z.string().trim().min(1)).min(3).max(7),
    script_text: z.string().trim().min(50),
    cta: z.string().trim().min(1),
    creative_variables: ScriptwriterCreativeVariablesSchema,
  })
  .strip();

export type ScriptwriterParserOutput = z.infer<typeof ScriptwriterRawOutputSchema>;

export class ScriptwriterParserError extends Error {
  code: "EMPTY_OUTPUT" | "INVALID_JSON" | "SCHEMA_VALIDATION";
  cause?: unknown;

  constructor(
    message: string,
    code: ScriptwriterParserError["code"],
    cause?: unknown,
  ) {
    super(message);
    this.name = "ScriptwriterParserError";
    this.code = code;
    this.cause = cause;
  }
}

const stripCodeFences = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
};

const extractJsonCandidate = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
};

const normalizeOutput = (output: ScriptwriterParserOutput): ScriptwriterParserOutput => ({
  title: output.title.trim(),
  hook: output.hook.trim(),
  outline: output.outline.map((line) => line.trim()).filter(Boolean),
  script_text: output.script_text.trim(),
  cta: output.cta.trim(),
  creative_variables: output.creative_variables,
});

export const parseScriptwriterOutput = (
  rawOutput: string,
): ScriptwriterParserOutput => {
  if (typeof rawOutput !== "string" || !rawOutput.trim()) {
    throw new ScriptwriterParserError(
      "Scriptwriter output is empty.",
      "EMPTY_OUTPUT",
    );
  }

  const sanitized = stripCodeFences(rawOutput);
  const jsonCandidate = extractJsonCandidate(sanitized);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (error) {
    throw new ScriptwriterParserError(
      "Scriptwriter output is not valid JSON.",
      "INVALID_JSON",
      error,
    );
  }

  try {
    const validated = ScriptwriterRawOutputSchema.parse(parsed);
    return normalizeOutput(validated);
  } catch (error) {
    throw new ScriptwriterParserError(
      "Scriptwriter output failed schema validation.",
      "SCHEMA_VALIDATION",
      error,
    );
  }
};
