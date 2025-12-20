import { ScriptWriterInput, ScriptOutput, type ScriptOutputType, type ScriptWriterInputType } from "@/schemas/scriptwriterSchemas";
import { createScriptwriterModel } from "../models/openaiModel";

const scriptwriterModel = createScriptwriterModel();

const toBulletList = (items: string[], fallback: string): string =>
  items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;

const formatCreativeVariables = (creativeVariables: Record<string, string>): string => {
  const entries = Object.entries(creativeVariables).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (!entries.length) {
    return "- None provided.";
  }

  return entries.map(([key, value]) => `- ${key}: ${value}`).join("\n");
};

const stripCodeFences = (raw: string): string => {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const withoutOpeningFence = trimmed.replace(/^```(?:json)?/i, "");
  const withoutClosingFence = withoutOpeningFence.replace(/```$/, "");

  return withoutClosingFence.trim();
};

const extractContent = (modelResponse: unknown): string => {
  if (typeof modelResponse === "string") {
    return modelResponse;
  }

  const content = (modelResponse as { content?: unknown })?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (typeof part === "object" && part && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }

        return "";
      })
      .join("")
      .trim();
  }

  throw new Error("Unexpected LLM response format; no content to parse.");
};

const buildPrompt = (input: ScriptWriterInputType): string => {
  const { productId, productSummary, trendSummaries, patternSummaries, creativeVariables } =
    input;

  const creativeVariablesBlock = formatCreativeVariables(creativeVariables ?? {});

  return [
    "You are the Autonomous Content Engine's (ACE) Scriptwriter v2. Create a concise, persuasive short-form video script grounded in the provided context.",
    "Return ONLY a JSON object with this exact shape:",
    JSON.stringify(
      {
        title: "string",
        hook: "string",
        cta: "string",
        outline: ["string", "string"],
        body: "string",
      },
      null,
      2,
    ),
    `Product ID: ${productId}`,
    `Product Summary:\n${productSummary}`,
    `Trend Summaries:\n${toBulletList(trendSummaries ?? [], "No trend summaries provided.")}`,
    `Creative Pattern Summaries:\n${toBulletList(
      patternSummaries ?? [],
      "No creative patterns provided.",
    )}`,
    `Creative Variables:\n${creativeVariablesBlock}`,
    "Constraints:",
    "- Keep pacing tight for a 15-60 second short-form video.",
    "- Incorporate relevant trends and creative patterns naturally.",
    "- Outline should list the key beats before the full body text.",
    "- Do not include explanations or markdown fences; respond with raw JSON only.",
  ].join("\n\n");
};

export async function scriptwriterChain(
  input: ScriptWriterInputType,
): Promise<ScriptOutputType> {
  const validatedInput = ScriptWriterInput.parse(input);
  const prompt = buildPrompt(validatedInput);

  const rawResponse = await scriptwriterModel.invoke(prompt);
  const rawContent = extractContent(rawResponse);
  const sanitized = stripCodeFences(rawContent);

  let parsedOutput: unknown;
  try {
    parsedOutput = JSON.parse(sanitized);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Scriptwriter chain returned invalid JSON: ${reason}. Raw content: ${sanitized}`,
    );
  }

  try {
    return ScriptOutput.parse(parsedOutput);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Scriptwriter output validation failed: ${error.message}`);
    }

    throw error;
  }
}
