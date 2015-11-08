var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var gulpPlumber = require('gulp-plumber');
var gulpPostcss = require('gulp-postcss');
var gulpRename = require('gulp-rename');
var gulpStylus = require('gulp-stylus');
var licensify = require('licensify');
var notifier = require('node-notifier');
var path = require('path');
var postcss = require('postcss');
var vinylTransform  = require('vinyl-transform');
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
var DIST_FILE_NAME = 'app.js';


function createTransformer() {
  return babelify.configure({
    // configure babel options)
    // http://babeljs.io/docs/usage/options/
  });
}

function createBundler(transformer, options) {
  options = options || {};
  var isWatchfied = Boolean(options.isWatchfied);  // default = false

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

  bundler.transform(transformer);

  if (isWatchfied) {
    bundler = watchify(bundler);
  }

  return bundler;
}

function bundle(bundler, options) {
  options = options || {};
  var onError = options.onError || function onError(err) { throw err; };

  return bundler
    .bundle()
    .on('error', onError)
    .pipe(vinylSourceStream(DIST_FILE_NAME))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
}


gulp.task('build:js', function() {
  var transformer = createTransformer();
  var bundler = createBundler(transformer, {
    debug: true  // Append source map
    //extensions: ['js', 'jsx']
  });
  return bundle(bundler);
});

gulp.task('watch:js', function() {
  var transformer = createTransformer();
  var bundler = createBundler(transformer, {
    isWatchfied: true,
    debug: true
  });
  bundler.on('update', function() {
    bundle(bundler, {
      onError: function onError() {
        console.error(err.stack);
        notifier.notify({
          message: err.message,
          title: 'Build Error'
        });
        this.emit('end');
      }
    });
  });
});

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: PUBLIC_ROOT
    }
  });
});


//gulp.task('build-js-requirements', function() {
//  return browserify({
//      debug: true
//    })
//    .require(JS_REQUIREMENTS)
//    .plugin(licensify)
//    .bundle()
//    .pipe(vinylSourceStream('requirements.js'))
//    .pipe(gulp.dest('./public'))
//  ;
//});
//
//gulp.task('build-js-app', function() {
//  return browserify('./js/index.js', {
//      debug: true
//    })
//    .external(JS_REQUIREMENTS)
//    .bundle()
//    .pipe(vinylSourceStream('bundle.js'))
//    .pipe(gulp.dest('./public'))
//  ;
//});
//
//gulp.task('watch-es6', function() {
//  gulp.watch(WATCHED_ES6_SOURCES, function() {
//    return gulp.start('build-es6-app');
//  });
//});
//
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
//
//gulp.task('postcss', function() {
//  return browserify('./es6/index.es6', {
//      debug: true,
//      extensions: ['.es6']
//    })
//    .transform(babelify)
//    .bundle()
//    .pipe(vinylSourceStream('bundle.js'))
//    .pipe(gulp.dest('./public'))
//  ;
//});
//
//function onPostcssSass(options) {
//  var stream = new require('stream').Transform({objectMode: true});
//  stream._transform = function(file, encoding, cb) {
//    if (file.isNull()) {
//      return cb(null, file);
//    }
//    if (file.isStream()) {
//      return cb(new Error('gulp-postcss-scss', 'ERROR!!'));
//      //return cb(new PluginError('gulp-postcss-scss', error));
//    } else if (file.isBuffer()) {
//      try {
//        var result = nano.process(String(file.contents), assign(options, {
//            map: (file.sourceMap) ? {annotation: false} : false,
//            from: file.relative,
//            to: file.relative
//        }));
//        if (result.map && file.sourceMap) {
//            applySourceMap(file, String(result.map));
//            file.contents = new Buffer(result.css);
//        } else {
//            file.contents = new Buffer(result);
//        }
//
//        this.push(file);
//      } catch (e) {
//        var p = new PluginError(PLUGIN_NAME, e, {fileName: file.path});
//        this.emit('error', p);
//      }
//        cb();
//      }
//    }
//  };
//  return stream;
//}
//
//gulp.task('postcss', function() {
//  return gulp.src('./postcss/index.css')
//    .pipe(gulpPostcss([
//      //require('autoprefixer-core')(),
//      //require('postcss-custom-properties')()
//      //require('postcss-sassy-mixins')()
//      //require('cssnano')()
//    ], {
//      //syntax: require('postcss-scss')
//    }))
//    .pipe(gulpRename('postcss.css'))
//    .pipe(gulp.dest('./public'))
//  ;
//});
