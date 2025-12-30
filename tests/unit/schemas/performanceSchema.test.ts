import { describe, expect, it } from "vitest";
import { PerformanceMetricInputSchema } from "../../../src/schemas/performanceSchema";

describe("PerformanceMetricInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      viewCount: 100,
      likeCount: 10,
    };
    const result = PerformanceMetricInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("allows optional fields", () => {
    expect(PerformanceMetricInputSchema.parse({})).toEqual({});
  });

  it("validates non-negative integers", () => {
    const input = {
      viewCount: -1,
    };
    expect(() => PerformanceMetricInputSchema.parse(input)).toThrow();
  });
});
