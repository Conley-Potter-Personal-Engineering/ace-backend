import { describe, expect, it } from "vitest";
import { scriptInsertSchema } from "../../../src/schemas/scriptsSchema";

const validPayload = {
  productId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  scriptText: "Buy this product because it solves your problem!",
  hook: "Stop scrolling and check this out",
  creativePatternId: "8c76f6dd-44c3-4d4c-9c28-0d2b6c4c1e62",
  trendReference: "2b6f0c45-cf59-4f43-b88b-8b7e0c8f44ef",
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
        creativePatternId: "not-a-uuid",
      }),
    ).toThrow();
  });
});
