'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

gulp.task('build', (callback) => {
    let config = require('./webpack.config.js');
    webpack(config, (err, stats) => {
        if (err) throw new gutil.PluginError("webpack", err);
        stats.toString(config.devServer.stats).split('\n').map((line) => {
            gutil.log(gutil.colors.blue("[webpack]"), line);
        });
        callback();
    });
});
