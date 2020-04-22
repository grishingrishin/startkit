/* eslint-disable space-before-function-paren */
/* eslint-disable node/no-unpublished-require */
const { src, dest, watch, series, parallel, lastRun } = require('gulp')
const $ = require('gulp-load-plugins')()
const server = require('browser-sync').create()
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
    .pipe($.pug({
      pretty: true
    }))
    .pipe($.w3cHtmlValidator())
    // .pipe($.w3cHtmlValidator.reporter())
    .pipe($.if(!isProd, dest('.tmp'), dest('dist')))
    .pipe(server.reload({ stream: true }))
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
      $.if(isProd, {
        outputStyle: 'compressed'
      }
      )).on('error', $.sass.logError))
    .pipe($.autoprefixer())
    .pipe($.shorthand())
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe($.if(isProd, $.rename({ suffix: '.min' })))
    .pipe($.if(!isProd, dest('.tmp/styles'), dest('dist/styles')))
    .pipe(server.reload({ stream: true }))
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
    .pipe($.concat('main.js'))
    .pipe($.if(isProd, $.rename({ suffix: '.min' })))
    .pipe($.if(!isProd, dest('.tmp/scripts'), dest('dist/scripts')))
    .pipe(server.reload({ stream: true }))
}

function fonts() {
  return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe($.if(!isProd, dest('.tmp/fonts'), dest('dist/fonts')))
}

function images() {
  return src('app/images/**/*.{png,jpg}', { since: lastRun(images) })
    .pipe($.if(!isProd, dest('.tmp/images'), dest('dist/images')))
}

const startAppServer = () => {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })

  watch([
    'app/images/**/*',
    'app/fonts/**/*'
  ]).on('change', server.reload)

  watch('app/pages/**/*.pug')
  watch('app/styles/**/*.scss', styles)
  watch('app/scripts/**/*.js', scripts)
}

const startDistServer = () => {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: 'dist',
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const build = series(clean, fonts, images, parallel(styles, scripts, html))

exports.build = build

exports.server = isProd ? series(build, startDistServer) : series(build, startAppServer)

exports.default = build

// TODO: Проверка на валидацию перед финальной сборкой или пушингом HTML, CSS, JS
