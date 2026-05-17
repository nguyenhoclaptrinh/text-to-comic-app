/**
 * @file vitest.config.ts
 * @description Vitest configuration for logic and persistence unit tests.
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/studio/**/*.ts"],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
