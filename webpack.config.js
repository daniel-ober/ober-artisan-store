// webpack.config.js
const webpack = require("webpack");

module.exports = {
  // If you already have entry/output/module/etc in your real config,
  // keep them — this file is meant to be merged into your existing setup.

  resolve: {
    // If you already have extensions/alias, keep them too.
    fallback: {
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      url: require.resolve("url/"),
      querystring: require.resolve("querystring-es3"),
      zlib: require.resolve("browserify-zlib"),
      fs: false,
    },
  },

  plugins: [
    // If you already have plugins, keep them and add these.
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};