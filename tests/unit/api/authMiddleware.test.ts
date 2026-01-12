import { beforeEach, describe, expect, it, vi } from "vitest";
import { withAuth } from "@/lib/api/middleware/auth";

const getUserMock = vi.fn();

vi.mock("@/db/supabase", () => ({
  getSupabase: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

const buildRes = () => {
  let statusCode = 200;
  let body: any;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      body = payload;
      return this;
    },
    getStatus: () => statusCode,
    getBody: () => body,
  };
};

describe("withAuth", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it("returns UNAUTHORIZED when missing token", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const res = buildRes();
    await wrapped({ headers: {} }, res as any);

    expect(res.getStatus()).toBe(401);
    expect(res.getBody()).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("allows request when token is valid", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);

    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const res = buildRes();
    await wrapped({ headers: { authorization: "Bearer token" } }, res as any);

    expect(handler).toHaveBeenCalled();
  });
});
