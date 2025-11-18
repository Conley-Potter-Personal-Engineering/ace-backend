import { vi } from "vitest";

vi.mock("@supabase/supabase-js", () => {
  const queryBuilder = () => {
    const chain: Record<string, unknown> = {
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      returns: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    return chain;
  };

  const supabase = {
    from: vi.fn(() => queryBuilder()),
  };

  return {
    createClient: vi.fn(() => supabase),
  };
});

vi.mock("@langchain/core/runnables", () => ({
  RunnableSequence: {
    from: vi.fn(() => ({ invoke: vi.fn() })),
  },
}));

export {};
