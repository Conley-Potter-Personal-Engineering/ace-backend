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
  timeoutMs?: number;
}

const DEFAULT_SCRIPTWRITER_MODEL = "gpt-5";
const DEFAULT_SCRIPTWRITER_FALLBACK_MODEL = "gpt-4.1-mini";
const DEFAULT_MAX_COMPLETION_TOKENS = 3200;
const DEFAULT_FALLBACK_MAX_TOKENS = 1400;
const DEFAULT_TIMEOUT_MS = 45000;
const DEFAULT_REASONING_EFFORT: "low" | "medium" | "high" = "low";

const isReasoningModelName = (modelName: string): boolean => {
  const normalizedModel = modelName.toLowerCase();
  return (
    normalizedModel.startsWith("o1") ||
    normalizedModel.startsWith("o3") ||
    normalizedModel.includes("gpt-5")
  );
};

export class ScriptwriterChainError extends Error {
  code:
    | "INPUT_VALIDATION"
    | "MODEL_INVOCATION"
    | "OUTPUT_TRUNCATED"
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

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const parsePositiveIntEnv = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseReasoningEffort = (
  value: string | undefined,
): "low" | "medium" | "high" | undefined => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return undefined;
};

const isTimeoutError = (error: unknown): boolean =>
  /timed out|timeout|etimedout|request timed out/i.test(toErrorMessage(error));

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
  const envMaxCompletionTokens = parsePositiveIntEnv(
    process.env.SCRIPTWRITER_MAX_COMPLETION_TOKENS,
    DEFAULT_MAX_COMPLETION_TOKENS,
  );
  const envReasoningEffort =
    parseReasoningEffort(process.env.SCRIPTWRITER_REASONING_EFFORT) ??
    DEFAULT_REASONING_EFFORT;
  const envTimeoutMs = parsePositiveIntEnv(
    process.env.SCRIPTWRITER_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );

  const {
    model = process.env.SCRIPTWRITER_MODEL ?? DEFAULT_SCRIPTWRITER_MODEL,
    temperature = 0.7,
    reasoningEffort = envReasoningEffort,
    maxTokens = envMaxCompletionTokens,
    timeoutMs = envTimeoutMs,
  } = options;

  const isReasoningModel = isReasoningModelName(model);

  const baseConfig: Record<string, unknown> = {
    model,
    modelName: model,
    // Handle retries explicitly in scriptwriterChain to avoid duplicate hidden
    // retries that inflate latency and obscure observability.
    maxRetries: 0,
    timeout: timeoutMs,
  };

  if (isReasoningModel) {
    // Prevent ChatOpenAI from sending max_tokens to models that only accept
    // max_completion_tokens.
    baseConfig.maxTokens = -1;
    baseConfig.modelKwargs = {
      max_completion_tokens: maxTokens,
    };

    if (reasoningEffort) {
      baseConfig.reasoning_effort = reasoningEffort;
    }
  } else {
    baseConfig.maxTokens = maxTokens;
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

const extractContent = (modelResponse: unknown, requestedModel: string): string => {
  if (typeof modelResponse === "string") {
    const trimmed = modelResponse.trim();
    if (!trimmed) {
      throw new ScriptwriterChainError(
        `Model returned empty content (finish_reason=unknown, model=${requestedModel}).`,
        "MODEL_INVOCATION",
      );
    }
    return trimmed;
  }

  const content = (modelResponse as { content?: unknown })?.content;
  const metadata = (modelResponse as { response_metadata?: Record<string, unknown> })
    ?.response_metadata;
  const finishReason = String(metadata?.finish_reason ?? "unknown");
  const modelName = String(metadata?.model_name ?? requestedModel);

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new ScriptwriterChainError(
        `Model returned empty content (finish_reason=${finishReason}, model=${modelName}).`,
        finishReason === "length" ? "OUTPUT_TRUNCATED" : "MODEL_INVOCATION",
      );
    }
    return trimmed;
  }

  if (Array.isArray(content)) {
    const joined = content
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

    if (!joined) {
      throw new ScriptwriterChainError(
        `Model returned empty content blocks (finish_reason=${finishReason}, model=${modelName}).`,
        finishReason === "length" ? "OUTPUT_TRUNCATED" : "MODEL_INVOCATION",
      );
    }

    return joined;
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

const isRetryable = (error: unknown): boolean => {
  if (error instanceof ScriptwriterParserError) {
    return true;
  }

  if (error instanceof z.ZodError) {
    return true;
  }

  if (isTimeoutError(error)) {
    return true;
  }

  return error instanceof ScriptwriterChainError && error.code === "OUTPUT_TRUNCATED";
};

const runAttempt = async ({
  llm,
  prompt,
  model,
}: {
  llm: ChatOpenAI;
  prompt: string;
  model: string;
}): Promise<ScriptOutputType> => {
  const response = await llm.invoke(prompt);
  const content = extractContent(response, model);
  const parsed = parseScriptwriterOutput(content);
  return normalizeToScriptOutput(parsed);
};

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

  const selectedModel = options.model ?? process.env.SCRIPTWRITER_MODEL ?? DEFAULT_SCRIPTWRITER_MODEL;
  const fallbackModel =
    process.env.SCRIPTWRITER_FALLBACK_MODEL ?? DEFAULT_SCRIPTWRITER_FALLBACK_MODEL;
  const fallbackMaxTokens = parsePositiveIntEnv(
    process.env.SCRIPTWRITER_FALLBACK_MAX_TOKENS,
    DEFAULT_FALLBACK_MAX_TOKENS,
  );
  const prompt = buildScriptwriterPrompt(validatedInput);
  const llm = createScriptwriterModel({
    ...options,
    model: selectedModel,
  });

  let primaryError: unknown;
  try {
    return await runAttempt({
      llm,
      prompt,
      model: selectedModel,
    });
  } catch (error) {
    primaryError = error;
  }

  if (!isRetryable(primaryError)) {
    throw new ScriptwriterChainError(
      `Scriptwriter model invocation failed on ${selectedModel}: ${toErrorMessage(
        primaryError,
      )}`,
      "MODEL_INVOCATION",
      primaryError,
    );
  }

  const secondaryModel =
    fallbackModel && fallbackModel !== selectedModel
      ? fallbackModel
      : selectedModel;
  const fallbackPrompt = buildFallbackPrompt(validatedInput);
  const fallbackLlm = createScriptwriterModel({
    ...options,
    model: secondaryModel,
    maxTokens: fallbackMaxTokens,
  });

  try {
    return await runAttempt({
      llm: fallbackLlm,
      prompt: fallbackPrompt,
      model: secondaryModel,
    });
  } catch (fallbackError) {
    throw new ScriptwriterChainError(
      `Scriptwriter attempts failed: primary model ${selectedModel} error: ${toErrorMessage(
        primaryError,
      )}; fallback model ${secondaryModel} error: ${toErrorMessage(
        fallbackError,
      )}`,
      "FALLBACK_FAILED",
      {
        primary: primaryError,
        fallback: fallbackError,
      },
    );
  }
}
