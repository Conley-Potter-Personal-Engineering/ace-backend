import { ChatOpenAI } from "@langchain/openai";

type ChatModel = { invoke: (...args: any[]) => Promise<unknown> };
type ReasoningEffort = "low" | "medium" | "high";

const DEFAULT_EDITOR_MODEL = "gpt-5";
const DEFAULT_EDITOR_MAX_COMPLETION_TOKENS = 1400;
const DEFAULT_EDITOR_TIMEOUT_MS = 45000;
const DEFAULT_EDITOR_TEMPERATURE = 0.35;
const DEFAULT_EDITOR_REASONING_EFFORT: ReasoningEffort = "low";

class StaticResponseChatModel implements ChatModel {
  constructor(private readonly response: string) {}

  async invoke(): Promise<{ content: string }> {
    return { content: this.response };
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

const isReasoningModelName = (modelName: string): boolean => {
  const normalizedModel = modelName.toLowerCase();
  return (
    normalizedModel.startsWith("o1") ||
    normalizedModel.startsWith("o3") ||
    normalizedModel.includes("gpt-5")
  );
};

const parsePositiveIntEnv = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseReasoningEffort = (
  value: string | undefined,
): ReasoningEffort | undefined => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return undefined;
};

export function createScriptwriterModel(): ChatOpenAI {
  if (shouldMockModel()) {
    return new StaticResponseChatModel(
      JSON.stringify({
        title: "Test Script Title",
        hook: "Test hook",
        cta: "Test CTA",
        outline: ["Intro", "Body"],
        body: "This is a test script body used for local and CI runs.",
      }),
    ) as unknown as ChatOpenAI;
  }

  if (!hasOpenAICredentials()) {
    throw new Error(
      "OpenAI or Azure OpenAI credentials are required for the Scriptwriter model.",
    );
  }

  return new ChatOpenAI({
    modelName: process.env.SCRIPTWRITER_MODEL ?? "gpt-5",
  });
}

export interface EditorModelOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  reasoningEffort?: ReasoningEffort;
}

const buildEditorModelConfig = (
  options: EditorModelOptions,
): Record<string, unknown> => {
  const model = options.model ?? process.env.EDITOR_MODEL ?? DEFAULT_EDITOR_MODEL;
  const maxTokens =
    options.maxTokens ??
    parsePositiveIntEnv(
      process.env.EDITOR_MAX_COMPLETION_TOKENS,
      DEFAULT_EDITOR_MAX_COMPLETION_TOKENS,
    );
  const timeoutMs =
    options.timeoutMs ??
    parsePositiveIntEnv(process.env.EDITOR_TIMEOUT_MS, DEFAULT_EDITOR_TIMEOUT_MS);
  const reasoningEffort =
    options.reasoningEffort ??
    parseReasoningEffort(process.env.EDITOR_REASONING_EFFORT) ??
    DEFAULT_EDITOR_REASONING_EFFORT;
  const temperature = options.temperature ?? DEFAULT_EDITOR_TEMPERATURE;

  const baseConfig: Record<string, unknown> = {
    model,
    modelName: model,
    maxRetries: 0,
    timeout: timeoutMs,
  };

  if (isReasoningModelName(model)) {
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

export function createEditorModel(options: EditorModelOptions = {}): ChatOpenAI {
  if (shouldMockModel()) {
    return new StaticResponseChatModel(
      JSON.stringify({
        storagePath: "videos/rendered/test.mp4",
        thumbnailPath: "videos/rendered/test.jpg",
        durationSeconds: 30,
        metadata: {
          title: "Test Video",
          summary: "Test summary",
          beats: [
            {
              timestamp: "0s",
              visual: "Test visual",
              narration: "Test narration",
            },
          ],
          soundtrack: "Test soundtrack",
          transitions: "Test transitions",
        },
      }),
    ) as unknown as ChatOpenAI;
  }

  if (!hasOpenAICredentials()) {
    throw new Error(
      "OpenAI or Azure OpenAI credentials are required for the Editor model.",
    );
  }

  return new ChatOpenAI(buildEditorModelConfig(options));
}
