module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'next-env.d.ts'],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-unused-vars': 'warn',
    'no-redeclare': 'warn',
    'no-undef': 'warn',
    'no-extra-semi': 'warn',
    'no-useless-catch': 'warn',
  },
}