import minimist from 'minimist';
import webpack from 'webpack';
import webpackConfig from './webpack.babel.conf';
import WebpackDevServer from 'webpack-dev-server';

import dataHander from './data_handler';

let argv = minimist(process.argv.slice(2));

let dataDir = argv['data-dir'];
if (!dataDir) throw new Error('Data directory must be specified');

let serverHost = argv.host || '127.0.0.1';
let serverPort = argv.port || 8888;
let serverUrl = `http://${serverHost}:${serverPort}/`;

webpackConfig.entry.push('webpack-dev-server/client?' + serverUrl);
webpackConfig.entry.push('webpack/hot/dev-server');
webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
webpackConfig.plugins.push(new webpack.NoErrorsPlugin());

let devServerConfig = {
  contentBase: 'ui',
  hot: true,
  stats: {
    colors: true,
    hash: false,
    version: false,
    assets: false,
    chunks: false
  },
  setup: (app) => {
    app.get('/data', dataHander(dataDir));
  }
};

new WebpackDevServer(webpack(webpackConfig), devServerConfig).listen(
  serverPort, serverHost,
  (err) => {
    if (err) throw err;
    process.stdout.write(`Server started at ${serverUrl}\n`);
  }
);
