import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Regras novas do eslint-plugin-react-hooks@7, rebaixadas para warn.
      //
      // O codigo usa `ref.current` durante o render de forma consciente:
      // chessRef guarda um objeto Chess mutavel, e ler `.turn()`,
      // `.isGameOver()` etc. no render nao dispara re-render (o estado
      // derivado so muda quando chamamos setFen/setHistory apos um lance).
      // Satisfazer essas regras exigiria refatoracao grande dos hooks
      // (derivar tudo de useState) sem ganho funcional real.
      //
      // Ficam como warning para visibilidade — nao falham CI.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
