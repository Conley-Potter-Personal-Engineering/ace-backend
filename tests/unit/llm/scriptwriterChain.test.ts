import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  constructorArgs: [] as Array<Record<string, unknown>>,
  responses: [] as Array<unknown>,
}));

vi.mock("@langchain/openai", () => {
  class MockChatOpenAI {
    constructor(config: Record<string, unknown>) {
      mockState.constructorArgs.push(config);
    }

    async invoke(): Promise<unknown> {
      const next = mockState.responses.shift();
      if (next instanceof Error) {
        throw next;
      }
      return next;
    }
  }

  return {
    ChatOpenAI: MockChatOpenAI,
  };
});

import { scriptwriterChain } from "@/llm/chains/scriptwriterChain";

const originalNodeEnv = process.env.NODE_ENV;

const buildValidResponse = (overrides?: Partial<Record<string, unknown>>) => ({
  title: "Script Title",
  hook: "This hook is valid",
  outline: ["Beat one", "Beat two", "Beat three"],
  script_text:
    "This is a sufficiently long script body for parser validation and unit tests.",
  cta: "Tap now",
  ...overrides,
});

const chainInput = {
  product: {
    product_id: "1a123976-f557-44e0-bced-840237afdab8",
    name: "GlowGuard",
    description: "Reusable pet hair remover.",
    category: "Home",
    meta: {
      key_features: ["Reusable", "Self-cleaning chamber"],
      demo_ideas: ["Couch swipe", "Car seat cleanup"],
      compliance: ["No medical claims"],
    },
  },
  pattern: {
    pattern_id: "43b95f49-4cb4-4c8e-bceb-d6fad0acc175",
    structure: "testimonial",
    hook_text: "I can cuddle on the couch again.",
    style_tags: ["warm"],
    emotion_tags: ["relief"],
    observed_performance: null,
  },
  trend: {
    snapshot_id: "6e360aa3-bc26-4dcc-918e-8c89134add1c",
    tiktok_trend_tags: ["pet-parent"],
    velocity_score: 78,
    popularity_score: 83,
  },
};

describe("scriptwriterChain", () => {
  beforeEach(() => {
    mockState.constructorArgs.length = 0;
    mockState.responses.length = 0;

    process.env.NODE_ENV = "development";
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.OPENAI_ACCESS_TOKEN;
    delete process.env.SCRIPTWRITER_MODEL;
    delete process.env.SCRIPTWRITER_FALLBACK_MODEL;
    delete process.env.SCRIPTWRITER_MAX_COMPLETION_TOKENS;
    delete process.env.SCRIPTWRITER_FALLBACK_MAX_TOKENS;
    delete process.env.SCRIPTWRITER_REASONING_EFFORT;
    delete process.env.SCRIPTWRITER_TIMEOUT_MS;
    delete process.env.MOCK_LLM;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("uses reasoning-safe config for gpt-5 defaults", async () => {
    process.env.SCRIPTWRITER_MAX_COMPLETION_TOKENS = "4096";
    process.env.SCRIPTWRITER_REASONING_EFFORT = "medium";
    process.env.SCRIPTWRITER_TIMEOUT_MS = "20000";

    mockState.responses.push({
      content: JSON.stringify(buildValidResponse()),
      response_metadata: { model_name: "gpt-5" },
    });

    await scriptwriterChain(chainInput);

    const config = mockState.constructorArgs[0];
    expect(config.modelName).toBe("gpt-5");
    expect(config.maxRetries).toBe(0);
    expect(config.maxTokens).toBe(-1);
    expect(config.reasoning_effort).toBe("medium");
    expect(config.timeout).toBe(20000);
    expect((config.modelKwargs as Record<string, unknown>)?.max_completion_tokens).toBe(
      4096,
    );
  });

  it("retries with fallback model when primary returns length-truncated empty output", async () => {
    process.env.SCRIPTWRITER_MODEL = "gpt-5";
    process.env.SCRIPTWRITER_FALLBACK_MODEL = "gpt-4.1-mini";
    process.env.SCRIPTWRITER_FALLBACK_MAX_TOKENS = "1200";

    mockState.responses.push(
      {
        content: "",
        response_metadata: { finish_reason: "length", model_name: "gpt-5" },
      },
      {
        content: JSON.stringify(buildValidResponse({ title: "Fallback Title" })),
        response_metadata: { model_name: "gpt-4.1-mini" },
      },
    );

    const result = await scriptwriterChain(chainInput);

    expect(result.title).toBe("Fallback Title");
    expect(mockState.constructorArgs).toHaveLength(2);
    expect(mockState.constructorArgs[0].modelName).toBe("gpt-5");
    expect(mockState.constructorArgs[1].modelName).toBe("gpt-4.1-mini");
    expect(mockState.constructorArgs[1].maxTokens).toBe(1200);
  });

  it("fails fast without fallback on non-retryable model invocation errors", async () => {
    process.env.SCRIPTWRITER_MODEL = "gpt-5";
    process.env.SCRIPTWRITER_FALLBACK_MODEL = "gpt-4.1-mini";

    mockState.responses.push(new Error("401 invalid api key"));

    await expect(scriptwriterChain(chainInput)).rejects.toThrow(
      "Scriptwriter model invocation failed on gpt-5",
    );
    expect(mockState.constructorArgs).toHaveLength(1);
  });

  it("retries with fallback model when primary request times out", async () => {
    process.env.SCRIPTWRITER_MODEL = "gpt-5";
    process.env.SCRIPTWRITER_FALLBACK_MODEL = "gpt-4.1-mini";

    mockState.responses.push(
      new Error("Request timed out."),
      {
        content: JSON.stringify(buildValidResponse({ title: "Recovered Title" })),
        response_metadata: { model_name: "gpt-4.1-mini" },
      },
    );

    const result = await scriptwriterChain(chainInput);
    expect(result.title).toBe("Recovered Title");
    expect(mockState.constructorArgs).toHaveLength(2);
    expect(mockState.constructorArgs[0].modelName).toBe("gpt-5");
    expect(mockState.constructorArgs[1].modelName).toBe("gpt-4.1-mini");
  });

  it("returns aggregated attempt details when both primary and fallback fail", async () => {
    process.env.SCRIPTWRITER_MODEL = "gpt-5";
    process.env.SCRIPTWRITER_FALLBACK_MODEL = "gpt-4.1-mini";

    mockState.responses.push(
      {
        content: "",
        response_metadata: { finish_reason: "length", model_name: "gpt-5" },
      },
      {
        content: "",
        response_metadata: { finish_reason: "length", model_name: "gpt-4.1-mini" },
      },
    );

    try {
      await scriptwriterChain(chainInput);
      throw new Error("Expected scriptwriterChain to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain(
        "Scriptwriter attempts failed: primary model gpt-5 error:",
      );
      expect(message).toContain("fallback model gpt-4.1-mini error:");
    }
  });
});
