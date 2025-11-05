const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '.'),
    library: {
      name: 'gsmSimaerepViz',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  devtool: 'source-map',
  externals: {
    'chart.js': {
      commonjs: 'chart.js',
      commonjs2: 'chart.js',
      amd: 'chart.js',
      root: 'Chart',
    },
  },
};

