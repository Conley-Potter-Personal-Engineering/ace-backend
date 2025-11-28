import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    envFile: ["./config/.env.test", "./config/.env.local"],
    testTimeout: 30000,
  },
});
