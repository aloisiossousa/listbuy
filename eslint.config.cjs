const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['dist', 'node_modules', 'eslint.config.cjs'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.es2021 },
    },
    rules: {},
  },
];


