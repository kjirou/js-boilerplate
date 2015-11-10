var autoprefixer = require('autoprefixer');
var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var gulpPostcss = require('gulp-postcss');
var licensify = require('licensify');
var notifier = require('node-notifier');
var path = require('path');
var postcssCustomProperties = require('postcss-custom-properties');
var postcssNested = require('postcss-nested');
var postcssSassyMixins = require('postcss-sassy-mixins');
var postcssScss = require('postcss-scss');
var vinylSourceStream  = require('vinyl-source-stream');
var watchify = require('watchify');

var browserSync = require('browser-sync').create();


//
// Refs)
// https://github.com/Browsersync/recipes/tree/master/recipes/gulp.browserify
// https://gist.github.com/Fishrock123/8ea81dad3197c2f84366
//

var ROOT = __dirname;
var SRC_ROOT = path.join(ROOT, 'src');
var PUBLIC_ROOT = path.join(ROOT, 'public');
var PUBLIC_DIST_ROOT = path.join(PUBLIC_ROOT, 'dist');
var JS_INDEX_FILE_PATH = path.join(SRC_ROOT, 'index.js');
var CSS_INDEX_FILE_PATH = path.join(SRC_ROOT, 'styles/index.scss');
var IMAGES_FILE_PATH = path.join(SRC_ROOT, '**/*.{gif,jpg,png}');
var STYLES_FILE_PATH = path.join(SRC_ROOT, '**/*.scss');


function onErrorToWarn(err) {
  console.error(err.stack);
  notifier.notify({
    message: err.message,
    title: 'Gulp Error'
  });
  this.emit('end');
}


//
// JavaScripts
//

function createBundler(options) {
  options = options || {};
  var transformer = options.transformer || null;
  var isWatchfied = Boolean(options.isWatchfied);

  var browserifyOptions = {};
  if (isWatchfied) {
    Object.keys(watchify.args).forEach(function(key) {
      browserifyOptions[key] = watchify.args[key];
    });
  }
  // Pass options to browserify by whitelist
  [
    'debug'
  ].forEach(function(key) {
    browserifyOptions[key] = options[key];
  });

  var bundler = browserify(JS_INDEX_FILE_PATH, browserifyOptions);

  if (transformer) {
    bundler.transform(transformer);
  }

  if (isWatchfied) {
    bundler = watchify(bundler);
  }

  return bundler;
}

function createTransformer() {
  return babelify.configure({
    // Configure babel options here
    // Ref) http://babeljs.io/docs/usage/options/
  });
}

function bundle(bundler, options) {
  options = options || {};
  var onError = options.onError || function onError(err) { throw err; };

  return bundler
    .bundle()
    .on('error', onError)
    .pipe(vinylSourceStream('app.js'))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
}

gulp.task('build:js', function() {
  var bundler = createBundler({
    transformer: createTransformer(),
    debug: true  // Enable source map
    //extensions: ['js', 'jsx']
  });
  return bundle(bundler);
});

gulp.task('watch:js', function() {
  var bundler = createBundler({
    transformer: createTransformer(),
    isWatchfied: true,
    debug: true
  });
  bundle(bundler);

  bundler.on('update', function onUpdate() {
    console.log('Build JavaScripts at ' + (new Date()).toTimeString());
    var bundling = bundle(bundler,{
      onError: onErrorToWarn
    });
    bundling.pipe(browserSync.stream({ once: true }));
  });
});


//
// Stylesheets & Other Asserts
//

function createCssBundler(options) {
  options = options || {};
  var onError = options.onError || function onError(err) { throw err; };

  return gulp.src(CSS_INDEX_FILE_PATH)
    .pipe(gulpPostcss([
      postcssCustomProperties(),
      // Output "Container#eachAtRule is deprecated. Use Container#walkAtRules instead." now
      postcssSassyMixins(),
      postcssNested(),
      autoprefixer()
    ], {
      syntax: postcssScss
    }))
    .on('error', onError)
    .pipe(gulpRename('app.css'))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
};

gulp.task('build:css', function() {
  return createCssBundler();
});

gulp.task('build:images', function() {
  return gulp.src(IMAGES_FILE_PATH)
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
});

gulp.task('watch:assets', function() {

  // css
  gulp.watch([STYLES_FILE_PATH], function() {
    return createCssBundler({ onError: onErrorToWarn })
      .pipe(browserSync.stream({ once: true }))
      .on('data', function() {
        console.log('Build stylesheets at ' + new Date().toTimeString());
      })
    ;
  });

  // images
  gulp.watch([IMAGES_FILE_PATH], function() {
    return gulp.src(IMAGES_FILE_PATH)
      .on('error', onErrorToWarn)
      .pipe(gulp.dest(PUBLIC_DIST_ROOT))
      .on('data', function() {
        console.log('Build images at ' + new Date().toTimeString());
      })
    ;
  });
});


//
// Others
//

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: PUBLIC_ROOT
    },
    notify: false
  });
});

gulp.task('build', ['build:images', 'build:css', 'build:js']);
gulp.task('develop', ['watch:assets', 'watch:js', 'serve']);
