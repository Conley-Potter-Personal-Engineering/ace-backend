import { describe, expect, it } from "vitest";
import { VideoAssetInputSchema } from "../../../src/schemas/videosSchema";

describe("VideoAssetInputSchema", () => {
  it("parses valid input", () => {
    const input = {
      storagePath: "/path/to/video.mp4",
      durationSeconds: 60,
    };
    const result = VideoAssetInputSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("requires storagePath", () => {
    expect(() => VideoAssetInputSchema.parse({})).toThrow();
  });

  it("validates positive integer for duration", () => {
    const input = {
      storagePath: "path",
      durationSeconds: -1,
    };
    expect(() => VideoAssetInputSchema.parse(input)).toThrow();
  });
});
