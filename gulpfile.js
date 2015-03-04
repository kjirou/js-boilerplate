var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var vinylTransform  = require('vinyl-transform');
var vinylSourceStream  = require('vinyl-source-stream');


var JS_REQUIREMENTS = [
  'backbone',
  'react'
];

var WATCHED_ES6_SOURCES = [
  './es6/**/*.es6'
];

//var bundleES6 = function bundleES6() {
//  return transform(function(fileName) {
//    return browserify(fileName, {
//        debug: true
//      })
//      .transform(babelify)
//      .require()
//      .bundle()
//      .on('error', function(err){
//        console.error(err.message);
//        this.emit('end');
//      })
//    ;
//  });
//}

gulp.task('build-js-simple', function() {
  return browserify('./js/use-requirements.js', {
      debug: true
    })
    .bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('build-js-requirements', function() {
  return browserify({
      debug: true
    })
    .require(JS_REQUIREMENTS)
    .bundle()
    .pipe(vinylSourceStream('requirements.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('build-js-app', function() {
  return browserify('./js/index.js', {
      debug: true
    })
    .external(JS_REQUIREMENTS)
    .bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('build-es6-simple', function() {
  return browserify('./es6/index.es6', {
      debug: true,
      extensions: ['.es6']
    })
    .transform(babelify)
    .bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('build-es6-app', function() {
  return browserify('./es6/index.es6', {
      debug: true,
      extensions: ['.es6']
    })
    .transform(babelify)
    .external(JS_REQUIREMENTS)
    .bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('watch-es6', function() {
  gulp.watch(WATCHED_ES6_SOURCES, function() {
    gulp.start('build-es6-app');
  });
});
