import { describe, expect, it } from "vitest";
import { SystemEventInputSchema } from "../../../src/schemas/systemEventsSchema";

describe("SystemEventInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      eventType: "TEST_EVENT",
      agentName: "TestAgent",
      payload: { key: "value" },
    };
    const result = SystemEventInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires eventType", () => {
    expect(() => SystemEventInputSchema.parse({})).toThrow();
  });

  it("validates empty strings", () => {
    const input = {
      eventType: "",
    };
    expect(() => SystemEventInputSchema.parse(input)).toThrow();
  });
});
