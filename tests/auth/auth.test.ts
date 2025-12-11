import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import loginHandler from "../../src/api/auth/login";
import signupHandler from "../../src/api/auth/signup";
import {
  type AuthenticatedNextApiRequest,
  withAuth,
} from "../../src/middleware/withAuth";

const { signUpMock, signInWithPasswordMock, getUserMock, mockLogSystemEvent } =
  vi.hoisted(() => ({
    signUpMock: vi.fn(),
    signInWithPasswordMock: vi.fn(),
    getUserMock: vi.fn(),
    mockLogSystemEvent: vi.fn(),
  }));

vi.mock("../../src/db/supabase", () => {
  const getSupabase = vi.fn(() => ({
    auth: {
      signUp: signUpMock,
      signInWithPassword: signInWithPasswordMock,
      getUser: getUserMock,
    },
  }));

  return { getSupabase };
});

vi.mock("../../src/repos/systemEvents", () => {
  const logSystemEvent = mockLogSystemEvent;
  return { logSystemEvent };
});

const runHandler = async (
  handler: NextApiHandler,
  {
    method = "GET",
    body,
    headers = {},
  }: { method?: string; body?: unknown; headers?: Record<string, string> },
) => {
  const req = {
    method,
    body,
    headers,
  } as unknown as NextApiRequest;

  let statusCode = 200;
  let jsonBody: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this;
    },
    setHeader: vi.fn(),
    end(payload?: unknown) {
      jsonBody = payload;
      return this;
    },
  } as unknown as NextApiResponse;

  await handler(req, res);

  return { status: statusCode, body: jsonBody };
};

const signupApiRoute: NextApiHandler = async (req, res) => {
  const result = await signupHandler(req.body);
  res.status(200).json(result);
};

const loginApiRoute: NextApiHandler = async (req, res) => {
  const result = await loginHandler(req.body);
  res.status(200).json(result);
};

const protectedRoute = withAuth((req, res) =>
  res.status(200).json({
    success: true,
    data: { user: (req as AuthenticatedNextApiRequest).user },
  }),
);

beforeEach(() => {
  vi.clearAllMocks();
  signUpMock.mockReset();
  signInWithPasswordMock.mockReset();
  getUserMock.mockReset();
  mockLogSystemEvent.mockReset();
});

describe("Signup endpoint", () => {
  it("returns success envelope and logs signup events", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u1", email: "test@example.com" } },
      error: null,
    });

    const response = await runHandler(signupApiRoute, {
      method: "POST",
      body: { email: "test@example.com", password: "password123" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        user: { id: "u1", email: "test@example.com" },
        message: "Sign-up successful. Please verify your email.",
      },
    });

    expect(mockLogSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "auth.signup.start" }),
    );
    expect(mockLogSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "auth.signup.success" }),
    );
  });
});

describe("Login endpoint", () => {
  it("returns a token and user on success", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: { access_token: "jwt123" },
        user: { id: "u1", email: "test@example.com" },
      },
      error: null,
    });

    const response = await runHandler(loginApiRoute, {
      method: "POST",
      body: { email: "test@example.com", password: "password123" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        token: "jwt123",
        user: { id: "u1", email: "test@example.com" },
      },
    });
  });

  it("returns success false when Supabase returns an error", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error("Invalid credentials"),
    });

    const response = await runHandler(loginApiRoute, {
      method: "POST",
      body: { email: "test@example.com", password: "wrong-password" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: false,
      error: "Invalid credentials",
    });
  });
});

describe("withAuth middleware", () => {
  it("returns 200 and attaches user for a valid token", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "test@example.com" } },
      error: null,
    });

    const response = await runHandler(protectedRoute, {
      method: "GET",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { user: { id: "u1", email: "test@example.com" } },
    });
    expect(getUserMock).toHaveBeenCalledWith("valid-token");
  });

  it("returns 401 when the authorization header is missing", async () => {
    const response = await runHandler(protectedRoute, { method: "GET" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, error: "Unauthorized" });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is invalid", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("invalid"),
    });

    const response = await runHandler(protectedRoute, {
      method: "GET",
      headers: { authorization: "Bearer bad-token" },
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, error: "Unauthorized" });
  });
});
