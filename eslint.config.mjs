import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // DB migration files and seed scripts — not app source.
    "drizzle/**",
    "docs/**",
    "docker/**",
  ]),
  {
    // eslint-plugin-react@7.x uses a legacy ESLint API (getFilename) when
    // react.version is set to 'detect', which crashes on ESLint v10.
    // Pinning the version bypasses the broken detection code path.
    settings: {
      react: { version: "19" },
    },
    rules: {
      // False positive for Next.js Server Components and async components.
      "react/display-name": "off",
      // Pragmatic: legacy code has many `any`s; opt out rather than churn.
      "@typescript-eslint/no-explicit-any": "off",
      // Pragmatic: legacy code has many unused vars (often _-prefixed already); opt out rather than churn.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
