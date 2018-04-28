const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();

gulp.task('default', () => {
	browserSync.init({
		server: './'
	});

	gulp.watch('sass/**/*.scss', gulp.parallel('styles'));
	gulp.watch('*.html').on('change', browserSync.reload);
});

gulp.task('styles', () => {
	gulp
		.src('sass/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(
			autoprefixer({
				browsers: [ 'last 2 versions' ]
			})
		)
		.pipe(gulp.dest('./css'))
		.pipe(browserSync.stream());
});
