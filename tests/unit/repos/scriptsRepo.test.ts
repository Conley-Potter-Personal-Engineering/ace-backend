import { beforeEach, describe, expect, it, vi } from "vitest";
import { createScript } from "../../../src/repos/scripts";
import { buildScript } from "../../utils/factories/scriptFactory";

vi.mock("../../../src/db/db", () => {
  const singleResponse = { data: null, error: null };
  const from = vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    single: vi.fn(async () => singleResponse),
  }));

  const getSupabase = vi.fn(() => ({ from }));

  return { getSupabase, __singleResponse: singleResponse };
});

const { getSupabase, __singleResponse } = (await import(
  "../../../src/db/db"
)) as any;

describe("scriptsRepo.createScript", () => {
  beforeEach(() => {
    Object.assign(__singleResponse, { data: null, error: null });
    vi.mocked(getSupabase().from).mockClear();
  });

  it("persists a script and returns the created row", async () => {
    const creativePatternId = "6d2b9f7a-cb5f-4d83-a5f9-1af711a7d1cc";
    const trendReference = "a8153c1b-5d1a-4e12-9d2c-00fa4a54b5f8";
    const script = buildScript({
      script_text: "test script",
      hook: "test hook",
      creative_pattern_id: creativePatternId,
      trend_reference: trendReference,
      created_at: new Date().toISOString(),
    });
    Object.assign(__singleResponse, { data: script });

    const result = await createScript({
      scriptId: script.script_id,
      productId: script.product_id!,
      scriptText: script.script_text,
      hook: script.hook!,
      creativeVariables: {
        emotion: "excited",
        structure: "story",
        style: "direct",
      },
      creativePatternId,
      trendReference,
      createdAt: script.created_at!,
    });

    expect(getSupabase().from).toHaveBeenCalledWith("scripts");
    expect(result).toEqual(script);
  });

  it("throws when Supabase returns an error", async () => {
    Object.assign(__singleResponse, {
      data: null,
      error: { message: "insert failed" },
    });

    await expect(
      createScript({
        scriptId: "341f7c9f-3df1-4b77-a9d1-868cb34e990a",
        productId: "c20c2bc8-f124-4f22-bbf8-1fa44b1f9d05",
        scriptText: "body",
        hook: "hook",
        creativeVariables: {
          emotion: "curious",
          structure: "problem-solution",
          style: "playful",
        },
        creativePatternId: "0d7717d4-5e2d-4f9f-99b0-5c0c3aa8059d",
        trendReference: null,
      }),
    ).rejects.toThrow(/Failed to create script/);
  });
});
