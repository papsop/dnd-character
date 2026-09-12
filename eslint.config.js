import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'scripts/.cache'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  {
    // The rules engine must stay pure and fully typed.
    files: ['src/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // The single boundary where untyped source JSON enters. `any` is the honest type for it;
    // every mapper narrows it immediately, and the schema validates the result.
    files: ['scripts/lib/raw.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
