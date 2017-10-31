const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const gulpif = require('gulp-if');
const nunjucks = require('gulp-nunjucks');
const sass = require('gulp-sass');
const scssLint = require('gulp-scss-lint');
const sourcemaps = require('gulp-sourcemaps');
const standard = require('gulp-standard');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();
const browserify = require('browserify')
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const watchify = require('watchify');

const config = {
  src: './src',
  public: './public'
};

gulp.task('html', function () {
  gulp.src([`${config.src}/html/**/*.html`, `!${config.src}/html/shared/*`, `!${config.src}/html/layout/*`])
      .pipe(nunjucks.compile().on('error', function (err) {
        gutil.log(`[${err.plugin}] There is an error from ${err.fileName}`);
      }))
      .pipe(gulp.dest(config.public));
});

gulp.task('reload-html', ['html'], function () {
  browserSync.reload();
});

gulp.task('css', function () {
  gulp.src(`${config.src}/scss/**/*.scss`)
      .pipe(scssLint({config: './.scss-lint.yml'}))
      .pipe(gulpif(gutil.env.development, sourcemaps.init({ loadMaps: true })))
      .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
      .pipe(autoprefixer({ browsers: ['last 2 versions', 'ie > 9'], cascade: false }))
      .pipe(gulpif(gutil.env.development, sourcemaps.write('.')))
      .pipe(gulp.dest(`${config.public}/css`))
      .pipe(browserSync.stream());
});

gulp.task('bundle', function () {
  const bundler = browserify(`${config.src}/js/main.js`, { debug: true }).transform(babelify, { sourceMaps: false });
  return rebundle(bundler);
});

function watchBundler() {
  const bundler = watchify(browserify(`${config.src}/js/main.js`, { debug: true }).transform(babelify, { sourceMaps: false }));
  rebundle(bundler);
  bundler.on('update', function () {
    rebundle(bundler);
  });
  bundler.on('log', gutil.log);
  // This is a trick for listening event after generated bundle
  bundler.on('time', function () {
    browserSync.reload();
  });
}

function rebundle(bundler) {
  return bundler.bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpif(gutil.env.development, sourcemaps.init({ loadMaps: true })))
    .pipe(uglify({ compress: true, mangle: true }))
    .pipe(gulpif(gutil.env.development, sourcemaps.write('.')))
    .pipe(gulp.dest(`${config.public}/js`));
}

gulp.task('standard', function () {
  gulp.src(`${config.src}/js/**/*.js`)
      .pipe(standard())
      .pipe(standard.reporter('default', {
        quiet: true,
        showRuleNames: true,
        showFilePath: true
      }));
});

gulp.task('js', ['standard', 'bundle']);

gulp.task('serve', function () {
  browserSync.init({ server: config.public });
  gulp.watch(`${config.src}/html/**/*.html`, ['reload-html']);
  gulp.watch(`${config.src}/scss/**/*.scss`, ['css']);
  watchBundler();
});

gulp.task('default', ['html', 'css', 'js']);
