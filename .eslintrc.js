// .eslintrc.js
module.exports = {
  root: true,
  // CRA already includes react-hooks rules + correct plugin versions.
  // Do NOT extend "prettier" here unless you also install eslint-config-prettier.
  extends: ["react-app", "react-app/jest"],
  rules: {
    // Keep CRA defaults. Add targeted rules here if you want later.
  },
};