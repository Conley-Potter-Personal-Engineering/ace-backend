import { describe, it, expect } from "vitest";
import { scriptInputSchema } from "../../../src/schemas/scriptsSchema";

describe("scriptInputSchema", () => {
  it("accepts valid script data", () => {
    const data = {
      scriptText: "Buy this thing!",
      hook: "STOP scrolling",
      creativeVariables: {
        emotion: "excited",
        structure: "problem-solution",
        style: "energetic"
      }
    };

    expect(() => scriptInputSchema.parse(data)).not.toThrow();
  });

  it("rejects invalid script data", () => {
    const data = {
      scriptText: 123, // invalid
      hook: "okay",
      creativeVariables: {}
    };

    expect(() => scriptInputSchema.parse(data)).toThrow();
  });
});
