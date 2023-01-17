'use strict';

import size from 'gulp-size';
import gulpif from 'gulp-if';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import uglifyjs from 'uglify-es';
import composer from 'gulp-uglify/composer';
import rename from 'gulp-rename';
import { src, dest, watch, series } from 'gulp';
import stripDebug from 'gulp-strip-debug';
import { init as initSourcemap, write as writeSourcemap } from 'gulp-sourcemaps';

import config from './utils/config';
import { scripts as settings } from './utils/settings';
import { isProduction, addLiquidExtension, handleUglifyError } from './utils/utility';

const uglify = composer(uglifyjs, console);

export const scriptsGlob = [
  'dev/scripts/base/define.js',
  'dev/scripts/priority/**/*.js',
  'dev/scripts/**/!(router)*.js',
  'dev/scripts/base/router.js'
];

export const scripts = () =>
  src(scriptsGlob, { allowEmpty: true })
    .pipe(gulpif(!isProduction(), initSourcemap()))
    .pipe(gulpif(config.babel, babel(settings.babel)))
    .pipe(concat(settings.BUNDLE_NAME))
    .pipe(uglify().on('error', handleUglifyError))
    .pipe(gulpif(isProduction() && config.stripDebug, stripDebug()))
    .pipe(gulpif(!isProduction(), writeSourcemap(...settings.sourcemap.write)))
    .pipe(rename(addLiquidExtension))
    .pipe(size(settings.size))
    .pipe(dest('deploy/assets'));

export const scriptsWatch = () =>
  watch(scriptsGlob, series(scripts));

scripts.description = 'Concatenates and uglifies JavaScript in `dev/scripts` (can also transpile using babel if enabled in `.config.json`)';
