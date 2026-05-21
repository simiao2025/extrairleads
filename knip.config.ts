import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/page.{ts,tsx}",
    "src/app/**/layout.{ts,tsx}",
    "src/app/**/route.{ts,tsx}",
    "src/app/actions.ts",
    "src/actions/**/*.ts",
    "src/middleware.ts",
  ],
  project: ["src/**/*.{ts,tsx}"],
  ignore: [
    "**/*.test.*",
    "**/*.spec.*",
    "src/generated/**",
    ".next/**",
  ],
  ignoreDependencies: [
    "@types/*",
    "tailwindcss",
    "@tailwindcss/postcss",
    "tw-animate-css",
    "tailwindcss-animate",
    "eslint-config-next",
    "@vitejs/plugin-react",
    "jsdom",
    "dotenv",
  ],
  next: {
    entry: [
      "src/app/**/page.{ts,tsx}",
      "src/app/**/layout.{ts,tsx}",
      "src/app/**/route.{ts,tsx}",
      "src/middleware.ts",
      "next.config.{js,ts,mjs}",
    ],
  },
};

export default config;
