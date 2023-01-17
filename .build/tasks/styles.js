'use strict';

import sass from 'gulp-sass';
import size from 'gulp-size';
import gulpif from 'gulp-if';
import rename from 'gulp-rename';
import postcss from 'gulp-postcss';
import { src, dest, watch, series } from 'gulp';
import { init as initSourcemap, write as writeSourcemap } from 'gulp-sourcemaps';

import { styles as settings } from './utils/settings';
import { isProduction, addLiquidExtension, handleSassError } from './utils/utility';

export const stylesEntry = [ 'dev/styles/*.scss' ];
export const stylesGlob = [ 'dev/styles/**/*.scss' ];

export const styles = () =>
  src(stylesEntry)
    .pipe(gulpif(!isProduction(), initSourcemap()))
    .pipe(sass(settings.sass).on('error', handleSassError))
    .pipe(postcss(settings.postcss))
    .pipe(gulpif(!isProduction(), writeSourcemap(...settings.sourcemap.write)))
    .pipe(rename(addLiquidExtension))
    .pipe(size(settings.size))
    .pipe(dest('deploy/assets'));

export const stylesWatch = () =>
  watch(stylesGlob, series(styles));

styles.description = 'Compiles SCSS, minifies, and runs postcss on files in `dev/styles`';
