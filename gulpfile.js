const { src, dest, watch, series, parallel, lastRun } = require('gulp')
const $ = require('gulp-load-plugins')()
const browserSync = require('browser-sync').create()
const del = require('del')

$.sass.compiler = require('node-sass')

const port = process.env.PORT || 9000
const isProd = process.env.NODE_ENV === 'production'

function clean () {
  return del(['.tmp', 'dist'])
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
    .pipe($.pugLinter({ reporter: 'default' }))
    .pipe($.pug({ pretty: true }))
    .pipe($.if(isProd, $.useref({ searchPath: ['.tmp', '.'] })))
    .pipe($.if(isProd, dest('dist'), dest('.tmp')))
    .pipe(browserSync.reload({ stream: true }))
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
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.sass($.if(isProd, { outputStyle: 'compressed' }))
      .on('error', $.sass.logError))
    .pipe($.autoprefixer())
    .pipe($.shorthand())
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe($.if(!isProd, dest('.tmp/styles'), dest('dist/styles')))
    .pipe(browserSync.reload({ stream: true }))
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
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.babel({ presets: ['@babel/env'] }))
    .pipe($.if(!isProd, $.uglify()))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe($.concat('main.js'))
    .pipe($.if(!isProd, dest('.tmp/scripts'), dest('dist/scripts')))
    .pipe(browserSync.reload({ stream: true }))
}

function fonts() {
  return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe($.if(!isProd, dest('.tmp/fonts'), dest('dist/fonts')))
}

function images() {
  return src('app/images/**/*.{png,jpg}', { since: lastRun(images) })
    .pipe($.if(!isProd, dest('.tmp/images'), dest('dist/images')))
}

const server = () => {
  browserSync.init({
    notify: false,
    port,
    server: {
      baseDir: '.tmp',
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })

  watch([
    'app/images/**/*',
    'app/fonts/**/*'
  ]).on('change', browserSync.reload)

  watch('app/pages/**/*.pug', html)
  watch('app/styles/**/*.scss', styles)
  watch('app/scripts/**/*.js', scripts)
}

const build = series(clean, fonts, images, parallel(styles, scripts, html))

exports.build = build

exports.default = series(build, server)