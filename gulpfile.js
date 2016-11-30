var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var strip = require('gulp-strip-comments');
var header = require('gulp-header');
var license = '/*\n' +
		' * Project: vValid\n' +
		' * Description: A jQuery form validation plugin with customisation features\n' +
		' * Author: https://github.com/Wancieho\n' +
		' * License: MIT\n' +
		' * Version: 0.0.6\n' +
		' * Dependancies: jquery-1.*\n' +
		' * Date: 05/10/2015\n' +
		' */\n';

gulp.task('default', [
	'copy',
	'minify'
]);

gulp.task('copy', function () {
	return gulp.src('source/jquery.vvalid.js')
			.pipe(strip())
			.pipe(header(license))
			.pipe(gulp.dest('dist'));
});

gulp.task('minify', function () {
	return gulp.src('source/jquery.vvalid.js')
			.pipe(uglify())
			.pipe(header(license))
			.pipe(rename('jquery.vvalid.min.js'))
			.pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
	gulp.watch('source/jquery.vvalid.js', ['copy']);
	gulp.watch('source/jquery.vvalid.js', ['minify']);
});