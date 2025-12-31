import { describe, expect, it } from "vitest";
import { ExperimentInputSchema } from "../../../src/schemas/experimentsSchema";

describe("experimentsSchema", () => {
  it("parses valid input", () => {
    const input = {
      hypothesis: "test hypothesis",
      variationLabel: "A",
    };
    const result = ExperimentInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("allows optional fields", () => {
    const input = {};
    const result = ExperimentInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("validates UUIDs if provided", () => {
    const input = {
      productId: "invalid-uuid",
    };
    expect(() => ExperimentInputSchema.parse(input)).toThrow();
  });
});
