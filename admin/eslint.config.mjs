import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
    {
        files: ["**/*.ts"],
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "double"],
            indent: ["error", 4],
        },
        languageOptions: {
            parser,
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
    },
    globalIgnores([
        "index.js",
    ]),
]);

export default eslintConfig;
