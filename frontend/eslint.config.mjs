import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    rules: {
      // This rule is written for the Pages Router, where per-page <Head>
      // tags don't apply globally. We use the App Router, where fonts are
      // loaded once in the root layout (src/app/layout.tsx) and therefore
      // already apply to every page - the exact thing this rule wants.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
