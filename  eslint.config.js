

module.exports = {
    env: {
      node: true, // Set to Node.js environment
      es2021: true, // Use ES2021 standards
    },
    extends: [
      'eslint:recommended', // Basic recommended rules
      'prettier', // Integrate Prettier for formatting
    ],
    parser: '@babel/eslint-parser', // Use Babel parser
    parserOptions: {
      ecmaVersion: 2021, // Ensure compatibility with ES2021
      sourceType: 'module', // Support ES module syntax
      requireConfigFile: false, // Prevent the need for a Babel config file in Functions
    },
    rules: {
      'no-unused-vars': 'warn', // Warn for unused variables
      'no-console': 'off', // Allow console logs
    },
  };