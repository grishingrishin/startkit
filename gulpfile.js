const { src, dest, series, parallel, lastRun } = require('gulp');
const $ = require('gulp-load-plugins')();

$.sass.compiler = require('node-sass');

const isProd = process.env.NODE_ENV === 'production';

function clean() {
  return src(['.tmp', 'dist'], {read: false})
    .pipe($.clean());
}

function html() {
  return src('app/pages/*.pug')
    .pipe($.plumber({
      errorHandler: err => {
        $.notify.onError({
          title: 'Error on pug',
          message: err.message
        })(err)
      }
    }))
    .pipe($.pugLint())
    .pipe($.pug({
      pretty: true
    }))
    .pipe($.w3cHtmlValidator())
    // .pipe($.w3cHtmlValidator.reporter())
    .pipe(dest('.tmp'));
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
    .pipe($.stylelint({
      reporters: [
        {
          formatter: 'string', 
          console: true
        }
      ]
    }))
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.sass(
      $.if(!isProd, {
        outputStyle: 'compressed'
      })
    ).on('error', $.sass.logError))
    .pipe($.autoprefixer())
    .pipe($.shorthand())
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe($.if(isProd, $.rename({ suffix: '.min' })))
    .pipe(dest('.tmp/styles'));
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
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError())
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.if(!isProd, $.uglify()))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe($.if(isProd, $.rename({ suffix: '.min' })))
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

const build = series(fonts, images, parallel(styles, scripts), html);

exports.build = build;
exports.default = build;

//TODO: Проверка на валидацию перед финальной сборкой или пушингом HTML, CSS, JS