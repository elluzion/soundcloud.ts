import { default as pluginJs } from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    files: ["src/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
);
