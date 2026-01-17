import { createMocks } from "node-mocks-http";
import meRoute from "@/pages/api/auth/me";
import { type NextApiRequest, type NextApiResponse } from "next";
import { vi, describe, it, expect } from "vitest";

// Mock the middleware to immediately call the handler with a mock user
// We are mocking at the import level for the middleware
vi.mock("@/lib/api/middleware/auth", () => ({
  withAuth: (handler: any) => async (req: any, res: any) => {
    // Simulate what withAuth does: attaches user and calls handler
    req.user = {
      id: "test-user-id",
      email: "test@example.com",
      user_metadata: {
        full_name: "Test User",
      },
    };
    return handler(req, res);
  },
}));

describe("GET /api/auth/me", () => {
  it("should return 200 and user data when authenticated", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    await meRoute(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toEqual({
      success: true,
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
        },
      },
    });
  });

  it("should return 405 if method is not GET", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
    });

    await meRoute(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error.message).toContain("Method not allowed");
  });
});
