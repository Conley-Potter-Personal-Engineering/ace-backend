import { describe, expect, it } from "vitest";
import { systemEventInputSchema } from "../../../src/schemas/eventsSchema";

describe("systemEventInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      eventType: "TEST_EVENT",
      agentName: "TestAgent",
      payload: { key: "value" },
    };
    const result = systemEventInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires eventType", () => {
    expect(() => systemEventInputSchema.parse({})).toThrow();
  });

  it("validates empty strings", () => {
    const input = {
      eventType: "",
    };
    expect(() => systemEventInputSchema.parse(input)).toThrow();
  });
});
