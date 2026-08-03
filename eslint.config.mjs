import { readFileSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// DOSI > Single Source. tsconfig decides which files the type system owns;
// ESLint derives its scope from that rather than keeping a second list that
// can drift. Files tsconfig excludes are never type-checked, so type-strictness
// rules there report on code no compiler is validating anyway.
const tsconfig = JSON.parse(
  readFileSync(new URL("./tsconfig.json", import.meta.url), "utf8")
);

const UNTYPED_GLOBS = tsconfig.exclude
  .filter((p) => p !== "node_modules")
  .map((p) => `${p}/**/*.{ts,tsx}`);

// DOSI > Single Source. Text color comes from the semantic tokens in the
// @theme block of src/app/globals.css, never from the raw Tailwind palette.
// Brand colors that carry meaning (IG purple, FB blue) are a legitimate
// exception — disable the rule inline with a comment saying which brand.
const RAW_TEXT_PALETTE =
  /(?:^|\s)text-(?:slate|gray|zinc|neutral|stone)-\d{2,3}(?:\s|$)/;

// `--color-muted` is a *surface* token (#1a1a1a). Tailwind v4 emits
// `text-muted` from it, which is near-invisible on the dark background.
// `text-muted-foreground` is the one you want.
const MUTED_AS_TEXT = /(?:^|\s)text-muted(?![-\w])/;

const dosiColorRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: `Literal[value=${RAW_TEXT_PALETTE}]`,
      message:
        "Raw palette text color. Use a semantic token (text-foreground, text-muted-foreground, text-heading, text-primary). See DOSI > Single Source in CLAUDE.md.",
    },
    {
      selector: `TemplateElement[value.raw=${RAW_TEXT_PALETTE}]`,
      message:
        "Raw palette text color. Use a semantic token (text-foreground, text-muted-foreground, text-heading, text-primary). See DOSI > Single Source in CLAUDE.md.",
    },
    {
      selector: `Literal[value=${MUTED_AS_TEXT}]`,
      message:
        "`text-muted` resolves to the #1a1a1a surface token and is near-invisible. Use `text-muted-foreground`.",
    },
    {
      selector: `TemplateElement[value.raw=${MUTED_AS_TEXT}]`,
      message:
        "`text-muted` resolves to the #1a1a1a surface token and is near-invisible. Use `text-muted-foreground`.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      ...dosiColorRules,
      // The repo already spells "intentionally unused" with a leading
      // underscore. Teach the linter the convention instead of adding
      // disable comments at every site.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Test scaffolding: tsconfig excludes these, so tsc never checks them.
    // `as any` on a Prisma or NextRequest mock is the point of a mock, not
    // a type someone failed to write. Globs derive from tsconfig.exclude.
    files: UNTYPED_GLOBS,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
]);

export default eslintConfig;
