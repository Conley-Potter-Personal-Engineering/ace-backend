import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmbedding } from "../../../src/repos/embeddings";

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

describe("embeddingsRepo.createEmbedding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an embedding with valid data", async () => {
    const payload = {
      embedding: "[0.1, 0.2]",
      reference_id: "123e4567-e89b-12d3-a456-426614174000",
      reference_type: "script",
    };
    Object.assign(__singleResponse, { data: payload, error: null });

    // Schema expects camelCase, repo takes snake_case.
    const input = {
      embedding: "[0.1, 0.2]",
      reference_id: "123e4567-e89b-12d3-a456-426614174000",
      referenceId: "123e4567-e89b-12d3-a456-426614174000",
      reference_type: "script",
      referenceType: "script",
    } as any;

    const result = await createEmbedding(input);

    expect(getSupabase().from).toHaveBeenCalledWith("embeddings");
    expect(result).toEqual(payload);
  });
});
