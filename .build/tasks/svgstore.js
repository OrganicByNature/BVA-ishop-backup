'use strict';

import fs from 'fs';
import inject from 'gulp-inject';
import { src, dest, watch, series } from 'gulp';
import gulpSvgStore from 'gulp-svgstore';

import config from './utils/config';

export const svgstoreGlob = [ 'dev/icons/**/*.svg' ];
export const storeGlob = [ 'dev/liquid/snippets/' ];

const storePath = `${storeGlob[0]}${config.svgstoreFileName}`;
const storeTemplate = '<div style="display: none;"><!-- inject:svg --><!-- endinject --></div>';

const fileToString = (filePath, file) => file.contents.toString();

export const svgstore = () => {
  const icons = src(svgstoreGlob)
    .pipe(gulpSvgStore({ inlineSvg: true }));

  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, storeTemplate);
  }

  return src(storePath)
    .pipe(inject(icons, { transform: fileToString, quiet: true }))
    .pipe(dest(storeGlob));
};

export const svgstoreWatch = () =>
  watch(svgstoreGlob, series(svgstore));

svgstore.displayName = 'svgstore';
svgstore.description = 'Compile SVG icons and output them to `dev/liquid/icon-store.liquid`';
