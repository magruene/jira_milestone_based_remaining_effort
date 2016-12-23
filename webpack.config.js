const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: path.join(__dirname),
    entry: {
        app: [
            './src/index'
        ]
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        sourceMapFilename: 'bundle.js.map'
    },
    module: {
        loaders: [
            {test: /\.json$/, loader: 'json'},
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader'
            }
        ],
        rules: [
            {
                test: /\.js$/,
                use: [{
                    loader: "babel-loader",
                    options: {presets: ["es2015"]}
                }]
            }]
    },
    resolve: {
        moduleDirectories: [path.join(__dirname, '/src'), path.join(__dirname, '/node_modules')],
        descriptionFiles: ['package.json']
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: true
            },
            output: {
                comments: false
            },
            sourceMap: true
        })
    ],
    devtool: 'source-map',
    node: {
        fs: "empty",
        net: 'empty',
        tls: 'empty'
    }
};