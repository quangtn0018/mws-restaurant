const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');

gulp.task('default', () => {
	browserSync.init({
		server: './'
	});

	gulp.watch('sass/**/*.scss', gulp.parallel('styles'));
});

gulp.task('styles', (done) => {
	gulp
		.src('sass/**/*.scss')
		.pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
		.pipe(
			autoprefixer({
				browsers: [ 'last 2 versions' ]
			})
		)
		.pipe(gulp.dest('./css'))
		.pipe(browserSync.stream());

	done();
});
