const { src, dest, series, parallel } = require('gulp');
const $ = require('gulp-load-plugins')();

$.sass.compiler = require('node-sass');

const isProd = process.env.NODE_ENV === 'production';

function clean() {
  return src(['.tmp', 'dist'], {read: false})
    .pipe($.clean());
}

function html() {
  return src('app/*.html')
    .pipe($.plumber({
      errorHandler: err => {
        $.notify.onError({
          title: 'Error on html',
          message: err.message
        })(err)
      }
    }))
    .pipe($.debug({ title: 'Build HTML' }))
    .pipe(dest());
}

function styles() {
  return src('app/styles/**/*.scss')
    .pipe($.plumber({
      errorHandler: err => {
        $.notify.onError({
          title: 'Error on scss',
          message: err.message
        })(err)
      }
    }))
    .pipe($.debug({ 
      title: 'Build styles' 
    }))
    .pipe($.if(!isProd, sourcemaps.init()))
    .pipe($.sass(
      $.if(!isProd, {
        outputStyle: 'compressed'
      })
    ).on('error', sass.logError))
    .pipe($.autoprefixer())
    .pipe($.if(!isProd, sourcemaps.write()))
    .pipe(dest('.tmp/scripts'));
}

function scripts() {
  return src('app/scripts/**/*.js')
    .pipe($.plumber({
      errorHandler: err => {
        $.notify.onError({
          title: 'Error on js',
          message: err.message
        })(err)
      }
    }))
    .pipe($.debug({ 
      title: 'Build js' 
    }))
    .pipe($.if(!isProd, sourcemaps.init()))
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.if(!isProd, uglify()))
    .pipe($.if(!isProd, sourcemaps.write()))
    .pipe(dest('.tmp/scripts'));
}

function fonts() {
  return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe($.if(!isProd, dest('.tmp/fonts'), dest('dist/fonts')));
}

function images() {
  return src('app/images/**/*.{png,jpg}', { since: lastRun(images) })
    .pipe($.if(!isProd, dest('.tmp/images'), dest('dist/images')));
}

const build = series(clean, fonts, images, parallel(styles, scripts), html);

exports.build = build;
exports.default = build;

// Js lint
// Css lint
// HTML w3c valigator