import { describe, expect, it } from "vitest";
import { videoAssetInputSchema } from "../../../src/schemas/videosSchema";

describe("videoAssetInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      storagePath: "/path/to/video.mp4",
      durationSeconds: 60,
    };
    const result = videoAssetInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires storagePath", () => {
    expect(() => videoAssetInputSchema.parse({})).toThrow();
  });

  it("validates positive integer for duration", () => {
    const input = {
      storagePath: "path",
      durationSeconds: -1,
    };
    expect(() => videoAssetInputSchema.parse(input)).toThrow();
  });
});
