'use strict';

import { src, dest, watch, series } from 'gulp';
import flatten from 'gulp-flatten';
import changed from 'gulp-changed';

import { deleteFromDeploy } from './utils/utility';

export const imageCopyGlob = [ 'dev/images/**/*' ];

export const imageCopy = () =>
  src(imageCopyGlob)
    .pipe(flatten())
    .pipe(changed('deploy/assets', { hasChanged: changed.compareContents }))
    .pipe(dest('deploy/assets'));

export const imageCopyWatch = () =>
  watch(imageCopyGlob, series(imageCopy)).on('unlink', deleteFromDeploy);

imageCopy.description = 'Copies images from `dev/images` into `/deploy/assets`';
imageCopy.displayName = 'image:copy';
