import { ChatOpenAI } from "@langchain/openai";

export function createScriptwriterModel(temperature = 0.7): ChatOpenAI {
  return new ChatOpenAI({
    modelName: process.env.SCRIPTWRITER_MODEL ?? "gpt-5",
    temperature,
  });
}

export function createEditorModel(temperature = 0.3): ChatOpenAI {
  return new ChatOpenAI({
    modelName: process.env.EDITOR_MODEL ?? "gpt-5",
    temperature,
  });
}
