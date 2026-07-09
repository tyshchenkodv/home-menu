import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import reactDom from 'eslint-plugin-react-dom';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactX from 'eslint-plugin-react-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.agents', '.claude', '.idea', 'design'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,
      'import-x/no-default-export': 'error',
      // The plugin's stylistic group-ordering opinions fight this repo's
      // path-relative feature imports without adding value; scope-direction
      // is reviewed by the frontend-architecture skill instead.
      'import-x/order': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      // This suite's throw-assertion helpers (`expectCode`) and the Firestore
      // rules matrix's `assertSucceeds`/`assertFails` helpers already contain
      // the `expect` calls the rule looks for one level up the call stack.
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectCode', 'assertSucceeds', 'assertFails'] },
      ],
    },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'vitest.rules.config.ts', 'eslint.config.js'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  // Keep last: turns off ESLint stylistic rules that fight Prettier and runs
  // Prettier as a lint rule, so `eslint` reports formatting and `eslint --fix`
  // fixes it together with other lint issues.
  prettierRecommended,
);
