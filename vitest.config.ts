import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    include: [
      "__tests__/**/*.test.{ts,tsx}",
      "lib/actions/**/*.test.{ts,tsx}",
      "tests/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
