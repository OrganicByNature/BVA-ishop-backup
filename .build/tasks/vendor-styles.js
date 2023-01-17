'use strict';

import sass from 'gulp-sass';
import size from 'gulp-size';
import { src, dest, watch, series } from 'gulp';
import postcss from 'gulp-postcss';

import { handleSassError } from './utils/utility';
import { vendorStyles as settings } from './utils/settings';

export const vendorStylesGlob = [ 'dev/vendor/styles/**/*.scss' ];

export const vendorStyles = () =>
  src(vendorStylesGlob)
    .pipe(sass(settings.sass).on('error', handleSassError))
    .pipe(postcss(settings.postcss))
    .pipe(size(settings.size))
    .pipe(dest('deploy/assets'));

export const vendorStylesWatch = () =>
  watch(vendorStylesGlob, series(vendorStyles));

vendorStyles.displayName = 'vendor:styles';
vendorStyles.description = 'Compiles SCSS and minifies files in `dev/vendor/styles`';
