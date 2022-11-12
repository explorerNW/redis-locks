// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const nodeExternals = require('webpack-node-externals');

const isProduction = process.env.NODE_ENV == "production";
const resolve = (relativePath) => path.resolve(__dirname, relativePath);

const config = {
  entry: "./src/test.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  target: "node",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: [
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              plugins: ["@loadable/babel-plugin"],
            },
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
          // {
          //   loader: "eslint-loader"
          // }
        ],
        include: [resolve("./src")],
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".jsx", ".json"]
  },
  externals: [
    nodeExternals({
      allowlist: ["webpack/hot/poll?100"],
    }),
  ],
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
