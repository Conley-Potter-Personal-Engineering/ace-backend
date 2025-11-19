import { describe, expect, it } from "vitest";
import { publishedPostInputSchema } from "../../../src/schemas/postsSchema";

describe("publishedPostInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      platform: "TikTok",
      caption: "Check this out!",
      hashtags: ["#viral", "#fyp"],
    };
    const result = publishedPostInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires platform", () => {
    expect(() => publishedPostInputSchema.parse({})).toThrow();
  });

  it("validates UUID for experimentId", () => {
    const input = {
      platform: "TikTok",
      experimentId: "invalid-uuid",
    };
    expect(() => publishedPostInputSchema.parse(input)).toThrow();
  });
});
