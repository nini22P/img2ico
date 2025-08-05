import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    'rules': {
      'quotes': [
        'error',
        'single',
      ],
      'semi': [
        'error',
        'never',
      ]
    }
  },
  {
    ignores: [
      'node_modules/',
      '**/dist/*',
    ],
  },
  tseslint.configs.recommended,
])
