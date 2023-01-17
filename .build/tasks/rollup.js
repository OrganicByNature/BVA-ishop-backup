'use strict';

import { dest, watch, series } from 'gulp';
import size from 'gulp-size';
import gulpif from 'gulp-if';
import rename from 'gulp-rename';
import buffer from 'vinyl-buffer';
import rollup from 'rollup-stream';
import source from 'vinyl-source-stream';
import { basename, dirname } from 'path';
import { init as initSourcemap, write as writeSourcemap } from 'gulp-sourcemaps';

import { rollup as settings } from './utils/settings';
import { isProduction } from './utils/utility';

export const rollupEntry = 'dev/scripts/main.js';

export const rollupTaskGlob = [
  'dev/scripts/base/define.js',
  'dev/scripts/priority/**/*.js',
  'dev/scripts/**/!(router)*.js',
  'dev/scripts/base/router.js'
];

let cache;

export const rollupTask = () =>
  rollup({ ...settings.options, cache })
    .on('bundle', bundle => cache = bundle)
    .pipe(source(basename(rollupEntry), dirname(rollupEntry)))
    .pipe(buffer())
    .pipe(gulpif(!isProduction(), initSourcemap(settings.sourcemap.init)))
    .pipe(rename(settings.rename))
    .pipe(gulpif(!isProduction(), writeSourcemap(...settings.sourcemap.write)))
    .pipe(size(settings.size))
    .pipe(dest('deploy/assets'));

export const rollupTaskWatch = () =>
  watch(rollupTaskGlob, series(rollupTask));

rollupTask.displayName = 'rollup';
rollupTask.description = 'Performs module bundling using `dev/scripts/main.js` as entry point (enabled in `.config.json`)';
