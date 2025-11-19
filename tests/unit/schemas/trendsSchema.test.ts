import { describe, expect, it } from "vitest";
import { trendSnapshotInputSchema } from "../../../src/schemas/trendsSchema";

describe("trendSnapshotInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      productId: "123e4567-e89b-12d3-a456-426614174000",
      competitionScore: 50,
      tiktokTrendTags: ["tag1", "tag2"],
    };
    const result = trendSnapshotInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires productId", () => {
    expect(() => trendSnapshotInputSchema.parse({})).toThrow();
  });

  it("validates scores are non-negative", () => {
    const input = {
      productId: "123e4567-e89b-12d3-a456-426614174000",
      competitionScore: -1,
    };
    expect(() => trendSnapshotInputSchema.parse(input)).toThrow();
  });
});
