'use strict';

import tap from 'gulp-tap';
import gulpif from 'gulp-if';
import { basename } from 'path';
import { src, dest, watch, series } from 'gulp';
import { warn } from 'fancy-log';
import flatten from 'gulp-flatten';
import changed from 'gulp-changed';
import { red, white } from 'chalk';

import { deleteFromDeploy } from './utils/utility';

const isAccountTemplate = file =>
  file.path.includes('templates/customers');

const vendorWarning = filePath =>
  `🚨  ${white.bgRed.bold(`WARNING!`)} ${red.bold(`\`${basename(filePath)}\` found inside of dev/liquid/assets! Consider renaming to \`legacy-${basename(filePath)}\``)}`;

const isVendorWarn = file => {
  if (file.path.search(/assets\/vendor\.(css|js)(\.liquid)?$/) > -1) {
    warn(vendorWarning(file.path));
  }
};

export const copyGlob = [ 'dev/liquid/**/*' ];

export const copy = () =>
  src(copyGlob, { base: 'dev/liquid' })
    .pipe(gulpif(isAccountTemplate, flatten({ includeParents: 2 }), flatten({ includeParents: 1 })))
    .pipe(changed('deploy/', { hasChanged: changed.compareContents }))
    .pipe(tap(isVendorWarn))
    .pipe(dest('deploy/'));

export const copyWatch = () =>
  watch(copyGlob, series(copy)).on('unlink', deleteFromDeploy);

copy.description = 'Copies files from `dev/liquid` directory into `/deploy`';
