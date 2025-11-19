import { RunnableSequence } from "@langchain/core/runnables";
import type { Tables } from "../../db/types";
import { createScriptwriterModel } from "../models/openaiModel";
import {
  scriptwriterOutputParser,
  type ScriptwriterParserOutput,
} from "../parsers/scriptwriterParser";
import {
  buildScriptwriterPrompt,
  type ScriptwriterPromptInput,
} from "../prompts/scriptwriterPrompt";

interface RunScriptwriterChainParams {
  product: Tables<"products">;
  notes: Tables<"agent_notes">[];
}

const model = createScriptwriterModel();

const scriptwriterRunnable = RunnableSequence.from<
  ScriptwriterPromptInput,
  ScriptwriterParserOutput
>([
  buildScriptwriterPrompt,
  model as any,
  scriptwriterOutputParser,
]);

export interface ScriptwriterChainResult {
  scriptText: string;
  hook: string;
  creativeVariables: ScriptwriterParserOutput["creativeVariables"];
}

const buildNotesSummary = (notes: Tables<"agent_notes">[]): string => {
  if (!notes.length) {
    return "No notes available.";
  }

  return notes
    .map(
      (note) => `- ${note.topic ?? "note"}: ${note.content ?? "No content provided."}`,
    )
    .join("\n");
};

export async function runScriptwriterChain({
  product,
  notes,
}: RunScriptwriterChainParams): Promise<ScriptwriterChainResult> {
  const promptInput: ScriptwriterPromptInput = {
    productName: product.name ?? "Untitled product",
    productDescription: product.description ?? "No description provided.",
    category: product.category ?? "Uncategorized",
    notes: buildNotesSummary(notes),
  };

  const parsed = await scriptwriterRunnable.invoke(promptInput);

  return {
    scriptText: parsed.scriptText,
    hook: parsed.hook,
    creativeVariables: parsed.creativeVariables,
  };
}
