import { randomUUID } from "crypto";
import type { Tables } from "../../../src/db/types";

export const buildScript = (
  overrides: Partial<Tables<"scripts">> = {},
): Tables<"scripts"> => ({
  script_id: randomUUID(),
  product_id: randomUUID(),
  script_text: "Generated script body",
  hook: "Compelling hook",
  creative_pattern_id: randomUUID(),
  trend_reference: randomUUID(),
  creative_variables: null,
  created_at: new Date().toISOString(),
  ...overrides,
});
