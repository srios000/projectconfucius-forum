import "@testing-library/jest-dom/vitest";

// Vitest does not auto-load `.env` (Next.js does). Load it here so any test
// that touches env-dependent modules sees the same vars as the app. Use
// Node's built-in loader rather than `import { loadEnv } from "vite"` (which
// breaks `tsc`). Guarded: `loadEnvFile` exists on Node 20.12+, and a missing
// `.env` simply throws and is ignored.
try {
  process.loadEnvFile?.();
} catch {
  // no .env present — fine, tests that need env mock it explicitly
}
