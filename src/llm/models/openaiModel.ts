import { ChatOpenAI } from "@langchain/openai";

type ChatModel = { invoke: (...args: any[]) => Promise<unknown> };

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

export function createScriptwriterModel(temperature = 0.7): ChatOpenAI {
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
    temperature,
  });
}

export function createEditorModel(temperature = 0.3): ChatOpenAI {
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

  return new ChatOpenAI({
    modelName: process.env.EDITOR_MODEL ?? "gpt-5",
    temperature,
  });
}
