module.exports = {
  root: true,
  ignorePatterns: ['**/node_modules/**', 'dist/**'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {},
};
