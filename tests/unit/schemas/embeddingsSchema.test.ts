import { describe, expect, it } from "vitest";
import { embeddingInputSchema } from "../../../src/schemas/embeddingsSchema";

describe("embeddingInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      embedding: "[0.1, 0.2, 0.3]",
      referenceId: "123e4567-e89b-12d3-a456-426614174000",
      referenceType: "script",
    };
    const result = embeddingInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires embedding, referenceId, and referenceType", () => {
    expect(() => embeddingInputSchema.parse({})).toThrow();
  });

  it("validates UUID for referenceId", () => {
    const input = {
      embedding: "[]",
      referenceId: "invalid-uuid",
      referenceType: "script",
    };
    expect(() => embeddingInputSchema.parse(input)).toThrow();
  });
});
