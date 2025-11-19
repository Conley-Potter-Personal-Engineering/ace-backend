import { beforeEach, describe, expect, it, vi } from "vitest";
import { createExperiment } from "../../../src/repos/experiments";

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

describe("experimentsRepo.createExperiment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an experiment with valid data", async () => {
    const payload = {
      hypothesis: "Test hypothesis",
      variation_label: "A",
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    const result = await createExperiment(payload);

    expect(getSupabase().from).toHaveBeenCalledWith("experiments");
    expect(result).toEqual(payload);
  });

  it("throws error on failure", async () => {
    Object.assign(__singleResponse, { data: null, error: { message: "Error" } });
    await expect(createExperiment({})).rejects.toThrow("Failed to create experiment");
  });
});
