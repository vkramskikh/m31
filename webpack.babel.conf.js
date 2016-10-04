import path from 'path';

export default {
  entry: [
    'whatwg-fetch',
    './ui/app.js'
  ],
  output: {
    path: path.join(__dirname, '/build/'),
    publicPath: '/',
    filename: 'bundle.js',
    chunkFilename: null,
    sourceMapFilename: 'bundle.js.map'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {cacheDirectory: true}
      },
      {test: /\.css$/, loader: 'style!css'},
      {test: /\.less$/, loader: 'style!css!less'},
      {test: /\.(gif|png|jpg)$/, loader: 'file'},
      {test: /\.(woff|woff2|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/, loader: 'file'}
    ]
  },
  plugins: [],
  devtool: 'cheap-module-source-map',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  }
};
