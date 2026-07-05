import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  // Next.js defaults (core-web-vitals + TypeScript)
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Override default ignores
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // Strict rules
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Complexity
      complexity: ["error", 40],
      "max-lines-per-function": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 3],

      // Code quality
      "no-debugger": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error",

      // React
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",

      // Import discipline
      "no-duplicate-imports": "error",
    },
  },

  // Prettier disables conflicting ESLint rules (must be last)
  prettier,
];

export default eslintConfig;
