import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript 相关规则
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      
      // React 相关规则
      'react-hooks/exhaustive-deps': 'warn',
      
      // 一般JavaScript规则
      'prefer-const': 'warn',
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-empty': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-case-declarations': 'warn',
      'no-fallthrough': 'warn',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-redeclare': 'warn',
      'no-undef': 'warn',
      'no-unreachable': 'warn',
      'no-useless-escape': 'warn',
    },
  },
];