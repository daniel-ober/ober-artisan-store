module.exports = {
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
  ],
  plugins: ['node'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};
