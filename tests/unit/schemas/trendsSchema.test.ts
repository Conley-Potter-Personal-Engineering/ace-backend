import { describe, expect, it } from "vitest";
import { TrendSnapshotInputSchema } from "../../../src/schemas/trendsSchema";

describe("TrendSnapshotInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      snapshot_id: "123e4567-e89b-12d3-a456-426614174000",
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      popularity_score: 50,
      velocity_score: 0.8,
      competition_score: 50,
      tiktok_trend_tags: ["tag1", "tag2"],
      raw_source_data: null,
      snapshot_time: new Date().toISOString(),
    };
    const result = TrendSnapshotInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires productId", () => {
    expect(() => TrendSnapshotInputSchema.parse({})).toThrow();
  });

  it("validates scores are non-negative", () => {
    const input = {
      snapshot_id: "123e4567-e89b-12d3-a456-426614174000",
      product_id: "123e4567-e89b-12d3-a456-426614174000",
      popularity_score: -1,
      velocity_score: 0.8,
      competition_score: -1,
      tiktok_trend_tags: ["tag1"],
      raw_source_data: null,
      snapshot_time: new Date().toISOString(),
    };
    expect(() => TrendSnapshotInputSchema.parse(input)).toThrow();
  });
});
