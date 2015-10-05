var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', [
	'copy',
	'minify'
]);

gulp.task('copy', function () {
	return gulp.src('source/jquery.vvalid.js')
			.pipe(gulp.dest('dist'));
});

gulp.task('minify', function () {
	return gulp.src('source/jquery.vvalid.js')
			.pipe(uglify())
			.pipe(rename('jquery.vvalid.min.js'))
			.pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
	gulp.watch('source/jquery.vvalid.js', ['copy']);
	gulp.watch('source/jquery.vvalid.js', ['minify']);
});