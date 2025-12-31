import { randomUUID } from "crypto";
import type { Tables } from "../../../src/db/types";

type ScriptOverrides = Partial<Tables<"scripts">> & {
  creative_pattern_id?: string | null;
  trend_reference?: string | null;
};

export const buildScript = (
  overrides: ScriptOverrides = {},
): Tables<"scripts"> =>
  ({
    script_id: randomUUID(),
    product_id: randomUUID(),
    script_text: "Generated script body",
    hook: "Compelling hook",
    creative_pattern_id: randomUUID(),
    trend_reference: randomUUID(),
    creative_variables: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }) as Tables<"scripts">;
