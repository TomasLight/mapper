import prettier from 'eslint-plugin-prettier';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';

// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['build/*']
  },
  {
    files: ['**/*.{ts}'],
    plugins: {
      prettier, // Disables ESLint rules that would conflict with prettier
      prettierPluginRecommended // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    },
    rules: {
      'max-len': [
        'warn',
        {
          code: 80,
          comments: 120,
          ignoreComments: true,
          ignoreStrings: true, // ignores lines that contain a double-quoted or single-quoted string
          ignoreTemplateLiterals: true, // ignores lines that contain a template literal
          ignoreRegExpLiterals: true, // ignores lines that contain a RegExp literal
          tabWidth: 2
        }
      ],
      quotes: [1, 'single', 'avoid-escape'],
      'spaced-comment': ['error', 'always']
    }
  }
);
