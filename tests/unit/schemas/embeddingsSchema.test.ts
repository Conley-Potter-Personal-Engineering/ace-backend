import { describe, expect, it } from "vitest";
import { EmbeddingInputSchema } from "../../../src/schemas/embeddingsSchema";

describe("EmbeddingInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      embedding: "[0.1, 0.2, 0.3]",
      referenceId: "123e4567-e89b-12d3-a456-426614174000",
      referenceType: "script",
    };
    const result = EmbeddingInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires embedding, referenceId, and referenceType", () => {
    expect(() => EmbeddingInputSchema.parse({})).toThrow();
  });

  it("validates UUID for referenceId", () => {
    const input = {
      embedding: "[]",
      referenceId: "invalid-uuid",
      referenceType: "script",
    };
    expect(() => EmbeddingInputSchema.parse(input)).toThrow();
  });
});
