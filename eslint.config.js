import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import hono from "eslint-plugin-hono";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...hono.configs.recommended,

  // Disable conflicting ESLint formatting rules
  prettierConfig,

  {
    plugins: {
      hono,
      prettier: prettierPlugin,
    },
    rules: {
      // 👇 THIS is what actually runs Prettier
      "prettier/prettier": "error",
    },
  },

  {
    files: ["**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: globals.node,
    },
  },
];