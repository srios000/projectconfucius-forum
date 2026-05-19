import { existsSync } from "node:fs";
import path from "node:path";
import "@testing-library/jest-dom/vitest";

// vitest does not auto-load .env files the way `next` does. Load them here so
// modules that read process.env at import time (e.g. lib/db) work under test.
// Runs in the worker before test modules are imported. .env.local overrides .env.
for (const file of [".env", ".env.local"]) {
    const filePath = path.resolve(process.cwd(), file);
    if (existsSync(filePath)) {
        process.loadEnvFile(filePath);
    }
}