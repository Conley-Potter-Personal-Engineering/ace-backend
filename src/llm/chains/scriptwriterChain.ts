import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ScriptOutput, type ScriptOutputType } from "@/schemas/scriptwriterSchemas";
import {
  ScriptwriterPromptInputSchema,
  buildScriptwriterPrompt,
  type ScriptwriterPromptInput,
} from "../prompts/scriptwriterPrompt";
import {
  ScriptwriterParserError,
  parseScriptwriterOutput,
  type ScriptwriterParserOutput,
} from "../parsers/scriptwriterParser";

const ScriptwriterChainInputSchema = ScriptwriterPromptInputSchema;

export type ScriptwriterChainInput = z.infer<typeof ScriptwriterChainInputSchema>;

export interface ScriptwriterChainOptions {
  model?: string;
  temperature?: number;
  reasoningEffort?: "low" | "medium" | "high";
  maxTokens?: number;
}

export class ScriptwriterChainError extends Error {
  code:
    | "INPUT_VALIDATION"
    | "MODEL_INVOCATION"
    | "FALLBACK_FAILED";
  cause?: unknown;

  constructor(
    message: string,
    code: ScriptwriterChainError["code"],
    cause?: unknown,
  ) {
    super(message);
    this.name = "ScriptwriterChainError";
    this.code = code;
    this.cause = cause;
  }
}

const hasOpenAICredentials = (): boolean =>
  Boolean(
    process.env.OPENAI_API_KEY ??
      process.env.AZURE_OPENAI_API_KEY ??
      process.env.OPENAI_ACCESS_TOKEN,
  );

const shouldMockModel = (): boolean =>
  process.env.NODE_ENV === "test" || process.env.MOCK_LLM === "true";

class StaticResponseChatModel {
  constructor(private readonly response: string) {}

  async invoke(): Promise<{ content: string }> {
    return { content: this.response };
  }
}

const buildModelConfig = (
  options: ScriptwriterChainOptions,
): Record<string, unknown> => {
  const {
    model = process.env.SCRIPTWRITER_MODEL ?? "gpt-5",
    temperature = 0.7,
    reasoningEffort,
    maxTokens = 1500,
  } = options;

  const baseConfig: Record<string, unknown> = {
    modelName: model,
    maxTokens,
  };

  if (model.startsWith("o1") || model.startsWith("o3")) {
    if (reasoningEffort) {
      baseConfig.reasoning_effort = reasoningEffort;
    }
  } else {
    baseConfig.temperature = temperature;
  }

  return baseConfig;
};

const createScriptwriterModel = (
  options: ScriptwriterChainOptions,
): ChatOpenAI => {
  if (shouldMockModel()) {
    return new StaticResponseChatModel(
      JSON.stringify({
        title: "Test Script Title",
        hook: "Test hook",
        cta: "Test CTA",
        outline: ["Intro", "Body", "Close"],
        script_text: "This is a test script body used for local and CI runs.",
        creative_variables: {
          tone: "energetic",
          structure: "problem-solution",
          style: "direct",
        },
      }),
    ) as unknown as ChatOpenAI;
  }

  if (!hasOpenAICredentials()) {
    throw new ScriptwriterChainError(
      "OpenAI or Azure OpenAI credentials are required for the Scriptwriter model.",
      "MODEL_INVOCATION",
    );
  }

  return new ChatOpenAI(buildModelConfig(options));
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

  throw new ScriptwriterChainError(
    "Unexpected LLM response format; no content to parse.",
    "MODEL_INVOCATION",
  );
};

const buildFallbackPrompt = (input: ScriptwriterPromptInput): string => {
  const productName = input.product.name ?? "this product";

  return [
    `Create a short-form video script for ${productName}.`,
    "Return JSON with: title, hook, outline (array), script_text, cta, creative_variables (optional).",
  ].join(" ");
};

const normalizeToScriptOutput = (
  parsed: ScriptwriterParserOutput,
): ScriptOutputType =>
  ScriptOutput.parse({
    title: parsed.title,
    hook: parsed.hook,
    cta: parsed.cta,
    outline: parsed.outline,
    body: parsed.script_text,
  });

export async function scriptwriterChain(
  rawInput: ScriptwriterChainInput,
  options: ScriptwriterChainOptions = {},
): Promise<ScriptOutputType> {
  let validatedInput: ScriptwriterPromptInput;
  try {
    validatedInput = ScriptwriterChainInputSchema.parse(rawInput);
  } catch (error) {
    throw new ScriptwriterChainError(
      "Scriptwriter chain input failed validation.",
      "INPUT_VALIDATION",
      error,
    );
  }

  const prompt = buildScriptwriterPrompt(validatedInput);
  const llm = createScriptwriterModel(options);

  try {
    const response = await llm.invoke(prompt);
    const content = extractContent(response);
    const parsed = parseScriptwriterOutput(content);
    return normalizeToScriptOutput(parsed);
  } catch {
    const fallbackPrompt = buildFallbackPrompt(validatedInput);

    try {
      const fallbackResponse = await llm.invoke(fallbackPrompt);
      const fallbackContent = extractContent(fallbackResponse);
      const fallbackParsed = parseScriptwriterOutput(fallbackContent);
      return normalizeToScriptOutput(fallbackParsed);
    } catch (fallbackError) {
      if (fallbackError instanceof ScriptwriterParserError) {
        throw new ScriptwriterChainError(
          "Scriptwriter chain fallback failed to parse output.",
          "FALLBACK_FAILED",
          fallbackError,
        );
      }

      throw new ScriptwriterChainError(
        "Scriptwriter chain fallback failed.",
        "FALLBACK_FAILED",
        fallbackError,
      );
    }
  }
}
