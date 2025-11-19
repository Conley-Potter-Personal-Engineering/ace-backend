import { beforeEach, describe, expect, it, vi } from "vitest";
import { logSystemEvent } from "../../../src/repos/systemEvents";

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

describe("systemEventsRepo.logSystemEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs a system event with valid data", async () => {
    const payload = {
      event_type: "TEST_EVENT",
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    // Schema expects camelCase, repo takes snake_case.
    const input = {
      event_type: "TEST_EVENT",
      eventType: "TEST_EVENT",
    } as any;

    const result = await logSystemEvent(input);

    expect(getSupabase().from).toHaveBeenCalledWith("system_events");
    expect(result).toEqual(payload);
  });
});
