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
import { type EditorRequest } from "../../schemas/editorSchemas";

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

const editorModel = createEditorModel(0.35);

const editorRunnable = RunnableSequence.from<
  EditorPromptInput,
  EditorParserOutput
>([buildEditorPrompt, editorModel as any, editorOutputParser]);

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

  const parsed = await editorRunnable.invoke(promptInput);

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
): string => {
  const styleLabel = styleTemplateId ?? "default-style";
  return [
    `duration=${composition.duration}`,
    `tone=${composition.tone}`,
    `layout=${composition.layout}`,
    `style=${styleLabel}`,
  ].join("|");
};

const defaultStorageHint = (styleTemplateId?: string): string => {
  const safeStyle = styleTemplateId?.replace(/\s+/g, "-").toLowerCase() ?? "default";
  return `videos/rendered/${safeStyle}.mp4`;
};

export default async function editorChain(
  scriptContent: string,
  composition: EditorRequest["composition"],
  styleTemplateId?: string,
): Promise<EditorChainInvocationOutput> {
  const baseResult = await runEditorChain({
    scriptText: scriptContent,
    creativeVariables: composition,
    storagePathHint: defaultStorageHint(styleTemplateId),
  });

  const styleTags = styleTemplateId ? [styleTemplateId] : [];

  return {
    ...baseResult,
    durationSeconds: baseResult.durationSeconds ?? composition.duration,
    styleTags,
    mockVideo: buildMockVideo(composition, styleTemplateId),
  };
}
