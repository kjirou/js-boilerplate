var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var vinylTransform  = require('vinyl-transform');
var vinylSourceStream  = require('vinyl-source-stream');


var jsRequirements = [
  'backbone',
  'react'
];

var bundleES6 = function bundleES6() {
  return transform(function(fileName) {
    return browserify(fileName, {
        debug: true
      })
      .transform(babelify)
      .require()
      .bundle()
      .on('error', function(err){
        console.error(err.message);
        this.emit('end');
      })
    ;
  });
}

gulp.task('build-js-simple', function() {
  return browserify('./src/use-requirements.js', {
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
    .require(jsRequirements)
    .bundle()
    .pipe(vinylSourceStream('requirements.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('build-js-only-app', function() {
  return browserify('./src/use-requirements.js', {
      debug: true
    })
    .external(jsRequirements)
    .bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest('./public'))
  ;
});
