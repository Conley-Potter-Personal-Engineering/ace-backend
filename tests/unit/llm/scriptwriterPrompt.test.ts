import { describe, expect, it } from "vitest";
import { buildScriptwriterPrompt } from "@/llm/prompts/scriptwriterPrompt";

describe("buildScriptwriterPrompt", () => {
  it("does not throw when product.meta list fields are not arrays", () => {
    const prompt = buildScriptwriterPrompt({
      product: {
        product_id: "1a123976-f557-44e0-bced-840237afdab8",
        name: "Test Product",
        description: "Test description",
        category: "test",
        meta: {
          key_features: "fast,easy",
          demo_ideas: { primary: "unboxing" },
          objections: null,
          compliance: "No medical claims",
        },
      },
      pattern: {
        pattern_id: "43b95f49-4cb4-4c8e-bceb-d6fad0acc175",
        structure: "problem-solution",
        hook_text: "Stop scrolling",
        style_tags: ["direct"],
        emotion_tags: ["curious"],
        observed_performance: null,
      },
      trend: {
        snapshot_id: "6e360aa3-bc26-4dcc-918e-8c89134add1c",
        tiktok_trend_tags: ["trend-a"],
        velocity_score: 0.8,
        popularity_score: 0.9,
      },
    });

    expect(prompt).toContain("## Key Features");
    expect(prompt).toContain("- fast");
    expect(prompt).toContain("- easy");
  });
});
