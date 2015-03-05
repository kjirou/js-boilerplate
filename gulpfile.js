var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpPlumber = require('gulp-plumber');
var gulpRename = require('gulp-rename');
var gulpStylus = require('gulp-stylus');
var notifier = require('node-notifier');
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

var onIgnoreError = function onIgnoreError(err) {
  console.log(this);
  console.error(err.stack || err);
  notifier.notify({
    message: err.message,
    title: 'Compile Error'
    // sound: 'Glass'
  });
  this.emit('end');
};


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
      // true で source map を付与する
      // 他の効果があるのかは未調査
      debug: true,
      extensions: ['.es6']
    })
    .transform(babelify)
    .external(JS_REQUIREMENTS)
    .bundle()
    // これで標準エラー処理を書き換えているので、コンパイル時にエラーに成っても終了しない
    // watch が落ちないのはいいけど、build が正常終了になる
    // 今のところ、同じようなタスクを2つ作って、片方は外すという方法しか不明
    .on('error', onIgnoreError)
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest('./public'))
  ;
});

gulp.task('watch-es6', function() {
  gulp.watch(WATCHED_ES6_SOURCES, function() {
    return gulp.start('build-es6-app');
  });
});

gulp.task('build-stylus', function() {
  // ちなみに stylus の @import はファイルが無くても例外を吐かないので
  // @require の方が良い
  gulp.src('./stylus/index.styl')
    // オプションの仕様は、一部の gulp-stylus 用のものを除いて stylus.render に渡される
    //
    // gulp-stylus options)
    // https://github.com/stevelacy/gulp-stylus/blob/master/index.js
    //
    // stylus.render options)
    // http://learnboost.github.io/stylus/docs/js.html
    //
    .pipe(gulpStylus({
      // stylus 内で import or require しないで css 上だけで事前に読み込みたい場合
      // import: ['nib'],
      // TODO: lineno 効いてない気がする
      lineno: true
    }))
    // デフォルトで成功しても何も出力しない（特に watch 時には gulp 出力もないので何もでない）
    // ので、不安ならこういう感じのを入れる
    .on('data', function() {
      console.log(new Date().toString() + ': Compiled stylus');
    })
    .pipe(gulpRename('styles.css'))
    .pipe(gulp.dest('./public'));
});
