const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
require('whatwg-fetch')
require ('nodep-date-input-polyfill');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: ['whatwg-fetch','nodep-date-input-polyfill', './app.js'],
  output: {
    path: path.join(__dirname, '../../public/js/'),
    publicPath: "/js/",
    filename: 'bundle.min.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({ loader: 'css-loader!sass-loader' })
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: isProduction
      }
    }),
    new ExtractTextPlugin('../css/master.min.css')
  ]
}
