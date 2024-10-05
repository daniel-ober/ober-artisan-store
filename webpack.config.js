const webpack = require('webpack');

module.exports = {
    // other configuration...
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("stream-http"),
            "os": require.resolve("os-browserify/browser"),
            "url": require.resolve("url"),
            "querystring": require.resolve("querystring-es3"),
            "zlib": require.resolve("browserify-zlib"),
            "fs": false // You can set this to false if you don't need 'fs'
        }
    }
};
