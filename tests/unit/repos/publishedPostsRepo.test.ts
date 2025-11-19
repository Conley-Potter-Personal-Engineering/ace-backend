import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPublishedPost } from "../../../src/repos/publishedPosts";

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

describe("publishedPostsRepo.createPublishedPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a published post with valid data", async () => {
    const payload = {
      platform: "TikTok",
      caption: "Caption",
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    const result = await createPublishedPost(payload);

    expect(getSupabase().from).toHaveBeenCalledWith("published_posts");
    expect(result).toEqual(payload);
  });
});
