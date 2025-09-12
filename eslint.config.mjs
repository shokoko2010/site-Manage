import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "next/typescript"
    ],
    rules: {
      // TypeScript 相关规则
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",
      
      // React 相关规则
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "off",
      "react/prop-types": "off",
      
      // Next.js 相关规则
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      
      // 一般JavaScript规则
      "prefer-const": "warn",  // 降低为警告而不是关闭
      "no-unused-vars": "warn",
      "no-console": "warn",
      "no-debugger": "warn",
      "no-empty": "warn",
      "no-irregular-whitespace": "warn",
      "no-case-declarations": "warn",
      "no-fallthrough": "warn",
      "no-mixed-spaces-and-tabs": "warn",
      "no-redeclare": "warn",
      "no-undef": "warn",
      "no-unreachable": "warn",
      "no-useless-escape": "warn",
    },
  }),
];

export default eslintConfig;
