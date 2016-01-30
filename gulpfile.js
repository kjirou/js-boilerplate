'use strict';

const autoprefixer = require('autoprefixer');
const babelify = require('babelify');
const browserSync = require('browser-sync');
const browserify = require('browserify');
const fs = require('fs');
const gulp = require('gulp');
const gulpConcat = require('gulp-concat');
const gulpImageDataURI = require('gulp-image-data-uri');
const gulpPostcss = require('gulp-postcss');
const gulpRename = require('gulp-rename');
const gulpShell = require('gulp-shell');
const licensify = require('licensify');
const notifier = require('node-notifier');
const path = require('path');
const postcssCustomProperties = require('postcss-custom-properties');
const postcssconst = require('postcss-import');
const postcssNested = require('postcss-nested');
const postcssScss = require('postcss-scss');
const runSequence = require('run-sequence');
const vinylSourceStream  = require('vinyl-source-stream');
const watchify = require('watchify');


const ROOT = __dirname;
const SRC_ROOT = path.join(ROOT, 'src');
const PUBLIC_ROOT = path.join(ROOT, 'public');
const PUBLIC_DIST_ROOT = path.join(PUBLIC_ROOT, 'dist');
const JS_SOURCE_INDEX_FILE_PATH = path.join(SRC_ROOT, 'index.js');
const CSS_SOURCE_INDEX_FILE_PATH = path.join(SRC_ROOT, 'styles/index.scss');
const CSS_SOURCE_PATTERN = path.join(SRC_ROOT, '**/*.scss');
const IMAGES_FILE_PATH = path.join(SRC_ROOT, '**/*.{gif,jpg,png}');

const browserSyncInstance = browserSync.create();

const babelRc = fs.readFileSync(path.join(ROOT, '.babelrc'));
const babelRcData = JSON.parse(babelRc.toString());


/*
 * Utils
 */

const handleErrorAsWarning = function(err) {
  console.error(err.stack || err.message);
  notifier.notify({
    message: err.message,
    title: 'Gulp Error',
  });
  this.emit('end');
}


/*
 * .js builders
 */

const createBabelTransformer = () => {
  return babelify.configure({
    // Configure babel options here
    // Ref) http://babeljs.io/docs/usage/options/
    presets: babelRcData.presets,
  });
};

const createJsSourcesBundler = (indexFilePath, options) => {
  options = Object.assign({
    transformer: createBabelTransformer(),
    isWatchfied: false,
  }, options || {});

  const browserifyOptions = {
    debug: true,
  };

  if (options.isWatchfied) {
    Object.assign(browserifyOptions, watchify.args);
  }

  // Pass options to browserify by whitelist
  [
    'debug'
  ].forEach(key => {
    if (key in options) {
      browserifyOptions[key] = options[key];
    }
  });

  let bundler = browserify(indexFilePath, browserifyOptions);

  if (options.transformer) {
    bundler.transform(options.transformer);
  }

  if (options.isWatchfied) {
    bundler = watchify(bundler);
  }

  return bundler;
}

const bundleJsSources = (bundler, options) => {
  options = Object.assign({
    errorHandler: function(err) { throw err; },
    outputFileName: 'app.js',
  }, options || {});

  return bundler
    .bundle()
    .on('error', options.errorHandler)
    .pipe(vinylSourceStream(options.outputFileName))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
}

gulp.task('build:js', function() {
  const bundler = createJsSourcesBundler(JS_SOURCE_INDEX_FILE_PATH);
  return bundleJsSources(bundler);
});

gulp.task('watch:js', function() {
  const bundler = createJsSourcesBundler(JS_SOURCE_INDEX_FILE_PATH, {
    isWatchfied: true,
  });
  bundleJsSources(bundler);  // TODO: Why is this necessary?

  bundler.on('update', function() {
    console.log(`Built .js at ${ new Date().toTimeString() }`);
    bundleJsSources(bundler, { errorHandler: handleErrorAsWarning })
      .pipe(browserSyncInstance.stream({ once: true }))
    ;
  });
});


/*
 * .css builders
 */

const createPostcssTransformer = () => {
  return gulpPostcss(
    [
      postcssImport(),
      postcssCustomProperties(),
      postcssNested(),
      autoprefixer(),
    ],
    {
      syntax: postcssScss
    }
  );
};

const bundleCssSources = (indexFilePath, options) => {
  options = Object.assign({
    transformer: createPostcssTransformer(),
    errorHandler: function(err) { throw err; },
    outputFileName: 'app.css',
  }, options || {});

  return gulp.src(indexFilePath)
    .pipe(options.transformer)
    .on('error', options.errorHandler)
    .pipe(gulpRename(options.outputFileName))
    .pipe(gulp.dest(PUBLIC_DIST_ROOT))
  ;
};

gulp.task('build:css', function() {
  return bundleCssSources(CSS_SOURCE_INDEX_FILE_PATH);
});

gulp.task('watch:css', function() {
  gulp.watch([CSS_SOURCE_PATTERN], function() {
    return bundleCssSources(CSS_SOURCE_INDEX_FILE_PATH, { errorHandler: handleErrorAsWarning })
      .pipe(browserSyncInstance.stream({ once: true }))
      .on('data', () => console.log(`Built .css at ${ new Date().toTimeString() }`))
    ;
  });
});


/*
 * Static files
 */

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
    return createStylesheetsBundler({ onError: handleErrorAsWarning })
      .pipe(browserSyncInstance.stream({ once: true }))
      .on('data', function() {
        console.log('Build stylesheets at ' + new Date().toTimeString());
      })
    ;
  });

  // images
  // Note: This task is almost useless, because gulp can not observe new files
  gulp.watch([IMAGES_FILE_PATH], function() {
    return gulp.src(IMAGES_FILE_PATH)
      .on('error', handleErrorAsWarning)
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
  browserSyncInstance.init({
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
