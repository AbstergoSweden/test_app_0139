import { fileURLToPath } from 'node:url';
import path from 'node:path';
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts', 'e2e/**'] },
  js.configs.recommended,
  // Use recommended (non-type-checked) to avoid pre-existing any usage issues
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: globals.browser,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off',
      'no-irregular-whitespace': 'warn',
    },
  },
);
