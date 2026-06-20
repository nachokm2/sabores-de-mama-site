import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * ESLint 9 (flat config). Enfocado en errores reales (hooks, vars sin usar),
 * sin reglas de estilo ruidosas (de eso se encarga el formateo del editor).
 */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'backend/node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  // ── Frontend (navegador + JSX) ──
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    settings: { react: { version: 'detect' } },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // JSX transform de React 17+
      'react/prop-types': 'off', // no se usan prop-types
      'react/no-unescaped-entities': 'off', // textos en español con comillas/acentos
      // Pista de HMR de Vite (DX), no de correctness: el proyecto co-ubica helpers.
      'react-refresh/only-export-components': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },

  // ── Tests del frontend (Vitest + jsdom) ──
  {
    files: ['src/**/*.{test,spec}.{js,jsx}', 'src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },

  // ── Node (backend, archivos de configuración) ──
  {
    files: ['backend/**/*.js', '*.config.js', '*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ── E2E (Playwright corre en Node, pero page.evaluate usa APIs del navegador) ──
  {
    files: ['e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]
