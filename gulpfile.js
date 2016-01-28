var autoprefixer = require('autoprefixer');
var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpImageDataURI = require('gulp-image-data-uri');
var gulpPostcss = require('gulp-postcss');
var gulpRename = require('gulp-rename');
var gulpShell = require('gulp-shell');
var licensify = require('licensify');
var notifier = require('node-notifier');
var path = require('path');
var postcssCustomProperties = require('postcss-custom-properties');
var postcssImport = require('postcss-import');
var postcssNested = require('postcss-nested');
var postcssScss = require('postcss-scss');
var runSequence = require('run-sequence');
var vinylSourceStream  = require('vinyl-source-stream');
var watchify = require('watchify');

var browserSync = require('browser-sync').create();


var ROOT = __dirname;
var SRC_ROOT = path.join(ROOT, 'src');
var PUBLIC_ROOT = path.join(ROOT, 'public');
var PUBLIC_DIST_ROOT = path.join(PUBLIC_ROOT, 'dist');
var JS_INDEX_FILE_PATH = path.join(SRC_ROOT, 'index.js');
var CSS_INDEX_FILE_PATH = path.join(SRC_ROOT, 'styles/index.scss');
var IMAGES_FILE_PATH = path.join(SRC_ROOT, '**/*.{gif,jpg,png}');
var STYLES_FILE_PATH = path.join(SRC_ROOT, '**/*.scss');


function onErrorToWarn(err) {
  console.error(err.stack || err.message);
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
    presets: [
      'es2015',
      'react'
    ]
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
      postcssImport(),
      postcssCustomProperties(),
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

gulp.task('build:data-uri-images', function() {
  return gulp.src(path.join(PUBLIC_DIST_ROOT, 'images/**/*.png'))
    .pipe(gulpImageDataURI({
      template: {
        file: path.join(ROOT, 'gulp-image-data-uri-template.css')
      }
    }))
    .pipe(gulpConcat('data-uri-images.css'))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
});

gulp.task('build:assets', function() {
  runSequence(['build:css', 'build:images'], 'build:data-uri-images');
});

gulp.task('build:any-shell-scripts', gulpShell.task([
  'sh ./scripts/run-heavy-build-task.sh',
  // Can return error as gulp's result
  //'sh ./scripts/run-failed-task.sh'
]));

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
  // Note: This task is almost useless, because gulp can not observe new files
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

gulp.task('build', ['build:js', 'build:assets', 'build:any-shell-scripts']);
gulp.task('develop', function() {
  runSequence('build', ['watch:js', 'watch:assets'], 'serve');
});
