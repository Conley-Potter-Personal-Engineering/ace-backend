import { vi } from "vitest";

export const mockSupabase = () => {
  const singleResponse = { data: null, error: null };
  
  const from = vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    single: vi.fn(async () => singleResponse),
    maybeSingle: vi.fn(async () => singleResponse),
  }));

  const getSupabase = vi.fn(() => ({ from }));

  return {
    getSupabase,
    from,
    singleResponse,
  };
};
