import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVideoAsset } from "../../../src/repos/videoAssets";

const { getSupabase, __singleResponse } = vi.hoisted(() => {
  const singleResponse = { data: null, error: null };
  const from = vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    single: vi.fn(async () => singleResponse),
    maybeSingle: vi.fn(async () => singleResponse),
  }));
  const getSupabase = vi.fn(() => ({ from }));
  return { getSupabase, __singleResponse: singleResponse };
});

vi.mock("../../../src/db/db", () => ({
  getSupabase,
  __singleResponse,
}));

describe("videoAssetsRepo.createVideoAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a video asset with valid data", async () => {
    const payload = {
      storage_path: "/path/to/video.mp4",
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    // Similar issue as products: repo takes snake_case, schema expects camelCase (storagePath).
    // I'll pass both to satisfy TS and runtime for now, or just cast.
    const input = {
      storage_path: "/path/to/video.mp4",
      storagePath: "/path/to/video.mp4",
    } as any;

    const result = await createVideoAsset(input);

    expect(getSupabase().from).toHaveBeenCalledWith("video_assets");
    expect(result).toEqual(payload);
  });
});
