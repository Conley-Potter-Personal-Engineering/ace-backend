import { describe, expect, it } from "vitest";
import {
  calculatePercentChange,
  calculatePerformanceScore,
  calculateTrendDirection,
} from "@/lib/api/utils/trendCalculation";

describe("trendCalculation utilities", () => {
  it("calculates percent change with division by zero handling", () => {
    expect(calculatePercentChange(10, 0)).toBe(0);
    expect(calculatePercentChange(0, 0)).toBe(0);
  });

  it("calculates percent change for normal values", () => {
    expect(calculatePercentChange(110, 100)).toBe(10);
    expect(calculatePercentChange(90, 100)).toBe(-10);
  });

  it("determines trend direction using a 10% threshold", () => {
    expect(calculateTrendDirection(110, 100, 0.1)).toBe("up");
    expect(calculateTrendDirection(90, 100, 0.1)).toBe("down");
    expect(calculateTrendDirection(105, 100, 0.1)).toBe("stable");
  });

  it("handles zero previous values in trend direction", () => {
    expect(calculateTrendDirection(0, 0, 0.1)).toBe("stable");
    expect(calculateTrendDirection(5, 0, 0.1)).toBe("up");
  });

  it("calculates performance score from metrics", () => {
    const score = calculatePerformanceScore({
      view_count: 100,
      like_count: 10,
      comment_count: 5,
      share_count: 2,
    });

    expect(score).toBe(73);
  });
});
