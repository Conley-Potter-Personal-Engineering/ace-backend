import { describe, expect, it } from "vitest";
import { performanceMetricInputSchema } from "../../../src/schemas/performanceSchema";

describe("performanceMetricInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      viewCount: 100,
      likeCount: 10,
    };
    const result = performanceMetricInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("allows optional fields", () => {
    expect(performanceMetricInputSchema.parse({})).toEqual({});
  });

  it("validates non-negative integers", () => {
    const input = {
      viewCount: -1,
    };
    expect(() => performanceMetricInputSchema.parse(input)).toThrow();
  });
});
