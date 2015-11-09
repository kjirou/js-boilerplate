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
var SRC_FILE_PATH = path.join(SRC_ROOT, 'index.js');
var CSS_INDEX_FILE_PATH = path.join(SRC_ROOT, 'styles/index.css');


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

  var bundler = browserify(SRC_FILE_PATH, browserifyOptions);

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
      onError: function onError(err) {
        console.error(err.stack);
        notifier.notify({
          message: err.message,
          title: 'Build Error'
        });
        this.emit('end');
      }
    });
    bundling.pipe(browserSync.stream({ once: true }));
  });
});

gulp.task('build:css', function() {
  return gulp.src(CSS_INDEX_FILE_PATH)
    .pipe(gulpPostcss([
      autoprefixer(),
      postcssCustomProperties(),
      postcssSassyMixins()
    ], {
      syntax: postcssScss
    }))
    .pipe(gulpRename('app.css'))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
});

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: PUBLIC_ROOT
    },
    notify: false
  });
});

gulp.task('build', ['build:js']);
gulp.task('develop', ['watch:js', 'serve']);


//gulp.task('build-stylus', function() {
//  // ちなみに stylus の @import はファイルが無くても例外を吐かないので
//  // @require の方が良い
//  gulp.src('./stylus/index.styl')
//    // オプションの仕様は、一部の gulp-stylus 用のものを除いて stylus.render に渡される
//    //
//    // gulp-stylus options)
//    // https://github.com/stevelacy/gulp-stylus/blob/master/index.js
//    //
//    // stylus.render options)
//    // http://learnboost.github.io/stylus/docs/js.html
//    //
//    .pipe(gulpStylus({
//      // stylus 内で import or require しないで css 上だけで事前に読み込みたい場合
//      // import: ['nib'],
//      // TODO: lineno 効いてない気がする
//      lineno: true
//    }))
//    // デフォルトで成功しても何も出力しない（特に watch 時には gulp 出力もないので何もでない）
//    // ので、不安ならこういう感じのを入れる
//    .on('data', function() {
//      console.log(new Date().toString() + ': Compiled stylus');
//    })
//    .pipe(gulpRename('styles.css'))
//    .pipe(gulp.dest('./public'));
//});
