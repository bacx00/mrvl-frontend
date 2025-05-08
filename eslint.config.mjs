import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // extend Next.js defaults
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // custom rule overrides
  {
    rules: {
      // allow work-in-progress any’s
      "@typescript-eslint/no-explicit-any": "off",

      // warn (not error) on unused vars; ignore names starting with _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // allow plain <img> tags
      "@next/next/no-img-element": "off",

      // disable page-custom-font warning
      "@next/next/no-page-custom-font": "off"
    }
  }
];

export default eslintConfig;
