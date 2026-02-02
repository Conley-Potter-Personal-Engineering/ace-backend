import { describe, expect, it } from "vitest";
import { determineSystemHealth } from "@/lib/api/utils/systemHealth";

describe("systemHealth utility", () => {
  it("returns healthy when no critical errors and no workflow failures", () => {
    expect(determineSystemHealth(0, false)).toBe("healthy");
  });

  it("returns degraded when there are critical errors", () => {
    expect(determineSystemHealth(1, false)).toBe("degraded");
  });

  it("returns degraded when workflow failures are present", () => {
    expect(determineSystemHealth(0, true)).toBe("degraded");
  });

  it("returns down when critical errors exceed threshold", () => {
    expect(determineSystemHealth(6, false)).toBe("down");
  });

  it("treats negative or invalid counts as zero", () => {
    expect(determineSystemHealth(-2, false)).toBe("healthy");
  });
});
