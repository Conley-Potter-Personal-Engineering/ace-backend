import { describe, expect, it } from "vitest";
import { scriptInsertSchema } from "../../../src/schemas/scriptsSchema";

const validPayload = {
  productId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  scriptText: "Buy this product because it solves your problem!",
  hook: "Stop scrolling and check this out",
  creativeVariables: {
    emotion: "excited",
    structure: "problem-solution",
    style: "energetic",
  },
};

describe("scriptInsertSchema", () => {
  it("accepts a complete script payload", () => {
    const parsed = scriptInsertSchema.parse(validPayload);

    expect(parsed.productId).toBe(validPayload.productId);
    expect(parsed.scriptText).toBe(validPayload.scriptText);
  });

  it("rejects payloads with invalid UUIDs and missing fields", () => {
    expect(() =>
      scriptInsertSchema.parse({
        productId: "not-a-uuid",
        hook: "",
        creativeVariables: { emotion: "", structure: "", style: "" },
      }),
    ).toThrow();
  });
});
