import { describe, expect, it } from "vitest";
import { PublishedPostInputSchema } from "../../../src/schemas/postsSchema";

describe("PublishedPostInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      platform: "TikTok",
      caption: "Check this out!",
      hashtags: ["#viral", "#fyp"],
    };
    const result = PublishedPostInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires platform", () => {
    expect(() => PublishedPostInputSchema.parse({})).toThrow();
  });

  it("validates UUID for experimentId", () => {
    const input = {
      platform: "TikTok",
      experimentId: "invalid-uuid",
    };
    expect(() => PublishedPostInputSchema.parse(input)).toThrow();
  });
});
