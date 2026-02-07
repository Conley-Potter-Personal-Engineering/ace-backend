import { RunnableSequence } from "@langchain/core/runnables";
import { createEditorModel } from "../models/openaiModel";
import {
  editorOutputParser,
  type EditorParserOutput,
} from "../parsers/editorParser";
import {
  buildEditorPrompt,
  type EditorPromptInput,
} from "../prompts/editorPrompt";
import { type EditorRequest, type StyleTemplate } from "../../schemas/editorSchemas";

interface RunEditorChainParams {
  scriptText: string;
  hook?: string | null;
  creativeVariables?: unknown;
  storagePathHint?: string;
}

export interface EditorChainResult {
  storagePath: string;
  thumbnailPath?: string;
  durationSeconds?: number;
  metadata: EditorParserOutput["metadata"];
}

export class EditorChainError extends Error {
  code: "MODEL_INVOCATION" | "FALLBACK_FAILED";
  cause?: unknown;

  constructor(
    message: string,
    code: EditorChainError["code"],
    cause?: unknown,
  ) {
    super(message);
    this.name = "EditorChainError";
    this.code = code;
    this.cause = cause;
  }
}

const DEFAULT_EDITOR_MODEL = "gpt-5";
const DEFAULT_EDITOR_FALLBACK_MODEL = "gpt-4.1-mini";
const DEFAULT_EDITOR_FALLBACK_MAX_TOKENS = 1000;
const DEFAULT_EDITOR_TIMEOUT_MS = 45000;

const parsePositiveIntEnv = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isRetryable = (error: unknown): boolean => {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("credentials are required")) {
    return false;
  }

  return (
    message.includes("unsupported parameter") ||
    message.includes("unsupported value") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("failed to parse") ||
    message.includes("invalid json") ||
    message.includes("output parser")
  );
};

const stringifyCreativeVariables = (
  creativeVariables?: unknown,
): string => {
  if (!creativeVariables) {
    return "No creative variables provided.";
  }

  if (typeof creativeVariables === "string") {
    return creativeVariables;
  }

  if (typeof creativeVariables !== "object") {
    return String(creativeVariables);
  }

  return Object.entries(creativeVariables as Record<string, unknown>)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
};

export async function runEditorChain({
  scriptText,
  hook,
  creativeVariables,
  storagePathHint,
}: RunEditorChainParams): Promise<EditorChainResult> {
  const promptInput: EditorPromptInput = {
    scriptText,
    hook: hook ?? "No hook provided.",
    creativeVariables: stringifyCreativeVariables(creativeVariables),
    storagePathHint: storagePathHint ?? "videos/rendered/video.mp4",
  };

  const primaryModel = process.env.EDITOR_MODEL ?? DEFAULT_EDITOR_MODEL;
  const fallbackModel =
    process.env.EDITOR_FALLBACK_MODEL ?? DEFAULT_EDITOR_FALLBACK_MODEL;
  const timeoutMs = parsePositiveIntEnv(
    process.env.EDITOR_TIMEOUT_MS,
    DEFAULT_EDITOR_TIMEOUT_MS,
  );
  const fallbackMaxTokens = parsePositiveIntEnv(
    process.env.EDITOR_FALLBACK_MAX_TOKENS,
    DEFAULT_EDITOR_FALLBACK_MAX_TOKENS,
  );

  const invokeModel = async (model: string, maxTokens?: number) => {
    const runnable = RunnableSequence.from<EditorPromptInput, EditorParserOutput>(
      [
        buildEditorPrompt,
        createEditorModel({
          model,
          timeoutMs,
          maxTokens,
        }) as any,
        editorOutputParser,
      ],
    );

    return runnable.invoke(promptInput);
  };

  let parsed: EditorParserOutput;
  try {
    parsed = await invokeModel(primaryModel);
  } catch (primaryError) {
    if (!isRetryable(primaryError) || fallbackModel === primaryModel) {
      throw new EditorChainError(
        `Editor model invocation failed on ${primaryModel}: ${toErrorMessage(primaryError)}`,
        "MODEL_INVOCATION",
        primaryError,
      );
    }

    try {
      parsed = await invokeModel(fallbackModel, fallbackMaxTokens);
    } catch (fallbackError) {
      throw new EditorChainError(
        `Editor attempts failed: primary model ${primaryModel} error: ${toErrorMessage(
          primaryError,
        )}; fallback model ${fallbackModel} error: ${toErrorMessage(fallbackError)}`,
        "FALLBACK_FAILED",
        fallbackError,
      );
    }
  }

  return {
    storagePath: parsed.storagePath,
    thumbnailPath: parsed.thumbnailPath,
    durationSeconds: parsed.durationSeconds,
    metadata: parsed.metadata,
  };
}

export interface EditorChainInvocationOutput extends EditorChainResult {
  styleTags: string[];
  mockVideo: string;
}

const buildMockVideo = (
  composition: EditorRequest["composition"],
  styleTemplateId?: string,
  styleTemplate?: StyleTemplate | null,
): string => {
  const styleLabel =
    styleTemplate?.name ?? styleTemplateId ?? "default-style";
  return [
    `duration=${composition.duration}`,
    `tone=${composition.tone}`,
    `layout=${composition.layout}`,
    `style=${styleLabel}`,
  ].join("|");
};

const defaultStorageHint = (
  styleTemplateId?: string,
  styleTemplate?: StyleTemplate | null,
): string => {
  const label = styleTemplate?.name ?? styleTemplateId ?? "default";
  const safeStyle = label.replace(/\s+/g, "-").toLowerCase();
  return `videos/rendered/${safeStyle}.mp4`;
};

export default async function editorChain(
  scriptContent: string,
  composition: EditorRequest["composition"],
  styleTemplateId?: string,
  styleTemplate?: StyleTemplate | null,
): Promise<EditorChainInvocationOutput> {
  const baseResult = await runEditorChain({
    scriptText: scriptContent,
    creativeVariables: {
      ...composition,
      styleTemplate: styleTemplate ?? undefined,
    },
    storagePathHint: defaultStorageHint(styleTemplateId, styleTemplate),
  });

  const styleTags = styleTemplate?.name
    ? [styleTemplate.name]
    : styleTemplateId
    ? [styleTemplateId]
    : [];

  return {
    ...baseResult,
    durationSeconds: baseResult.durationSeconds ?? composition.duration,
    styleTags,
    mockVideo: buildMockVideo(composition, styleTemplateId, styleTemplate),
  };
}
