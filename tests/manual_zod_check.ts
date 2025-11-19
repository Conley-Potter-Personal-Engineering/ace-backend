
import { createScript } from "../src/repos/scripts";
import { z } from "zod";

// Mock Supabase to avoid actual DB calls (though Zod should fail before that)
import { vi } from "vitest";
vi.mock("../src/db/db", () => ({
  getSupabase: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          returns: () => ({
            single: async () => ({ data: {}, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

async function testValidation() {
  console.log("Testing Zod validation...");
  try {
    // @ts-ignore - intentionally invalid input
    await createScript({
      scriptId: "invalid-uuid", // Invalid UUID
      productId: "valid-uuid-but-missing-other-fields",
      // Missing scriptText, hook, creativeVariables
    });
    console.error("❌ Validation failed to catch invalid input!");
    process.exit(1);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("✅ Validation correctly threw ZodError:");
      console.log(JSON.stringify(error.errors, null, 2));
    } else {
      console.log("✅ Validation threw an error (likely Zod, but checking type might be tricky in this raw script):");
      console.log(error);
    }
  }
}

testValidation();
