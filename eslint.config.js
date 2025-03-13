module.exports = {
    languageOptions: {
      globals: {
        process: 'readonly', // Allow process variable
        __dirname: 'readonly', // Allow __dirname variable
      },
    },
    extends: [
      'eslint:recommended', // Basic recommended rules
      'prettier', // Integrate Prettier for formatting
    ],
    parser: '@babel/eslint-parser', // Use Babel parser
    parserOptions: {
      ecmaVersion: 2021, // Ensure compatibility with ES2021
      sourceType: 'module', // Support ES module syntax
    },
    rules: {
      'no-unused-vars': 'warn', // Warn for unused variables
      'no-console': 'off', // Allow console logs
    },
  };