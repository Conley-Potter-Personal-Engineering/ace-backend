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
