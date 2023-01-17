'use strict';

import gulpif from 'gulp-if';
import watch from 'gulp-watch';
import rename from 'gulp-rename';
import shopify from 'gulp-shopify-upload-with-callbacks';

import { bs } from './browser-sync';

import flags from './utils/flags';
import { upload as settings } from './utils/settings';

const updatePathForBrowserSync = path => {
  if (path.basename === 'bvaccel.css' && path.extname === '.liquid') {
    path.basename = 'bvaccel';
    path.extname = '.css';
  }
};

export const uploadGlob = [ 'deploy/**/*' ];

export const upload = () => {
  watch(uploadGlob)
    .pipe(shopify(...settings.shopify))
    .pipe(rename(updatePathForBrowserSync))
    .pipe(gulpif(flags.browserSync, bs.stream()));
  return Promise.resolve(true);
};

upload.description = 'Uploads changes to Shopify theme defined in `.env`';
