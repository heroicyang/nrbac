var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('mocha', function() {
  gulp.src('./test/**/*.test.js')
    .pipe(mocha({
      reporter: 'spec'
    }));
});

gulp.task('watch', function() {
  gulp.watch('./test/**/*.test.js', ['mocha']);
});

gulp.task('default', ['mocha', 'watch']);
